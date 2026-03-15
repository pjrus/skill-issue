"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import type { Match } from '@/types/matchTypes';
import { getSampleDescription } from "@/lib/userUtils";
import { reviewService } from '@/services/reviewService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';

export function MatchCardSkeleton() {
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

export function UserReviewSnippet({ userId }: { userId: string }) {
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

export function MatchCard({ match }: { match: Match }) {
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
    <Card className="flex flex-col hover:shadow-lg transition-all duration-300 group overflow-hidden bg-card">
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
