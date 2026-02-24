'use server';
/**
 * @fileOverview This file implements a Genkit flow for solving mathematical equations.
 * It supports both text descriptions and multimodal inputs (images/PDFs).
 *
 * - solveEquation - A function that takes a mathematical problem (text and/or media) and returns its step-by-step solution.
 * - SolveEquationInput - The input type for the solveEquation function.
 * - SolveEquationOutput - The return type for the solveEquation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SolveEquationInputSchema = z.object({
  equation: z.string().optional().describe('The mathematical equation or description of the problem.'),
  mediaDataUri: z.string().optional().describe("A photo of a math problem, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type SolveEquationInput = z.infer<typeof SolveEquationInputSchema>;

const SolveEquationOutputSchema = z.object({
  stepByStepSolution: z.string().describe('The detailed, step-by-step solution to the equation. Each step must be on a new line.'),
  finalAnswer: z.string().describe('The final answer to the equation.'),
});
export type SolveEquationOutput = z.infer<typeof SolveEquationOutputSchema>;

export async function solveEquation(input: SolveEquationInput): Promise<SolveEquationOutput> {
  return solveEquationFlow(input);
}

const equationSolverPrompt = ai.definePrompt({
  name: 'equationSolverPrompt',
  input: { schema: SolveEquationInputSchema },
  output: { schema: SolveEquationOutputSchema },
  prompt: `You are an expert mathematician and a patient tutor.

Given a mathematical equation, a word problem in text, or a problem shown in an image or document, your task is to provide a comprehensive step-by-step solution and the final answer. 

Instructions:
1. TUTORING STYLE: Explain the reasoning behind each step clearly. Don't just show the numbers; explain what operation is being performed and why.
2. STEP SEPARATION: CRITICAL - Ensure each step is on its own SEPARATE LINE using a newline character (\\n). 
3. FORMATTING: 
   - Use "Step X: [Description]" for each line.
   - Use Unicode superscripts for exponents (e.g., x², y³, a⁴). 
   - Represent fractions clearly. For the final answer, use simple a/b notation.
4. SYMBOLS: Recognize x^2 and x² as identical. Use x² in your output.
5. NO COMPACTNESS: Do not bundle multiple logical steps into one line. Be verbose and clear.

Input Text: {{{equation}}}
{{#if mediaDataUri}}Attached Media: {{media url=mediaDataUri}}{{/if}}`, 
});

const solveEquationFlow = ai.defineFlow(
  {
    name: 'solveEquationFlow',
    inputSchema: SolveEquationInputSchema,
    outputSchema: SolveEquationOutputSchema,
  },
  async (input) => {
    const { output } = await equationSolverPrompt(input);
    return output!;
  }
);
