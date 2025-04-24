// utils/taskRouter.ts
import { LlamaContext } from './types';
import { handleCalendarEvent } from '../tasks/calendar';
import { handleQA } from '../tasks/qa';
import { handleCall } from '../tasks/call';
import { handleContactCall } from '../tasks/ContactCall';
import { handleOpenApp } from '../tasks/openApp';
import { handleAlarm } from '../tasks/alarm'; // Add alarm handler

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

  const alarmKeywords = [
    'alarm',
    'set alarm',
    'add alarm',
    'alarm at',
    'wake up',
    'add an alarm',
    'add a alarm',
  ];

  // Add alarm routing
  if (alarmKeywords.some(keyword => lowerInput.includes(keyword))) {
    return await handleAlarm(context, input);
  }

  if (calendarKeywords.some(keyword => lowerInput.includes(keyword))) {
    return await handleCalendarEvent(context, input);
  }

  if (lowerInput.includes('call') || lowerInput.includes('call to')) {
    const numberMatch = input.match(/\d{10,}/);
    if (numberMatch) {
      return await handleCall(context, input);
    } else {
      return await handleContactCall(context, input);
    }
  }

  if (lowerInput.startsWith('open ') || lowerInput.includes('open app')) {
    return await handleOpenApp(context, input);
  }

  return await handleQA(context, input);
};