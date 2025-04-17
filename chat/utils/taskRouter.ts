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

  if (lowerInput.includes('event') || lowerInput.includes('set appointment') || lowerInput.includes('appointment date')) {
    return await handleCalendarEvent(context, input);
  }

  // if (lowerInput.includes('call') || lowerInput.includes('call to')) {
  //   const numberMatch = input.match(/\d{10,}/); // Match any number with 6+ digits
  //   if (numberMatch) {
  //     return await handleCall(context, input); // 📞 Call using number
  //   } else {
  //     return await handleContactCall(context, input); // 📇 Call from contacts
  //   }
  // }
  if (lowerInput.includes('call') || lowerInput.includes('call to')) {
    const numberMatch = input.match(/\d{10,}/); // Match numbers with 10+ digits
    if (numberMatch) {
      return await handleCall(context, input); // 📞 Call using number
    } else {
      const nameMatch = input.match(/\bcall\s+(to\s+)?([\w\s']+)/i); // Match single or multi-word names
      if (nameMatch && nameMatch[2]) {
        const contactName = nameMatch[2].trim().replace(/\s+/g, ' '); // Normalize spaces
        console.log('Calling handleContactCall with name:', contactName);
        return await handleContactCall(context, contactName); // 📇 Call from contacts
      }
    }
  }

  if (lowerInput.startsWith('open ') || lowerInput.includes('open app')) {
    return await handleOpenApp(context, input); // 🚀 Open another application
  }

  return await handleQA(context, input); // ❓ Fallback to general QA
};




// by grok
// import { LlamaContext } from './types';
// import { handleCalendarEvent } from '../tasks/calendar';
// import { handleQA } from '../tasks/qa';
// import { handleCall } from '../tasks/call';
// import { handleContactCall } from '../tasks/ContactCall';
// import { handleOpenApp } from '../tasks/openApp';

// // Define task handlers with metadata for routing
// interface TaskHandler {
//   keywords: string[];
//   regex?: RegExp;
//   handler: (context: LlamaContext, input: string) => Promise<string>;
//   priority: number; // Higher priority tasks are checked first
// }

// const taskHandlers: TaskHandler[] = [
//   {
//     keywords: ['event', 'set appointment', 'appointment date', 'schedule', 'meeting'],
//     regex: /\b(event|appointment|schedule|meeting)\b/i,
//     handler: handleCalendarEvent,
//     priority: 3,
//   },
//   {
//     keywords: ['call', 'call to', 'phone', 'dial'],
//     regex: /\b(call|phone|dial)\b/i,
//     handler: async (context, input) => {
//       const numberMatch = input.match(/\d{6,}/);
//       return numberMatch
//         ? await handleCall(context, input) // 📞 Call using number
//         : await handleContactCall(context, input); // 📇 Call from contacts
//     },
//     priority: 2,
//   },
//   {
//     keywords: ['open', 'open app', 'launch'],
//     regex: /\bopen\s+(app\s+)?\w+\b/i,
//     handler: handleOpenApp,
//     priority: 1,
//   },
//   {
//     keywords: [], // Fallback for general QA
//     handler: handleQA,
//     priority: 0,
//   },
// ];

// /**
//  * Routes input to appropriate task handler based on keywords, regex, and context.
//  * Supports multi-task inputs by splitting and processing sequentially.
//  */
// export const routeTask = async (
//   input: string,
//   context: LlamaContext
// ): Promise<string> => {
//   try {
//     const lowerInput = input.toLowerCase().trim();

//     // Handle multi-task inputs (e.g., "call John and set a meeting")
//     const tasks = lowerInput.split(/\s+and\s+/i);
//     if (tasks.length > 1) {
//       const results: string[] = [];
//       for (const task of tasks) {
//         const result = await processSingleTask(task, context);
//         results.push(result);
//       }
//       return results.join('\n');
//     }

//     return await processSingleTask(input, context);
//   } catch (error: any) {
//     console.warn('Task routing failed:', error);
//     // Fallback to QA with error context
//     return await handleQA(context, `Error processing input: ${input}. ${error.message}`);
//   }
// };

// /**
//  * Processes a single task by matching against handlers.
//  */
// const processSingleTask = async (input: string, context: LlamaContext): Promise<string> => {
//   const lowerInput = input.toLowerCase().trim();

//   // Find the best matching handler
//   let bestHandler: TaskHandler | null = null;
//   let highestPriority = -1;

//   for (const handler of taskHandlers) {
//     const matchesKeywords = handler.keywords.some((kw) => lowerInput.includes(kw));
//     const matchesRegex = handler.regex ? handler.regex.test(lowerInput) : false;

//     if ((matchesKeywords || matchesRegex) && handler.priority > highestPriority) {
//       bestHandler = handler;
//       highestPriority = handler.priority;
//     }
//   }

//   // Use fallback handler if no match
//   const selectedHandler = bestHandler || taskHandlers.find((h) => h.priority === 0)!;

//   // Execute handler with context-aware input
//   return await selectedHandler.handler(context, input);
// };