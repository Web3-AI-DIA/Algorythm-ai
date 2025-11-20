'use server';
/**
 * @fileOverview AI-driven dApp builder flow.
 *
 * - generateDApp - A function that handles the dApp generation process.
 * - GenerateDAppInput - The input type for the generateDApp function.
 * - GenerateDAppOutput - The return type for the generateDApp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDAppInputSchema = z.object({
  prompt: z.string().describe('A description of the dApp to generate.'),
});
export type GenerateDAppInput = z.infer<typeof GenerateDAppInputSchema>;

const DAppPlanSchema = z.object({
    plan: z.string().describe("A high-level plan for the dApp's functionality and components, including smart contract interactions."),
});

const GenerateDAppOutputSchema = z.object({
  dAppCode: z.string().describe('The generated code for the dApp, which should be a single file of React code for a component. It must include wallet connection logic.'),
  description: z.string().describe('A short description of the generated dApp and suggestions for next steps.'),
  livePreview: z.string().describe('The JSX component to be rendered as a live preview. This should be a self-contained component.'),
});
export type GenerateDAppOutput = z.infer<typeof GenerateDAppOutputSchema>;


export async function generateDAppPlan(input: GenerateDAppInput): Promise<string> {
    const planPrompt = ai.definePrompt({
        name: 'generateDAppPlanPrompt',
        input: {schema: GenerateDAppInputSchema},
        output: {schema: DAppPlanSchema},
        prompt: `You are an expert dApp developer specializing in React and web3 technologies. Based on the user's prompt, create a high-level plan for building the dApp.

First, analyze the prompt to determine the target blockchain.
- If the user mentions "Tron" or "TronLink", the plan must use the 'tronweb' library.
- If no specific blockchain is mentioned, default to using 'ethers.js' (v6).

Then, outline the UI components, state management, and specifically how it will interact with the chosen blockchain (e.g., "connect to wallet", "read from contract X", "call function Y using tronweb/ethers"). The user will approve this plan before you generate the code.
  
Prompt: {{{prompt}}}
`,
    });
    
    const {output} = await planPrompt(input);
    return output!.plan;
}


export async function generateDApp(input: { prompt: string; plan: string }): Promise<GenerateDAppOutput> {
  const generatePrompt = ai.definePrompt({
    name: 'generateDAppPrompt',
    input: {schema: z.object({ prompt: z.string(), plan: z.string() })},
    output: {schema: GenerateDAppOutputSchema},
    prompt: `You are an expert dApp developer proficient in React and Tailwind CSS. Generate the code for a dApp based on the initial prompt and the approved plan. 

Your generated code MUST be a single, self-contained React functional component. It must include all necessary imports from React and other libraries.
The component MUST handle wallet connection and manage the connection state.

IMPORTANT: You must use the correct library based on the plan.
- If the plan specifies 'tronweb', use 'tronweb' for all blockchain interactions and to connect with TronLink.
- Otherwise, use 'ethers.js' (v6) for all blockchain interactions and to connect with EVM wallets like MetaMask.

You must provide three things in your response:
1.  'dAppCode': The full React component code for the dApp. It should be a single file and include all necessary imports.
2.  'description': A brief summary of what the dApp does and a suggestion for the user's next step.
3.  'livePreview': The same React component code to be rendered as a live preview. It must be a self-contained component that can be rendered directly.
  
Initial Prompt: {{{prompt}}}

Approved Plan:
{{{plan}}}

Return only the JSON object with these three fields. Do not include any other explanations or comments.`,
  });

  const {output} = await generatePrompt(input);
  return output!;
}
