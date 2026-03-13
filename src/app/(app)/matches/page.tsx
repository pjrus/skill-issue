"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { matchingService } from '@/services/matchingService';
import type { Match } from '@/types/matchTypes';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, BookOpen, User, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
                    Book a Session
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}

export default function MatchesPage() {
  const { user } = useUser();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      matchingService.findMatches(user.id)
        .then(setMatches)
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  return (
    <div className="container py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Your Matches</h1>
        <p className="text-muted-foreground">Here are your top learning partners based on your skills.</p>
      </div>
      
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MatchCardSkeleton />
            <MatchCardSkeleton />
            <MatchCardSkeleton />
        </div>
      )}

      {!isLoading && matches.length === 0 && (
         <Card className="col-span-full mt-10 flex flex-col items-center justify-center py-20 text-center">
            <CardHeader>
                <div className="mx-auto bg-secondary p-3 rounded-full">
                    <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle>No Matches Found</CardTitle>
                <CardDescription>
                    We couldn't find any partners for you yet. <br/>
                    Try updating your skills to get better results.
                </CardDescription>
            </CardHeader>
            <CardFooter>
                 <Button onClick={() => window.location.href = '/settings'}>Update My Skills</Button>
            </CardFooter>
        </Card>
      )}

      {!isLoading && matches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
