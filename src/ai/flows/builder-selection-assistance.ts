'use server';

/**
 * @fileOverview An AI agent that assists users in selecting the appropriate builder (dApp, NFT, or Cryptocurrency) based on their project requirements.
 *
 * - builderSelectionAssistance - A function that handles the builder selection process.
 * - BuilderSelectionAssistanceInput - The input type for the builderSelectionAssistance function.
 * - BuilderSelectionAssistanceOutput - The return type for the builderSelectionAssistance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BuilderSelectionAssistanceInputSchema = z.string().describe('A description of the project requirements.');
export type BuilderSelectionAssistanceInput = z.infer<typeof BuilderSelectionAssistanceInputSchema>;

const BuilderSelectionAssistanceOutputSchema = z.object({
  builderType: z
    .enum(['dApp', 'NFT', 'Cryptocurrency'])
    .describe('The recommended builder type based on the project requirements.'),
  reason: z.string().describe('The reasoning behind the builder type recommendation.'),
});
export type BuilderSelectionAssistanceOutput = z.infer<typeof BuilderSelectionAssistanceOutputSchema>;

export async function builderSelectionAssistance(input: BuilderSelectionAssistanceInput): Promise<BuilderSelectionAssistanceOutput> {
  return builderSelectionAssistanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'builderSelectionAssistancePrompt',
  input: {schema: BuilderSelectionAssistanceInputSchema},
  output: {schema: BuilderSelectionAssistanceOutputSchema},
  prompt: `You are an AI assistant designed to help users select the most appropriate builder for their project.

  Based on the project requirements provided by the user, you will recommend either a dApp builder, an NFT builder, or a Cryptocurrency builder.

  Project Requirements: {{{$input}}}

  Consider the following:
  - dApp Builder: Suitable for projects involving decentralized applications, smart contracts, and blockchain integration.
  - NFT Builder: Ideal for projects focused on creating, managing, and deploying non-fungible tokens.
  - Cryptocurrency Builder: Best for projects aiming to launch a new cryptocurrency, token, or blockchain-based financial system.

  Return a JSON object with the 'builderType' field set to the recommended builder (dApp, NFT, or Cryptocurrency) and a 'reason' field explaining the recommendation.
  `,
});

const builderSelectionAssistanceFlow = ai.defineFlow(
  {
    name: 'builderSelectionAssistanceFlow',
    inputSchema: BuilderSelectionAssistanceInputSchema,
    outputSchema: BuilderSelectionAssistanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
