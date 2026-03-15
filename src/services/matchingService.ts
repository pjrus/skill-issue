import { databaseService } from './databaseService';
import { aiService } from './aiService';
import type { User } from '@/types/userTypes';
import type { Match } from '@/types/matchTypes';
import { cache, CACHE_TTL } from '@/lib/cache';

const SIMULATED_DELAY = 1500;

export const matchingService = {
  findMatches: async (currentUserId: string): Promise<Match[]> => {
    return cache.swr(`matches_${currentUserId}`, async () => {
      const currentUser = await databaseService.getUser(currentUserId);
      const allUsers = await databaseService.getUsers();

      if (!currentUser) {
        return [];
      }

      const potentialMatches: User[] = allUsers.filter(
        (user) => user.id !== currentUserId
      );

      const validMatches: { userA: User; userB: User; aToB: string[], bToA: string[] }[] = [];

      // Bidirectional Skill Matching Algorithm:
      // We look for users who want what the current user offers AND offer what the current user wants.
      // This ensures a mutual "Skill Swap" opportunity.
      for (const otherUser of potentialMatches) {
        const currentUserWants = currentUser.skillsWanted.map(s => s.toLowerCase());
        const otherUserOffers = otherUser.skillsOffered.map(s => s.toLowerCase());
        
        const otherUserWants = otherUser.skillsWanted.map(s => s.toLowerCase());
        const currentUserOffers = currentUser.skillsOffered.map(s => s.toLowerCase());

        // Intersection of skills: User A's offers meeting User B's wants
        const aToB = currentUserOffers.filter(skill => otherUserWants.includes(skill));
        // Intersection of skills: User B's offers meeting User A's wants
        const bToA = otherUserOffers.filter(skill => currentUserWants.includes(skill));

        if (aToB.length > 0 && bToA.length > 0) {
          validMatches.push({ userA: currentUser, userB: otherUser, aToB, bToA });
        }
      }

      // AI Enrichment:
      // We use the AI service to generate a unique 'vibe' summary for each match.
      // This summarizes how their specific skills complement each other.
      const enrichedMatches: Match[] = [];

      for (const match of validMatches) {
        try {
          const summary = await aiService.generateMatchSummary({
            studentASkillsOffered: match.userA.skillsOffered,
            studentAWants: match.userA.skillsWanted,
            studentBSkillsOffered: match.userB.skillsOffered,
            studentBWants: match.userB.skillsWanted,
            model: match.userA.preferredModel,
          });

          enrichedMatches.push({
            id: `${match.userA.id}-${match.userB.id}`,
            users: [match.userA, match.userB],
            matchedSkills: {
              aToB: match.aToB,
              bToA: match.bToA,
            },
            aiSummary: summary.summary,
            status: 'pending',
          });
        } catch (error) {
          console.error("Failed to generate AI summary for match:", match, error);
        }
      }

      // Add a small artificial delay only on initial fresh fetch.
      // This preserves the 'AI thinking' feel for the user experience,
      // while subsequent loads from the cache will remain near-instant.
      await new Promise(resolve => setTimeout(resolve, SIMULATED_DELAY));
      
      return enrichedMatches;
    }, CACHE_TTL.MATCHES);
  },
};
