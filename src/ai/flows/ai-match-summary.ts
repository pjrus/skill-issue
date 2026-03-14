'use server';
/**
 * @fileOverview A Genkit flow that generates a concise AI-powered summary explaining how two students can help each other based on their offered and wanted skills.
 *
 * - generateAIMatchSummary - The main function to call for generating the AI match summary.
 * - AIMatchSummaryInput - The input type for the generateAIMatchSummary function.
 * - AIMatchSummaryOutput - The return type for the generateAIMatchSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIMatchSummaryInputSchema = z.object({
  studentASkillsOffered: z
    .array(z.string())
    .describe("A list of skills Student A offers."),
  studentAWants: z
    .array(z.string())
    .describe("A list of skills Student A wants to learn."),
  studentBSkillsOffered: z
    .array(z.string())
    .describe("A list of skills Student B offers."),
  studentBWants: z
    .array(z.string())
    .describe("A list of skills Student B wants to learn."),
  model: z.string().optional().describe('The AI model to use.'),
  apiKey: z.string().optional().describe('An optional API key to use for the model.'),
});
export type AIMatchSummaryInput = z.infer<typeof AIMatchSummaryInputSchema>;

const AIMatchSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe(
      "A concise, 2-sentence explanation of how Student A and Student B can help each other with skill exchange."
    ),
});
export type AIMatchSummaryOutput = z.infer<typeof AIMatchSummaryOutputSchema>;

const aiMatchSummaryPrompt = ai.definePrompt({
  name: 'aiMatchSummaryPrompt',
  input: {schema: AIMatchSummaryInputSchema},
  output: {schema: AIMatchSummaryOutputSchema},
  prompt: `You are an assistant helping match students for skill exchange.

Student A skills:
{{#each studentASkillsOffered}}- {{this}}
{{/each}}

Student A wants:
{{#each studentAWants}}- {{this}}
{{/each}}

Student B skills:
{{#each studentBSkillsOffered}}- {{this}}
{{/each}}

Student B wants:
{{#each studentBWants}}- {{this}}
{{/each}}

Explain in 2 sentences how they can help each other. Your response MUST be in JSON format, with a single key 'summary' containing the 2-sentence explanation.`,
});

const aiMatchSummaryFlow = ai.defineFlow(
  {
    name: 'aiMatchSummaryFlow',
    inputSchema: AIMatchSummaryInputSchema,
    outputSchema: AIMatchSummaryOutputSchema,
  },
  async (input) => {
    const options: any = {};
    if (input.model) options.model = input.model;
    if (input.apiKey) options.config = { apiKey: input.apiKey };
    const {output} = await aiMatchSummaryPrompt(input, options);
    return output!;
  }
);

export async function generateAIMatchSummary(
  input: AIMatchSummaryInput
): Promise<AIMatchSummaryOutput> {
  return aiMatchSummaryFlow(input);
}
