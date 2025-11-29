import { z } from 'genkit';

export const DAppConversationInputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })),
});
export type DAppConversationInput = z.infer<typeof DAppConversationInputSchema>;

export const DAppPlanSchema = z.object({
  plan: z.string().describe("A high-level plan for the dApp's functionality and components, including smart contract interactions."),
  isFinalPlan: z.boolean().describe('Whether this is the final plan that the user has approved.'),
});
export type DAppPlan = z.infer<typeof DAppPlanSchema>;

export const DAppCodeSchema = z.object({
  dAppCode: z.string().describe('The generated code for the dApp, which should be a single file of React code for a component. It must include wallet connection logic.'),
  description: z.string().describe('A short description of the generated dApp and suggestions for next steps.'),
  livePreview: z.string().describe('The JSX component to be rendered as a live preview. This should be a self-contained component.'),
  abi: z.string().describe('The ABI of the smart contract, in JSON format.'),
  bytecode: z.string().describe('The bytecode of the smart contract.'),
});
export type DAppCode = z.infer<typeof DAppCodeSchema>;
