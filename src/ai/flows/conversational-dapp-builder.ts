'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { DAppConversationInputSchema, DAppPlanSchema, DAppCodeSchema, DAppConversationInput, DAppPlan, DAppCode } from './schemas';

export async function conversationalDAppBuilder(input: DAppConversationInput): Promise<DAppPlan | DAppCode> {
  const lastUserMessage = input.messages[input.messages.length - 1].content;
  const isInitialPrompt = input.messages.length === 1;

  if (isInitialPrompt) {
    // Generate the initial plan
    const planPrompt = ai.definePrompt({
      name: 'generateDAppPlanPrompt',
      input: { schema: z.object({ prompt: z.string() }) },
      output: { schema: DAppPlanSchema },
      prompt: `You are an expert dApp developer. Based on the user's prompt, create a high-level plan for building the dApp. The user will approve this plan before you generate the code.

Prompt: {{{prompt}}}`,
    });
    const { output } = await planPrompt({ prompt: lastUserMessage });
    return output!;
  }

  const isApproved = lastUserMessage.toLowerCase().includes('approve');
  if (isApproved) {
    // Generate the code
    const generatePrompt = ai.definePrompt({
      name: 'generateDAppCodePrompt',
      input: { schema: z.object({ messages: z.any() }) },
      output: { schema: DAppCodeSchema },
      prompt: `You are an expert dApp developer. Generate the code for a dApp based on the following conversation history.

Conversation:
{{{messages}}}

Return only the JSON object with the dAppCode, description, livePreview, abi, and bytecode.`,
    });
    const { output } = await generatePrompt({ messages: input.messages });
    return output!;
  }

  // Continue the conversation to refine the plan
  const conversationPrompt = ai.definePrompt({
    name: 'refineDAppPlanPrompt',
    input: { schema: z.object({ messages: z.any() }) },
    output: { schema: DAppPlanSchema },
    prompt: `You are an expert dApp developer. Continue the conversation with the user to refine the plan for their dApp.

Conversation:
{{{messages}}}

If the user has approved the plan, set isFinalPlan to true.`,
  });
  const { output } = await conversationPrompt({ messages: input.messages });
  return output!;
}
