import { LlamaContext } from '../utils/types';

export const handleQA = async (_context: LlamaContext, llmResponse: string): Promise<string> => {
  // For QA, the LLM response is the answer
  return llmResponse;
};