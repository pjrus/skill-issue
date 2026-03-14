import { continueChat, continueChatWithKey } from '@/ai/flows/ai-skills-chat';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { geminiApiKey, ...chatInput } = body;

    const response = geminiApiKey
      ? await continueChatWithKey(chatInput, geminiApiKey)
      : await continueChat(chatInput);

    return Response.json(response);
  } catch (error: any) {
    console.error('Error in chat API:', error);

    const errorMessage = error?.message || '';
    if (errorMessage.includes('429 Too Many Requests') || errorMessage.includes('Quota exceeded')) {
      return Response.json({ error: 'AI quota exceeded. Please try again in a few minutes.' }, { status: 429 });
    }
    if (errorMessage.includes('400') || errorMessage.includes('API key')) {
      return Response.json({ error: 'Invalid API key. Please check your key in Settings.' }, { status: 400 });
    }

    return Response.json({ error: 'Failed to process chat message' }, { status: 500 });
  }
}
