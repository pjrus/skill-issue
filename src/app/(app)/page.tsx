"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { matchingService } from '@/services/matchingService';
import type { Match } from '@/types/matchTypes';
import { getSampleDescription } from "@/lib/userUtils";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

import { Loader2, ArrowRight, Users, Sparkles, Book, Search, Star } from 'lucide-react';
import { databaseService } from '@/services/databaseService';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/types/userTypes';
import { MatchCard, MatchCardSkeleton, UserReviewSnippet } from '@/components/matches/match-card';
import { reviewService } from '@/services/reviewService';
import Link from 'next/link';



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

  // Fetch match data:
  // We prioritize showing recommended matches (bidirectional swaps),
  // but also fetch all other users to support the "View all" toggle.
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
      const newSkillsWanted = searchTermWanted.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const newSkillsOffered = searchTermOffered.split(',').map(s => s.trim()).filter(s => s.length > 0);

      // Skill Normalization and Uniqueness:
      // We normalize all skills to lowercase for comparison.
      // Then, we only add skills that the user doesn't already have in their list.
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

      toast({ title: 'Skills Updated', description: 'Finding matches for you...' });
      
      // Redirect to matches page with the newly added wanted skills
      const queryParams = new URLSearchParams();
      if (newSkillsWanted.length > 0) {
        queryParams.set('wanted', newSkillsWanted.join(','));
      }
      
      router.push(`/matches?${queryParams.toString()}`);
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
    <div className="container pt-10 pb-8 space-y-10">
      {/* Hero greeting */}
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md">
              <AvatarImage src={user?.avatarUrl} alt={user?.username} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {user?.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">
              {new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'},
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{user?.fullName || user?.username}</h1>
          </div>
        </div>
      </section>

      {/* Top Section: Find your next Skill Swap Card */}
      <section>

        <Card className="w-full shadow-sm border-muted bg-card">
          <CardHeader className="pt-8 pb-4">
            <CardTitle className="flex items-center gap-2 text-xl font-semibold">
              <Book className="w-5 h-5" />
              Have a Skill Issue?
            </CardTitle>
            <CardDescription className="text-sm">Look no further, Skilliton is here! Just fill in the following fields, or Chat with Skilliton.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-medium font-medium">What do you want to teach?</label>
                <Input
                  placeholder="e.g. Graphic Design, Algebra, Baking..."
                  className="bg-background/50"
                  value={searchTermOffered}
                  onChange={(e) => setSearchTermOffered(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-medium font-medium">What do you want to learn?</label>
                <Input
                  placeholder="e.g. React, Spanish, Guitar..."
                  className="bg-background/50"
                  value={searchTermWanted}
                  onChange={(e) => setSearchTermWanted(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleSearch}
                disabled={isSaving}
                className="px-8 flex items-center gap-2"
                variant="secondary"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => router.push('/ai-chat')}
            className="w-full gap-2 text-muted-foreground dark:text-white bg-card shadow-sm hover:text-foreground hover:bg-muted/50 py-6 mt-4"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Chat with Skilliton to fix your Skill Issue
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            {viewAll ? "All Users" : "Recommended Users"}
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
                We couldn't find a match right now. Try updating your skills or chatting with Skilliton to broaden your profile!
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
              <Card key={u.id} className="flex flex-col hover:shadow-lg transition-all duration-300 group overflow-hidden">
                <Link href={`/user/${u.id}`} className="flex-grow flex flex-col">
                  <CardHeader className="flex flex-row items-center gap-4 group-hover:bg-muted/50 transition-colors">
                    <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary/20 transition-all">
                      <AvatarImage src={u.avatarUrl} alt={u.username} />
                      <AvatarFallback>{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="group-hover:text-primary transition-colors">{u.username}</CardTitle>
                      <CardDescription>Skill-Issue User</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-grow space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground italic">
                      "{u.profileDescription || getSampleDescription(u.id)}"
                    </p>

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

                    <div className="mt-4 pt-4 border-t border-border/50">
                       <UserReviewSnippet userId={u.id} />
                    </div>
                  </CardContent>
                </Link>
                <CardFooter className="pt-0">
                  <Button className="w-full" variant="outline" onClick={() => router.push(`/user/${u.id}`)}>
                    View Profile
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
