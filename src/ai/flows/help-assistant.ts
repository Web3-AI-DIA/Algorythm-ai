'use server';
/**
 * @fileOverview An AI assistant to answer user questions.
 *
 * - answerQuestion - A function that provides answers to user questions about the platform.
 */

import { ai } from '@/ai/genkit';
import { AnswerQuestionInput, AnswerQuestionInputSchema, AnswerQuestionOutput, AnswerQuestionOutputSchema } from '@/ai/schemas/help-assistant';

export async function answerQuestion(input: AnswerQuestionInput): Promise<AnswerQuestionOutput> {
  return answerQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'helpAssistantPrompt',
  input: { schema: AnswerQuestionInputSchema },
  output: { schema: AnswerQuestionOutputSchema },
  prompt: `You are a helpful AI assistant for a platform called "Algorythm AI", which helps users build dApps, NFTs, and cryptocurrencies using AI.

Your primary goal is to answer user questions about the platform. Be concise and helpful.

Here are some common topics you should be able to answer:
- How to use the builders (dApp, NFT, Crypto).
- What blockchain technologies are supported (you can say it's flexible and the AI generates standard, compatible code).
- Questions about pricing, credits, and subscriptions.
- How to save and view projects in the dashboard.
- How to use the Smart Contract Testing tool.
- Basic troubleshooting steps (e.g., "try again", "check your description for more detail").

If the user's question is too complex, technical, involves a bug, a billing issue, or is something you cannot answer, you MUST direct them to email support. The support email is support@algorythmai.xyz.

User Question: {{{$input}}}
`,
});

const answerQuestionFlow = ai.defineFlow(
  {
    name: 'answerQuestionFlow',
    inputSchema: AnswerQuestionInputSchema,
    outputSchema: AnswerQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
