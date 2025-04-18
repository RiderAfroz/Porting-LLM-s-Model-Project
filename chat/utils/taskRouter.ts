import { LlamaContext } from './types';
import { handleCalendarEvent } from '../tasks/calendar';
import { handleQA } from '../tasks/qa';
import { handleCall } from '../tasks/call';
import { handleContactCall } from '../tasks/ContactCall';
import { handleOpenApp } from '../tasks/openApp';

export const routeTask = async (
  input: string,
  context: LlamaContext
): Promise<string> => {
  const lowerInput = input.toLowerCase();

  const calendarKeywords = [
    'event',
    'set appointment',
    'appointment date',
    'calendar entry',
    'add to calendar',
    'create event',
    'reminder for',
    'book meeting',
    'schedule',
    'add reminder',
    'meeting at',
    'schedule for',
    'today',
    'tomorrow',
  ];

  if (calendarKeywords.some(keyword => lowerInput.includes(keyword))) {
    return await handleCalendarEvent(context, input);
  }

  if (lowerInput.includes('call') || lowerInput.includes('call to')) {
    const numberMatch = input.match(/\d{6,}/); // Match any number with 6+ digits
    if (numberMatch) {
      return await handleCall(context, input); // 📞 Call using number
    } else {
      return await handleContactCall(context, input); // 📇 Call from contacts
    }
  }
  if (lowerInput.startsWith('open ') || lowerInput.includes('open app')) {
    return await handleOpenApp(context, input); // 🚀 Open another application
  }

  return await handleQA(context, input); // ❓ Fallback to general QA
};




