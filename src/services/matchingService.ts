import { databaseService } from './databaseService';
import { aiService } from './aiService';
import type { User } from '@/types/userTypes';
import type { Match } from '@/types/matchTypes';

const SIMULATED_DELAY = 1500;

interface CacheEntry {
  skillsWanted: string[];
  skillsOffered: string[];
  matches: Match[];
}

const matchCache = new Map<string, CacheEntry>();

export const matchingService = {
  findMatches: async (currentUserId: string): Promise<Match[]> => {
    return new Promise(async (resolve) => {
      const currentUser = await databaseService.getUser(currentUserId);

      if (!currentUser) {
        resolve([]);
        return;
      }

      const cached = matchCache.get(currentUserId);
      if (
        cached &&
        JSON.stringify([...cached.skillsWanted].sort()) === JSON.stringify([...currentUser.skillsWanted].sort()) &&
        JSON.stringify([...cached.skillsOffered].sort()) === JSON.stringify([...currentUser.skillsOffered].sort())
      ) {
        resolve(cached.matches);
        return;
      }

      const allUsers = await databaseService.getUsers();

      const potentialMatches: User[] = allUsers.filter(
        (user) => user.id !== currentUserId
      );

      const validMatches: { userA: User; userB: User; aToB: string[], bToA: string[], score: number }[] = [];

      for (const otherUser of potentialMatches) {
        const currentUserWants = currentUser.skillsWanted.map(s => s.toLowerCase());
        const otherUserOffers = otherUser.skillsOffered.map(s => s.toLowerCase());
        
        const otherUserWants = otherUser.skillsWanted.map(s => s.toLowerCase());
        const currentUserOffers = currentUser.skillsOffered.map(s => s.toLowerCase());

        const aToB = currentUserOffers.filter(skill => otherUserWants.includes(skill));
        const bToA = otherUserOffers.filter(skill => currentUserWants.includes(skill));

        let score = 0;
        if (aToB.length > 0 && bToA.length > 0) {
          score = 3; // Mutual match
        } else if (bToA.length > 0) {
          score = 2; // Learning match: They teach what you want to learn
        } else if (aToB.length > 0) {
          score = 1; // Teaching match: You teach what they want to learn
        }

        validMatches.push({ userA: currentUser, userB: otherUser, aToB, bToA, score });
      }

      // Sort based on match score
      validMatches.sort((a, b) => b.score - a.score);

      const enrichedMatches: Match[] = [];

      for (const match of validMatches) {
        let aiSummaryText = "Discover more about their skills and connect!";
        
        if (match.score > 0) {
          try {
            const summary = await aiService.generateMatchSummary({
              studentASkillsOffered: match.userA.skillsOffered,
              studentAWants: match.userA.skillsWanted,
              studentBSkillsOffered: match.userB.skillsOffered,
              studentBWants: match.userB.skillsWanted,
              model: match.userA.preferredModel,
              apiKey: match.userA.apiKey,
            });
            aiSummaryText = summary.summary;
          } catch (error) {
            console.error("Failed to generate AI summary for match:", match, error);
            aiSummaryText = "We found some overlapping skills. Connect and learn from each other!";
          }
        }

        enrichedMatches.push({
          id: `${match.userA.id}-${match.userB.id}`,
          users: [match.userA, match.userB],
          matchedSkills: {
            aToB: match.aToB,
            bToA: match.bToA,
          },
          score: match.score,
          aiSummary: aiSummaryText,
          status: 'pending',
        });
      }

      setTimeout(() => {
        matchCache.set(currentUserId, {
          skillsWanted: [...currentUser.skillsWanted],
          skillsOffered: [...currentUser.skillsOffered],
          matches: enrichedMatches,
        });
        resolve(enrichedMatches);
      }, SIMULATED_DELAY);
    });
  },
};
