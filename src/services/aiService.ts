import { extractSkills, AISkillExtractionInput } from '@/ai/flows/ai-skill-extraction';
import { generateAIMatchSummary, AIMatchSummaryInput } from '@/ai/flows/ai-match-summary';

export const aiService = {
  extractSkillsFromText: async (input: AISkillExtractionInput) => {
    // In a real app, you would handle potential errors from the AI service
    return await extractSkills(input);
  },
  generateMatchSummary: async (input: AIMatchSummaryInput) => {
    return await generateAIMatchSummary(input);
  },
};
