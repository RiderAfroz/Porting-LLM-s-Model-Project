import { LlamaContext } from '../utils/types';

/**
 * Handle question-answering task based on LLM response
 */
export const handleQA = async (context: LlamaContext, userInput: string): Promise<string> => {
  try {
    console.log('Raw User Input:', userInput);

    // Define the system prompt specific to QA
    const systemPrompt = `You are a helpful assistant. Analyze the user input and provide a concise, accurate answer.`;

    // Send the prompt to the LLM
    const result = await context.completion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      n_predict: 500,
      temperature: 0.7,
    });

    const llmResponse = result.text.trim();
    console.log('Raw LLM Response:', llmResponse);

    // Validate and return the response
    if (!llmResponse) {
      throw new Error('No response from LLM');
    }

    return llmResponse;
  } catch (error) {
    console.warn('QA processing failed:', error);
    return `⚠️ Error processing question. Please try again.`;
  }
};