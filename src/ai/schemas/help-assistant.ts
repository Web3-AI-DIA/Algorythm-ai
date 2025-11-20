import { z } from 'zod';

export const AnswerQuestionInputSchema = z.string().describe("The user's question.");
export type AnswerQuestionInput = z.infer<typeof AnswerQuestionInputSchema>;

export const AnswerQuestionOutputSchema = z.object({
  answer: z.string().describe("The answer to the user's question."),
});
export type AnswerQuestionOutput = z.infer<typeof AnswerQuestionOutputSchema>;
