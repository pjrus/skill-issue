'use server';
/**
 * @fileOverview An AI agent to extract skills offered and skills wanted from a natural language description.
 *
 * - extractSkills - A function that handles the skill extraction process.
 * - AISkillExtractionInput - The input type for the extractSkills function.
 * - AISkillExtractionOutput - The return type for the extractSkills function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AISkillExtractionInputSchema = z.object({
  description: z
    .string()
    .describe('A natural language description of skills the user offers and needs.'),
  model: z.string().optional().describe('The AI model to use.'),
  apiKey: z.string().optional().describe('An optional API key to use for the model.'),
});
export type AISkillExtractionInput = z.infer<typeof AISkillExtractionInputSchema>;

const AISkillExtractionOutputSchema = z.object({
  skillsOffered: z.array(z.string()).describe('An array of skills the user is offering to teach or provide.'),
  skillsWanted: z.array(z.string()).describe('An array of skills the user is looking to learn or receive help with.'),
});
export type AISkillExtractionOutput = z.infer<typeof AISkillExtractionOutputSchema>;

export async function extractSkills(input: AISkillExtractionInput): Promise<AISkillExtractionOutput> {
  return extractSkillsFlow(input);
}

const extractSkillsPrompt = ai.definePrompt({
  name: 'extractSkillsPrompt',
  input: {schema: AISkillExtractionInputSchema},
  output: {schema: AISkillExtractionOutputSchema},
  prompt: `You are an AI assistant specialized in extracting skills.

Given the following natural language description from a user, identify and list the specific skills the user is offering to teach and the specific skills the user wants to learn.

Format your response as a JSON object with two fields:
- 'skillsOffered': an array of strings representing skills the user offers.
- 'skillsWanted': an array of strings representing skills the user wants.

Example:
User Description: "I need help learning React but I can teach Python and algorithms."
Output: {"skillsOffered": ["Python", "Algorithms"], "skillsWanted": ["React"]}

User Description: "I'm great at graphic design and can help with branding, but I'm looking to improve my front-end development skills, especially with Vue.js."
Output: {"skillsOffered": ["Graphic Design", "Branding"], "skillsWanted": ["Front-end Development", "Vue.js"]}

User Description: {{{description}}}
`,
});

const extractSkillsFlow = ai.defineFlow(
  {
    name: 'extractSkillsFlow',
    inputSchema: AISkillExtractionInputSchema,
    outputSchema: AISkillExtractionOutputSchema,
  },
  async input => {
    const options: any = {};
    if (input.model) options.model = input.model;
    if (input.apiKey) options.config = { apiKey: input.apiKey };
    const {output} = await extractSkillsPrompt(input, options);
    return output!;
  }
);
