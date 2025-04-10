import { LlamaContext } from './types';
import { handleCalendarEvent } from '../tasks/calendar';
import { handleQA } from '../tasks/qa';

export const routeTask = async (
  input: string,
  context: LlamaContext
): Promise<string> => {
  const lowerInput = input.toLowerCase();

  // Route to calendar event handler for specific event-related commands
  if (lowerInput.includes('event') || lowerInput.includes('set appointment')) {
    return await handleCalendarEvent(context, input);
  }
  // Default to QA for general questions or unsupported commands
  else {
    return await handleQA(context, input);
  }
};