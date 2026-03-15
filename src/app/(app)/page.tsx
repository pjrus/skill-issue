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
import { reviewService } from '@/services/reviewService';

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

import Link from 'next/link';

function UserReviewSnippet({ userId }: { userId: string }) {
  const [lastReview, setLastReview] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const reviews = await reviewService.getReviewsForUser(userId);
        setCount(reviews.length);
        if (reviews.length > 0) {
          setLastReview(reviews[0].reviewText);
          const totalRating = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
          setAverageRating(totalRating / reviews.length);
        }
      } catch (error) {
        console.error("Error fetching reviews for snippet:", error);
      }
    };
    fetchReviews();
  }, [userId]);

  if (count === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/50">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {count} Review{count > 1 ? 's' : ''}
          </span>
        </div>
        {averageRating !== null && (
          <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full border border-border/50">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] font-bold">{averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>
      {lastReview && (
        <p className="text-xs text-muted-foreground line-clamp-2 italic">
          "{lastReview}"
        </p>
      )}
    </div>
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
    <Card className="flex flex-col hover:shadow-lg transition-all duration-300 group overflow-hidden">
      <Link href={`/user/${otherUser.id}`} className="flex-grow flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4 group-hover:bg-muted/50 transition-colors">
          <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary/20 transition-all">
            <AvatarImage src={otherUser.avatarUrl} alt={otherUser.username} />
            <AvatarFallback>{otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="group-hover:text-primary transition-colors">{otherUser.username}</CardTitle>
            <CardDescription>Potential skill swap</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex-grow space-y-4 pt-4">
          <p className="text-sm text-muted-foreground italic">
            "{otherUser.profileDescription || getSampleDescription(otherUser.id)}"
          </p>


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

          <UserReviewSnippet userId={otherUser.id} />
        </CardContent>
      </Link>
      <CardFooter className="pt-0 gap-2 flex-col sm:flex-row">
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => router.push(`/user/${otherUser.id}`)}
        >
          View Profile
        </Button>
        <Button 
          className="w-full" 
          onClick={() => router.push(`/booking/${match.id}`)}
        >
          Book Swap
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

      toast({ title: 'Skills Updated', description: 'Refreshing your matches...' });
      await matchingService.refreshMatches(user.id);
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

                    <UserReviewSnippet userId={u.id} />
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
