"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase';
import { matchingService } from '@/services/matchingService';
import type { Match } from '@/types/matchTypes';
import { MatchCard, MatchCardSkeleton } from '@/components/matches/match-card';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MatchesPage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const wantedParam = searchParams.get('wanted');
  const filteredSkills = wantedParam ? decodeURIComponent(wantedParam).split(',').map(s => s.trim()).filter(Boolean) : [];

  const loadMatches = async (silent = false) => {
    if (user) {
      if (!silent) setIsLoading(true);
      try {
        const results = await matchingService.findMatches(user.id);
        setMatches(results);
      } catch (e) {
        console.error("Error loading matches:", e);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load matches.',
        });
      } finally {
        if (!silent) setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    loadMatches();
  }, [user]);

  const handleRefresh = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await matchingService.refreshMatches(user.id);
      await loadMatches(true);
      toast({ title: 'Matches Refreshed' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredMatches = () => {
    if (filteredSkills.length === 0) return matches;
    
    return matches.filter(match => {
      const otherUserIndex = match.users[0].id === user?.id ? 1 : 0;
      // We want to see if the other user can teach us something we want right now
      const skillsTheyCanTeachMe = otherUserIndex === 1 ? match.matchedSkills.bToA : match.matchedSkills.aToB;
      
      return skillsTheyCanTeachMe.some(skill => 
        filteredSkills.some(fs => {
            const s1 = skill.toLowerCase().trim();
            const s2 = fs.toLowerCase().trim();
            return s1 === s2 || s1.includes(s2) || s2.includes(s1);
        })
      );
    });
  };

  const displayMatches = getFilteredMatches();

  return (
    <div className="container py-10 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => router.push('/')}
                className="-ml-2 h-8 gap-1 text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" /> Back to Home
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Your Matches</h1>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">
            {filteredSkills.length > 0 
              ? `Showing people who can teach you: ${filteredSkills.join(', ')}`
              : `We found ${matches.length} people you can swap skills with today!`
            }
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Matches
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <MatchCardSkeleton />
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </div>
      ) : displayMatches.length === 0 ? (
        <Card className="py-20 text-center border-dashed bg-muted/20">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-6 rounded-full mb-6 w-fit">
              <Users className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">No specific matches found</CardTitle>
            <CardDescription className="max-w-md mx-auto mt-4 text-base">
              {filteredSkills.length > 0 
                ? `We couldn't find anyone currently teaching "${filteredSkills.join(', ')}". Try searching for something else or check your general matches.`
                : "Don't worry! Try adding more skills you offer or want to learn, or chat with Skilliton to help expand your profile."
              }
            </CardDescription>
            <div className="mt-8 flex justify-center gap-4">
              <Button onClick={() => router.push('/ai-chat')} className="gap-2">
                Chat with Skilliton
              </Button>
              {filteredSkills.length > 0 && (
                <Button variant="outline" onClick={() => router.push('/matches')}>
                   See All Matches
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {displayMatches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}
