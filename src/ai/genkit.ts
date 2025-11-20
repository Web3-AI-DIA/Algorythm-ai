import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// We will initialize with an empty plugins array to avoid requiring an API key.
// The app will not have AI capabilities until this is configured correctly.
const geminiApiKey = process.env.GEMINI_API_KEY;
const plugins = geminiApiKey && geminiApiKey !== 'AIza...' ? [googleAI()] : [];


export const ai = genkit({
  plugins: plugins,
  model: 'googleai/gemini-2.5-flash',
});
