'use server';
/**
 * @fileOverview An AI-powered NFT collection creation flow.
 *
 * - createNftCollection - A function that creates an NFT collection based on a description or theme.
 * - CreateNftCollectionInput - The input type for the createNftCollection function.
 * - CreateNftCollectionOutput - The return type for the createNftCollection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateNftCollectionInputSchema = z.object({
  collectionDescription: z
    .string()
    .describe('A description of the NFT collection theme and style.'),
  numberOfNfts: z
    .number()
    .int()
    .positive()
    .describe('The number of NFTs to generate in the collection.'),
});
export type CreateNftCollectionInput = z.infer<typeof CreateNftCollectionInputSchema>;

const NftPlanSchema = z.object({
    plan: z.string().describe("A high-level plan for the NFT collection, including theme, art style, and potential attributes."),
});


const NftMetadataSchema = z.object({
  name: z.string().describe('The name of the NFT.'),
  description: z.string().describe('A detailed description of the NFT.'),
  image: z.string().describe('A data URI of the NFT image.'),
  attributes: z.array(
    z.object({
      trait_type: z.string().describe('The name of the attribute.'),
      value: z.string().describe('The value of the attribute.'),
    })
  ).describe('Attributes describing the NFT'),
});

const CreateNftCollectionOutputSchema = z.object({
  nfts: z.array(NftMetadataSchema).describe('An array of NFT metadata.'),
});
export type CreateNftCollectionOutput = z.infer<typeof CreateNftCollectionOutputSchema>;

export async function generateNftPlan(input: CreateNftCollectionInput): Promise<string> {
    const planPrompt = ai.definePrompt({
        name: 'generateNftPlanPrompt',
        input: {schema: CreateNftCollectionInputSchema},
        output: {schema: NftPlanSchema},
        prompt: `You are an AI NFT collection designer. Based on the user's description, create a high-level plan for the collection. Describe the overall theme, the art style you will generate, and a list of potential attributes with some example values. The user will approve this plan before you generate the actual NFTs.

Description: {{{collectionDescription}}}
Number of NFTs: {{numberOfNfts}}`,
    });
    
    const {output} = await planPrompt(input);
    return output!.plan;
}


export async function createNftCollection(input: CreateNftCollectionInput & { plan: string }): Promise<CreateNftCollectionOutput> {
  const { collectionDescription, numberOfNfts, plan } = input;
  
  const nfts: z.infer<typeof NftMetadataSchema>[] = [];

  // Use a loop with a prompt for each NFT to ensure variety and use the powerful image model
  for (let i = 0; i < numberOfNfts; i++) {
    const generationResult = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview', // "Nano Banana"
      prompt: `You are an AI NFT generator creating an item for a collection.
      
      Collection Theme: ${collectionDescription}
      Approved Plan: ${plan}
      
      Generate a single, unique NFT based on this theme and plan. This is item ${i + 1} of ${numberOfNfts}. Ensure it is different from others in the collection.
      
      Provide the following as a JSON object:
      - name: A unique name for this specific NFT.
      - description: A detailed description for this specific NFT.
      - attributes: An array of {trait_type, value} objects for this specific NFT.
      
      After the JSON, generate the image for this NFT.
      `,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        responseSchema: NftMetadataSchema,
      }
    });

    const output = generationResult.output;
    const media = generationResult.media;

    if (output && media?.url) {
      nfts.push({ ...output, image: media.url });
    } else {
        // Handle cases where generation might fail for one item
        console.warn(`Failed to generate NFT ${i + 1}`);
    }
  }

  return { nfts };
}
