'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const AIChatInputSchema = z.object({
  history: z.array(
    z.object({
      role: z.enum(['user', 'model', 'system']),
      content: z.any(),
    })
  ).default([]),
  message: z.string(),
  model: z.string().optional(),
  temperature: z.number().optional().default(0.7),
  existingSkills: z.object({
    offered: z.array(z.string()).optional(),
    wanted: z.array(z.string()).optional(),
  }).optional(),
  otherUsers: z.array(z.object({
    offered: z.array(z.string()).optional(),
    wanted: z.array(z.string()).optional(),
  })).optional(),
});

export type AIChatInput = z.infer<typeof AIChatInputSchema>;

const AIChatOutputSchema = z.object({
  text: z.string(),
  extractedSkills: z.object({
    offered: z.array(z.string()),
    wanted: z.array(z.string()),
  }).nullable()
});

export type AIChatOutput = z.infer<typeof AIChatOutputSchema>;

function buildSystemPrompt(input: AIChatInput): string {
  return `You are Skilliton, a friendly and interactive AI assistant on the Skill-Issue platform. 
Your goal is to interview the user to learn about two things:
1. What skills they can teach or offer others.
2. What skills they want to learn from others.

You also have access to the skills that other users on the platform are currently offering and wanting:
${input.otherUsers?.map((u, i) => `User ${i + 1}: Offers [${u.offered?.join(', ') || 'None'}], Wants [${u.wanted?.join(', ') || 'None'}]`).join('\n') || 'No other users currently.'}

If the user asks questions like "what skills can I offer to learn [Skill]", you can use the data above to tell them what skills are in demand by users who offer [Skill]. For example, if they want to learn Figma, find users who offer Figma and see what they want, then suggest those skills.

The user currently has these skills saved on their profile:
- Offered: ${input.existingSkills?.offered?.join(', ') || 'None'}
- Wanted: ${input.existingSkills?.wanted?.join(', ') || 'None'}

CRITICAL INSTRUCTIONS ON SKILL EXTRACTION:
1. PERMANENT PROFILE: The user's profile skills should generally be preserved.
2. CURRENT SEARCH: When the user says they want to learn something "now" or "today" (e.g., "I want to know Kotlin"), this is their CURRENT SEARCH INTEREST.
3. OUTPUT: When you output 'extractedSkills' (to trigger matching):
   - 'offered' MUST include their existing skills they want to keep.
   - 'wanted' MUST ONLY include the specific skills they are currently trying to search for/learn in this session. Do NOT accumulate old 'wanted' skills (like Selenium) into the 'extractedSkills.wanted' list if the user has moved on to a new search (like Kotlin), unless they specifically want to search for both.

Keep your questions short, engaging, and conversational. 
If the user indicates they are ready to be matched, output the extracted skills. Remember: only include the skills they are focusing on NOW in the 'wanted' array for the match search.`;
}

export async function continueChat(input: AIChatInput) {
  return chatFlow(input);
}

export async function continueChatWithKey(input: AIChatInput, apiKey: string): Promise<AIChatOutput> {
  const tempAi = genkit({ plugins: [googleAI({ apiKey })] });
  const systemPrompt = buildSystemPrompt(input);
  const chat = tempAi.generate({
    model: input.model || 'googleai/gemini-1.5-flash',
    system: systemPrompt,
    messages: [...input.history, { role: 'user', content: [{ text: input.message }] }] as any,
    output: { schema: AIChatOutputSchema },
    config: { temperature: input.temperature },
  });
  const response = await chat;
  return response.output!;
}

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: AIChatInputSchema,
    outputSchema: AIChatOutputSchema,
  },
  async (input) => {
    const options = input.model ? { model: input.model } : undefined;

    const chat = ai.generate({
      system: buildSystemPrompt(input),
      messages: [...input.history, { role: 'user', content: [{ text: input.message }] }] as any,
      output: { schema: AIChatOutputSchema },
      ...options,
      config: {
        temperature: input.temperature,
      }
    });

    const response = await chat;
    return response.output!;
  }
);
