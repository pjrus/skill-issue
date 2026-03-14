"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { matchingService } from '@/services/matchingService';
import type { Match } from '@/types/matchTypes';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import { Loader2, ArrowRight, Users, Sparkles } from 'lucide-react';
import { databaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types/userTypes';

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
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={otherUser.avatarUrl} alt={otherUser.username} />
          <AvatarFallback>{otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle>{otherUser.username}</CardTitle>
          <CardDescription>Potential skill swap</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <p className="text-sm text-muted-foreground italic">"{match.aiSummary}"</p>
        
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">You will learn:</h4>
          <div className="flex flex-wrap gap-2">
            {skillsYouGet.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">You will teach:</h4>
          <div className="flex flex-wrap gap-2">
            {skillsYouGive.map(skill => <Badge key={skill}>{skill}</Badge>)}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={() => router.push(`/booking/${match.id}`)}>
          Connect
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, updateUserContext } = useUser();
  const { toast } = useToast();
  
  const [searchTermWanted, setSearchTermWanted] = useState('');
  const [searchTermOffered, setSearchTermOffered] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Matches state
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);

  const [viewAll, setViewAll] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Fetch match data
  const loadMatches = async () => {
    if (user) {
      setIsLoadingMatches(true);
      try {
        const results = await matchingService.findMatches(user.id);
        setMatches(results);
        
        // Also fetch all users for the "View all" functionality
        const users = await databaseService.getUsers();
        setAllUsers(users.filter(u => u.id !== user.id));
      } catch (e) {
        console.error("Error loading matches:", e);
      } finally {
        setIsLoadingMatches(false);
      }
    }
  };

  useEffect(() => {
    loadMatches();
  }, [user]);

  const handleSearch = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // Create arrays by splitting on commas and trimming whitespace
      const newSkillsWanted = searchTermWanted.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const newSkillsOffered = searchTermOffered.split(',').map(s => s.trim()).filter(s => s.length > 0);

      // Concatenate and remove duplicates case-insensitively
      const normalize = (s: string) => s.toLowerCase();
      
      const existingWantedNormalized = (user.skillsWanted || []).map(normalize);
      const uniqueNewWanted = newSkillsWanted.filter(s => !existingWantedNormalized.includes(normalize(s)));
      const updatedSkillsWanted = [...(user.skillsWanted || []), ...uniqueNewWanted];

      const existingOfferedNormalized = (user.skillsOffered || []).map(normalize);
      const uniqueNewOffered = newSkillsOffered.filter(s => !existingOfferedNormalized.includes(normalize(s)));
      const updatedSkillsOffered = [...(user.skillsOffered || []), ...uniqueNewOffered];

      const updatedUser = await databaseService.updateUser(user.id, {
        skillsWanted: updatedSkillsWanted,
        skillsOffered: updatedSkillsOffered
      });
      
      if (updatedUser) {
        updateUserContext(updatedUser);
      }
      
      setSearchTermWanted('');
      setSearchTermOffered('');

      toast({ title: 'Skills Updated', description: 'Refreshing your matches...' });
      await loadMatches();
    } catch (error) {
       console.error(error);
       toast({
         variant: 'destructive',
         title: 'Error',
         description: 'Failed to search/update skills. Please try again.',
       });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container py-8 space-y-12">
      
      {/* Top Section: Discover Connections Card */}
      <section>
        <Card className="w-full shadow-sm border-muted bg-card">
          <CardHeader className="pb-4">
             <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Sparkles className="w-5 h-5" />
              Discover Connections
            </CardTitle>
            <CardDescription className="text-sm">What are you looking to achieve today?</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">What do you want to learn?</label>
                  <Input 
                    placeholder="e.g. React, Spanish, Guitar..." 
                    className="bg-background/50" 
                    value={searchTermWanted}
                    onChange={(e) => setSearchTermWanted(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">What do you want to teach?</label>
                  <Input 
                    placeholder="e.g. Graphic Design, Algebra, Baking..." 
                    className="bg-background/50" 
                    value={searchTermOffered}
                    onChange={(e) => setSearchTermOffered(e.target.value)}
                  />
                </div>
             </div>
             <div className="flex justify-end pt-2">
                <Button 
                   onClick={handleSearch} 
                   disabled={isSaving}
                   className="px-8"
                   variant="secondary"
                >
                   {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                   Search
                </Button>
             </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            {viewAll ? "All Skill Swappers" : "Recommended Skill Swappers"}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
              {viewAll ? allUsers.length : matches.length} found
            </span>
            <Button 
              variant="link" 
              className="p-0 h-auto font-medium"
              onClick={() => setViewAll(!viewAll)}
            >
              {viewAll ? "Show Matches" : "View all"}
            </Button>
          </div>
        </div>

        {isLoadingMatches && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
          </div>
        )}

        {!isLoadingMatches && !viewAll && matches.length === 0 && (
          <Card className="col-span-full py-16 text-center border-dashed">
            <CardHeader>
              <div className="mx-auto bg-primary/10 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">No exact matches found yet</CardTitle>
              <CardDescription className="max-w-md mx-auto mt-2">
                We couldn't find a perfect overlapped match right now. Try updating your skills or asking the assistant above to broaden your profile!
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!isLoadingMatches && !viewAll && matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {!isLoadingMatches && viewAll && allUsers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allUsers.map((u) => (
              <Card key={u.id} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={u.avatarUrl} alt={u.username} />
                    <AvatarFallback>{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{u.username}</CardTitle>
                    <CardDescription>Skill Swapper</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Offers:</h4>
                    <div className="flex flex-wrap gap-2">
                      {u.skillsOffered?.length ? (
                        u.skillsOffered.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)
                      ) : (
                        <span className="text-sm text-muted-foreground italic">None listed</span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Wants:</h4>
                    <div className="flex flex-wrap gap-2">
                      {u.skillsWanted?.length ? (
                        u.skillsWanted.map(skill => <Badge key={skill}>{skill}</Badge>)
                      ) : (
                        <span className="text-sm text-muted-foreground italic">None listed</span>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" disabled>
                    Connect
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
