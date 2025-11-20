'use server';
/**
 * @fileOverview An AI-powered smart contract testing framework.
 *
 * - testSmartContract - A function that tests a smart contract, estimates gas, and provides recommendations.
 * - TestSmartContractInput - The input type for the testSmartContract function.
 * - TestSmartContractOutput - The return type for the testSmartContract function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TestSmartContractInputSchema = z.object({
    contractCode: z.string().describe('The Solidity smart contract code to be tested.'),
});
export type TestSmartContractInput = z.infer<typeof TestSmartContractInputSchema>;


const TestSmartContractOutputSchema = z.object({
  testResults: z.string().describe("A summary of the test results, simulating a Foundry or Hardhat test run. Include pass/fail status for key functions."),
  gasEstimate: z.string().describe("An estimation of gas costs for deployment and key functions, similar to the output of `hardhat-gas-reporter`."),
  recommendations: z.string().describe("Actionable recommendations for gas optimization and security improvements based on the analysis."),
});
export type TestSmartContractOutput = z.infer<typeof TestSmartContractOutputSchema>;


export async function testSmartContract(input: TestSmartContractInput): Promise<TestSmartContractOutput> {
    return testSmartContractFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartContractTestingPrompt',
  input: {schema: TestSmartContractInputSchema},
  output: {schema: TestSmartContractOutputSchema},
  prompt: `You are an expert smart contract auditor and testing specialist, proficient in both Foundry and Hardhat frameworks.

You will analyze the provided Solidity smart contract code. Your task is to perform a comprehensive analysis that includes running simulated tests, estimating gas usage, and providing security/optimization recommendations.

Contract Code:
\`\`\`solidity
{{{contractCode}}}
\`\`\`

Your output must be a JSON object with three fields:

1.  'testResults':
    -   Simulate a test suite for the contract's major functions.
    -   Describe the tests you are "running" (e.g., "Testing mint() function allows owner to mint", "Testing transfer() fails when balance is insufficient").
    -   Provide a clear summary of which tests "passed" and which "failed", in a format similar to a Foundry or Hardhat test runner output.

2.  'gasEstimate':
    -   Provide a gas usage report for the contract.
    -   Estimate the gas cost for contract deployment.
    -   Estimate the average gas cost for the most important public/external functions.
    -   Present this in a table format, similar to 'hardhat-gas-reporter'.

3.  'recommendations':
    -   Analyze the contract for common security vulnerabilities (e.g., reentrancy, integer overflow/underflow, access control issues).
    -   Suggest specific, actionable code changes for gas optimization (e.g., using 'calldata' instead of 'memory' for function arguments, packing storage variables).
    -   Provide a clear and concise list of recommendations.
`,
});


const testSmartContractFlow = ai.defineFlow(
  {
    name: 'testSmartContractFlow',
    inputSchema: TestSmartContractInputSchema,
    outputSchema: TestSmartContractOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
