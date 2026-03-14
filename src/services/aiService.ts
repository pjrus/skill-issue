import { extractSkills, AISkillExtractionInput } from '@/ai/flows/ai-skill-extraction';
import { generateAIMatchSummary, AIMatchSummaryInput } from '@/ai/flows/ai-match-summary';
import { AIChatInput } from '@/ai/flows/ai-skills-chat';

export const aiService = {
  extractSkillsFromText: async (input: AISkillExtractionInput) => {
    // In a real app, you would handle potential errors from the AI service
    return await extractSkills(input);
  },
  generateMatchSummary: async (input: AIMatchSummaryInput) => {
    return await generateAIMatchSummary(input);
  },
  chat: async (input: AIChatInput) => {
    const response = await fetch('/api/skills/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
    });

    if (!response.ok) {
        let errorMessage = 'Failed to send chat message';
        try {
            const errorData = await response.json();
            if (errorData?.error) {
                errorMessage = errorData.error;
            }
        } catch (e) {
            // Ignore parse errors if response is not JSON
        }
        throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  }
};
