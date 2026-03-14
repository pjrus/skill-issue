'use server';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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

export async function continueChat(input: AIChatInput) {
  return chatFlow(input);
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
      system: `You are a friendly and interactive AI assistant on the Skill Issue platform. 
Your goal is to interview the user to learn about two things:
1. What skills they can teach or offer others.
2. What skills they want to learn from others.

You also have access to the skills that other users on the platform are currently offering and wanting:
${input.otherUsers?.map((u, i) => `User ${i + 1}: Offers [${u.offered?.join(', ') || 'None'}], Wants [${u.wanted?.join(', ') || 'None'}]`).join('\n') || 'No other users currently.'}

If the user asks questions like "what skills can I offer to learn [Skill]", you can use the data above to tell them what skills are in demand by users who offer [Skill]. For example, if they want to learn Figma, find users who offer Figma and see what they want, then suggest those skills.

The user currently has these skills saved on their profile:
- Offered: ${input.existingSkills?.offered?.join(', ') || 'None'}
- Wanted: ${input.existingSkills?.wanted?.join(', ') || 'None'}

Please acknowledge their existing skills if natural, and ask if they have anything new to append or if they want to modify their skills.
Do NOT override or discard their existing skills unless they explicitly ask you to remove them. Always include their existing skills (if still applicable) along with any new ones when outputting the final extracted skills.

Keep your questions short, engaging, and conversational. 
If the user indicates they are ready to be matched, or if you feel you have a clear understanding of both what they offer and what they want and they agree to proceed, output the extracted skills in the 'extractedSkills' field (combining original ones they kept with new ones). Otherwise, leave 'extractedSkills' null.`,
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
