'use server';
/**
 * @fileOverview Cryptocurrency design AI agent.
 *
 * - generateCryptocurrencyDesign - A function that handles the cryptocurrency design generation.
 * - GenerateCryptocurrencyDesignInput - The input type for the generateCryptocurrencyDesign function.
 * - GenerateCryptocurrencyDesignOutput - The return type for the generateCryptocurrencyDesign function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCryptocurrencyDesignInputSchema = z.string().describe('A description of the cryptocurrency, including its purpose, target audience, and desired features.');
export type GenerateCryptocurrencyDesignInput = z.infer<typeof GenerateCryptocurrencyDesignInputSchema>;

const CryptocurrencyPlanSchema = z.object({
  plan: z.string().describe('A step-by-step plan for designing the cryptocurrency, including tokenomics, smart contract features, and deployment strategy.'),
});

const GenerateCryptocurrencyDesignOutputSchema = z.object({
  tokenomics: z.string().describe('The tokenomics of the cryptocurrency, including total supply, distribution, and minting/burning mechanisms.'),
  smartContractCode: z.string().describe('The smart contract code for the cryptocurrency, written in Solidity or another suitable language.'),
  deploymentStrategy: z.string().describe('A strategy for deploying the cryptocurrency, including which blockchain to use and how to launch the token.'),
});
export type GenerateCryptocurrencyDesignOutput = z.infer<typeof GenerateCryptocurrencyDesignOutputSchema>;

export async function generateCryptocurrencyPlan(input: GenerateCryptocurrencyDesignInput): Promise<string> {
  const planPrompt = ai.definePrompt({
    name: 'generateCryptocurrencyPlanPrompt',
    input: {schema: GenerateCryptocurrencyDesignInputSchema},
    output: {schema: CryptocurrencyPlanSchema},
    prompt: `You are an expert in cryptocurrency design. Based on the user's description, create a high-level plan for designing their cryptocurrency. This plan should outline the proposed tokenomics, key smart contract features, and a suggested deployment strategy. The user will approve this plan before you generate the detailed assets.

Description: {{{$input}}}`,
  });

  const {output} = await planPrompt(input);
  return output!.plan;
}


export async function generateCryptocurrencyDesign(input: { description: string; plan: string }): Promise<GenerateCryptocurrencyDesignOutput> {
  const generationPrompt = ai.definePrompt({
    name: 'generateCryptocurrencyDesignPrompt',
    input: {schema: z.object({ description: z.string(), plan: z.string() })},
    output: {schema: GenerateCryptocurrencyDesignOutputSchema},
    prompt: `You are an expert in cryptocurrency design. You will generate a detailed cryptocurrency design based on the user's initial description and the approved plan. Generate the tokenomics, a complete and secure Solidity smart contract, and a comprehensive deployment strategy.

Initial Description: {{{description}}}

Approved Plan:
{{{plan}}}`,
  });

  const {output} = await generationPrompt(input);
  return output!;
}
