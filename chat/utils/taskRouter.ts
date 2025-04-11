import { LlamaContext } from './types';
import { handleCalendarEvent } from '../tasks/calendar';
import { handleQA } from '../tasks/qa';
import { handleCall } from '../tasks/call';
import { handleContactCall } from '../tasks/ContactCall';

export const routeTask = async (
  input: string,
  context: LlamaContext
): Promise<string> => {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('event') || lowerInput.includes('set appointment')) {
    return await handleCalendarEvent(context, input);
  }

  if (lowerInput.includes('call')) {
    const numberMatch = input.match(/\d{6,}/); // Match any number with 6+ digits
    if (numberMatch) {
      return await handleCall(context, input); // 📞 Call using number
    } else {
      return await handleContactCall(context, input); // 📇 Call from contacts
    }
  }

  return await handleQA(context, input); // ❓ Fallback to general QA
};
