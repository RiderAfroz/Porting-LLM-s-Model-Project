import { LlamaContext } from './types';
import { handleCalendarEvent } from '../tasks/calendar';
// import { handleExcelWrite } from '../tasks/excel';
// import { handleAppLaunch } from '../tasks/appLauncher';
// import { handleCall } from '../tasks/call';
// import { handleAlarm } from '../tasks/alarm';
import { handleQA } from '../tasks/qa';

export const routeTask = async (
  input: string,
  context: LlamaContext,
  llmResponse: string
): Promise<string> => {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('event') || lowerInput.includes('set appointment')) {
    return await handleCalendarEvent(context, llmResponse);
  }
   else {
    // Default to QA for general questions
    return await handleQA(context, llmResponse);
  }
};