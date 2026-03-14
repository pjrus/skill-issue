"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { matchingService } from '@/services/matchingService';
import { aiService } from '@/services/aiService';
import { databaseService } from '@/services/databaseService';
import type { Match } from '@/types/matchTypes';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ArrowRight, Users, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

function MatchCardSkeleton() {
    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="space-y-3">
                     <Skeleton className="h-3 w-[120px]" />
                     <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                     </div>
                </div>
                <div className="space-y-3">
                     <Skeleton className="h-3 w-[120px]" />
                     <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                     </div>
                </div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    );
}


function MatchCard({ match }: { match: Match }) {
    const router = useRouter();
    const { user: currentUser } = useUser();
    if (!currentUser) return null;

    const otherUser = match.users.find(u => u.id !== currentUser.id);
    if (!otherUser) return null;
    
    const { aToB, bToA } = match.matchedSkills;

    const currentUserIsA = match.users[0].id === currentUser.id;
    const skillsYouGet = currentUserIsA ? bToA : aToB;
    const skillsYouGive = currentUserIsA ? aToB : bToA;

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={otherUser.avatarUrl} alt={otherUser.username} />
                    <AvatarFallback>{otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle>{otherUser.username}</CardTitle>
                    <CardDescription>{match.score > 0 ? "Potential skill swap" : "User on platform"}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                 <p className="text-sm text-muted-foreground italic">"{match.aiSummary}"</p>
                
                 {match.score > 0 ? (
                     <>
                        {skillsYouGet.length > 0 && (
                         <div className="space-y-2">
                            <h4 className="text-sm font-semibold">You will learn:</h4>
                            <div className="flex flex-wrap gap-2">
                                 {skillsYouGet.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
                            </div>
                        </div>
                        )}
                        {skillsYouGive.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">You will teach:</h4>
                             <div className="flex flex-wrap gap-2">
                                {skillsYouGive.map(skill => <Badge key={skill}>{skill}</Badge>)}
                            </div>
                        </div>
                        )}
                     </>
                 ) : (
                     <>
                         <div className="space-y-2">
                            <h4 className="text-sm font-semibold">They know:</h4>
                            <div className="flex flex-wrap gap-2">
                                {otherUser.skillsOffered.length > 0 ? (
                                    otherUser.skillsOffered.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)
                                ) : (
                                    <span className="text-sm text-muted-foreground">None listed</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">They want to learn:</h4>
                            <div className="flex flex-wrap gap-2">
                                {otherUser.skillsWanted.length > 0 ? (
                                    otherUser.skillsWanted.map(skill => <Badge key={skill} variant="outline">{skill}</Badge>)
                                ) : (
                                    <span className="text-sm text-muted-foreground">None listed</span>
                                )}
                            </div>
                        </div>
                     </>
                 )}
            </CardContent>
            <CardFooter>
                <Button className="w-full" onClick={() => router.push(`/booking/${match.id}`)}>
                    Book a Session
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function HomePage() {
  const { user, updateUserContext } = useUser();
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  
  const [learnInput, setLearnInput] = useState('');
  const [teachInput, setTeachInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const fetchMatches = async (userId: string) => {
    setIsLoadingMatches(true);
    try {
      const result = await matchingService.findMatches(userId);
      setMatches(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMatches(user.id);
    }
  }, [user?.id]); // Only re-run if ID changes or on mount

  const handleSearch = async () => {
    if (!learnInput && !teachInput) return;
    if (!user) return;
    
    setIsExtracting(true);
    try {
      const description = `I want to learn: ${learnInput || "nothing"}. I want to teach: ${teachInput || "nothing"}.`;
      const result = await aiService.extractSkillsFromText({ 
        description, 
        model: user.preferredModel,
        apiKey: user.apiKey
      });
      
      const newSkillsOffered = Array.from(new Set([...user.skillsOffered, ...result.skillsOffered]));
      const newSkillsWanted = Array.from(new Set([...user.skillsWanted, ...result.skillsWanted]));

      const updatedUser = await databaseService.updateUser(user.id, {
        skillsOffered: newSkillsOffered,
        skillsWanted: newSkillsWanted,
      });
      if (updatedUser) {
        updateUserContext(updatedUser);
        // Refresh matches with the newly updated skills!
        fetchMatches(user.id);
        
        toast({
          title: "Skills updated",
          description: "We're finding new matches for you based on your input.",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process your request. Please try again.',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="container py-10 max-w-5xl mx-auto space-y-10">
      
      {/* Search Input Section Top */}
      <Card className="bg-gradient-to-br from-card to-secondary/20 shadow-lg border-primary/20">
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              Discover Connections
           </CardTitle>
           <CardDescription>What are you looking to achieve today?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-sm font-medium">What do you want to learn?</label>
                 <Input 
                   placeholder="e.g. React, Spanish, Guitar..." 
                   value={learnInput} 
                   onChange={(e) => setLearnInput(e.target.value)}
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-sm font-medium">What do you want to teach?</label>
                 <Input 
                   placeholder="e.g. Graphic Design, Algebra, Baking..." 
                   value={teachInput} 
                   onChange={(e) => setTeachInput(e.target.value)} 
                 />
               </div>
           </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={handleSearch} disabled={isExtracting || (!learnInput && !teachInput)}>
            {isExtracting ? (
               <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gathering Recommendations...</>
            ) : (
               'Search'
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Recommended Matches Section Below */}
      <div>
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Recommended Matches</h2>
            <p className="text-muted-foreground mt-1">People who fit what you're looking for, sorted by relevance.</p>
          </div>
          {matches.filter(m => m.score === 0).length > 0 && (
            <Button variant="outline" onClick={() => setShowAllUsers(!showAllUsers)}>
              {showAllUsers ? "Show Recommended Only" : "Show All Users"}
            </Button>
          )}
        </div>
        
        {isLoadingMatches ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <MatchCardSkeleton />
              <MatchCardSkeleton />
              <MatchCardSkeleton />
          </div>
        ) : matches.filter(m => m.score > 0).length === 0 && !showAllUsers ? (
           <Card className="col-span-full mt-2 flex flex-col items-center justify-center py-16 text-center border-dashed">
              <CardHeader>
                  <div className="mx-auto bg-secondary p-3 rounded-full">
                      <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <CardTitle>No Direct Matches Found</CardTitle>
                  <CardDescription>
                      We couldn't find any direct partners for you yet. <br/>
                      {matches.length > 0 
                        ? "But you can still browse everyone on the platform!" 
                        : "Try using the search above to update your skills and broaden your horizons!"}
                  </CardDescription>
              </CardHeader>
              {matches.length > 0 && (
                  <CardFooter>
                      <Button onClick={() => setShowAllUsers(true)}>Show all users</Button>
                  </CardFooter>
              )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(showAllUsers ? matches : matches.filter(m => m.score > 0)).map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
