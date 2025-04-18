// import { LlamaContext, CalendarEvent } from '../utils/types';
// import * as AddCalendarEvent from 'react-native-add-calendar-event';
// import moment from 'moment';

// /**
//  * Cleans JSON string from non-breaking/invisible characters and trailing syntax issues.
//  */
// const cleanJsonString = (jsonStr: string): string => {
//   return jsonStr
//     .replace(/\u00A0/g, ' ')
//     .replace(/[\u200B-\u200D\uFEFF]/g, '')
//     .replace(/<\/?s>/g, '')
//     .replace(/,\s*}/g, '}')
//     .replace(/,\s*]/g, ']')
//     .trim();
// };
// /**
//  * Normalize time into a consistent format Moment.js can parse reliably
//  */
// const normalizeTime = (rawTime?: string): string => {
//   if (!rawTime) return '09:00 AM'; // Default time if not provided

//   let time = rawTime.trim().toUpperCase();

//   if (/^\d{1,2}\s?(AM|PM)$/.test(time)) {
//     time = time.replace(/\s?(AM|PM)/, ':00 $1');
//   }

//   time = time.replace(/^(\d):/, '0$1:');

//   return time;
// };

// /**
//  * Normalize date - handles "Today", "Tomorrow", and ensures future-valid year.
//  */
// const normalizeDate = (rawDate: string): string => {
//   const today = moment();
//   const currentYear = today.year();
//   const lower = rawDate.trim().toLowerCase();

//   if (lower === 'today') {
//     return today.format('YYYY-MM-DD');
//   } else if (lower === 'tomorrow') {
//     return today.clone().add(1, 'day').format('YYYY-MM-DD');
//   }

//   // Try parsing without year (e.g., "April 20", "20 April")
//   let parsed = moment(rawDate, ['MMMM D', 'MMM D', 'D MMMM', 'D MMM', 'MM-DD'], true);
//   if (parsed.isValid()) {
//     parsed.year(currentYear);
//     return parsed.format('YYYY-MM-DD');
//   }

//   // Try full date formats
//   parsed = moment(rawDate, ['YYYY-MM-DD', 'YYYY/MM/DD', 'D MMMM YYYY', 'D MMM YYYY'], true);
//   if (parsed.isValid()) {
//     const parsedYear = parsed.year();
//     if (parsedYear < currentYear || parsedYear > currentYear + 1) { // Allow next year
//       parsed.year(currentYear); // Set to current year if in the past or far future
//     }
//     return parsed.format('YYYY-MM-DD');
//   }

//   // Fallback to today
//   return today.format('YYYY-MM-DD');
// };

// /**
//  * Handle calendar event based on LLM response
//  */
// export const handleCalendarEvent = async (
//   context: LlamaContext,
//   userInput: string
// ): Promise<string> => {
//   let completionResponse: any = null;

//   try {
//     console.log('Raw User Input:', userInput);

//     const systemPrompt = `Generate a simple json format if date or time given from given text. Parse the Date,Time and Event from the given sentence and give an pure json format like {"Date":"2025-12-24","Time":"13:00","Event":"appointment" }`;

//     completionResponse = await context.completion({
//       messages: [
//         { role: 'system', content: systemPrompt },
//         { role: 'user', content: userInput },
//       ],
//       n_predict: 500, // Sufficient for a single JSON response
//       temperature: 0.7,
//     });

//     console.log('Raw Completion Response:', completionResponse);

//     let llmResponse: string;
//     if (completionResponse && typeof completionResponse.text === 'string') {
//       llmResponse = completionResponse.text;
//     } else if (typeof completionResponse === 'string') {
//       llmResponse = completionResponse;
//     } else {
//       throw new Error('Invalid LLM response: no text property or string response');
//     }

//     console.log('Raw LLM Response:', llmResponse);

//     const jsonMatch = llmResponse.match(/\{[\s\S]*?\}/);
//     if (!jsonMatch) {
//       throw new Error(`No valid JSON found. Raw output: "${llmResponse}"`);
//     }

//     const jsonText = cleanJsonString(jsonMatch[0]);
//     console.log('Cleaned JSON:', jsonText);

//     const eventData: Partial<CalendarEvent> = JSON.parse(jsonText);

//     if (!eventData.Date || !eventData.Event) {
//       throw new Error('Missing required fields (Date or Event) in JSON');
//     }

//     console.log('Parsed Event Data:', eventData);

//     const {
//       Date: rawDate,
//       Time: rawTime,
//       Event: title = 'Untitled Event',
//       location = '',
//       notes = '',
//     } = eventData;

//     const date = normalizeDate(rawDate);
//     const time = normalizeTime(rawTime);

//     const startMoment = moment(`${date} ${time}`, ['YYYY-MM-DD hh:mm A', 'YYYY-MM-DD HH:mm'], true);

//     if (!startMoment.isValid()) {
//       throw new Error('Invalid date or time format after normalization');
//     }

//     const startDate = startMoment.toISOString();
//     const endDate = startMoment.clone().add(1, 'hour').toISOString();

//     const resultDialog = await AddCalendarEvent.presentEventCreatingDialog({
//       title,
//       startDate,
//       endDate,
//       location,
//       notes,
//       navigationBarIOS: {
//         tintColor: '#000000',
//         backgroundColor: '#ffffff',
//       },
//     });

//     console.log('Calendar Event Result:', resultDialog);

//     return `📅 Calendar event dialog shown for: ${title}\n🕒 ${startDate} to ${endDate}`;
//   } catch (error) {
//     const now = new Date();
//     const fallback: CalendarEvent = {
//       Date: now.toISOString().split('T')[0],
//       Time: now.toTimeString().slice(0, 5),
//       Event: 'Untitled Event',
//     };

//     console.warn('JSON parsing failed. Falling back to defaults:', error);

//     const fallbackMsg = `⚠️ Failed to parse response. Showing fallback event:\n📅 ${fallback.Event} at ${fallback.Time} on ${fallback.Date}\nRaw LLM Output: "${completionResponse?.text || completionResponse || 'unknown'}"`;

//     return fallbackMsg;
//   }
// };


import { LlamaContext, CalendarEvent } from '../utils/types';
import * as AddCalendarEvent from 'react-native-add-calendar-event';
import moment from 'moment';

/**
 * Cleans JSON string from non-breaking/invisible characters and trailing syntax issues.
 */
const cleanJsonString = (jsonStr: string): string => {
  return jsonStr
    .replace(/\u00A0/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/<\/?s>/g, '')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    .trim();
};

/**
 * Normalize time into a consistent format Moment.js can parse reliably
 */
const normalizeTime = (rawTime?: string): string => {
  if (!rawTime) return '09:00 AM'; // Default time if not provided

  let time = rawTime.trim().toUpperCase();

  if (/^\d{1,2}\s?(AM|PM)$/.test(time)) {
    time = time.replace(/\s?(AM|PM)/, ':00 $1');
  }

  time = time.replace(/^(\d):/, '0$1:');

  return time;
};

/**
 * Normalize date - handles "Today", "Tomorrow", and ensures future-valid year.
 */
const normalizeDate = (rawDate?: string): string => {
  const today = moment();
  const currentYear = today.year();

  if (!rawDate) return today.format('YYYY-MM-DD');

  const lower = rawDate.trim().toLowerCase();

  if (lower === 'today') {
    return today.format('YYYY-MM-DD');
  } else if (lower === 'tomorrow') {
    return today.clone().add(1, 'day').format('YYYY-MM-DD');
  }

  // Try parsing without year
  let parsed = moment(rawDate, ['MMMM D', 'MMM D', 'D MMMM', 'D MMM', 'MM-DD'], true);
  if (parsed.isValid()) {
    parsed.year(currentYear);
    return parsed.format('YYYY-MM-DD');
  }

  // Try full date formats
  parsed = moment(rawDate, ['YYYY-MM-DD', 'YYYY/MM/DD', 'D MMMM YYYY', 'D MMM YYYY'], true);
  if (parsed.isValid()) {
    const parsedYear = parsed.year();
    if (parsedYear < currentYear || parsedYear > currentYear + 1) {
      parsed.year(currentYear); // Adjust if far past/future
    }
    return parsed.format('YYYY-MM-DD');
  }

  // Fallback to today
  return today.format('YYYY-MM-DD');
};

/**
 * Handle calendar event based on LLM response
 */
export const handleCalendarEvent = async (
  context: LlamaContext,
  userInput: string
): Promise<string> => {
  let completionResponse: any = null;

  try {
    console.log('Raw User Input:', userInput);

    const systemPrompt = `Generate a simple json format if date or time given from given text. Parse the Date, Time and Event from the given sentence and give a pure json format like {"Date":"2025-12-24","Time":"13:00","Event":"appointment" }`;

    completionResponse = await context.completion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput },
      ],
      n_predict: 500,
      temperature: 0.7,
    });

    console.log('Raw Completion Response:', completionResponse);

    let llmResponse: string;
    if (completionResponse && typeof completionResponse.text === 'string') {
      llmResponse = completionResponse.text;
    } else if (typeof completionResponse === 'string') {
      llmResponse = completionResponse;
    } else {
      throw new Error('Invalid LLM response: no text property or string response');
    }

    console.log('Raw LLM Response:', llmResponse);

    const jsonMatch = llmResponse.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      throw new Error(`No valid JSON found. Raw output: "${llmResponse}"`);
    }

    const jsonText = cleanJsonString(jsonMatch[0]);
    console.log('Cleaned JSON:', jsonText);

    const eventData: Partial<CalendarEvent> = JSON.parse(jsonText);

    const {
      Date: rawDate,
      Time: rawTime,
      Event: title = 'Untitled Event',
      location = '',
      notes = '',
    } = eventData;

    const date = normalizeDate(rawDate);
    const time = normalizeTime(rawTime);

    const startMoment = moment(`${date} ${time}`, ['YYYY-MM-DD hh:mm A', 'YYYY-MM-DD HH:mm'], true);

    if (!startMoment.isValid()) {
      throw new Error('Invalid date or time format after normalization');
    }

    const startDate = startMoment.toISOString();
    const endDate = startMoment.clone().add(1, 'hour').toISOString();

    const resultDialog = await AddCalendarEvent.presentEventCreatingDialog({
      title,
      startDate,
      endDate,
      location,
      notes,
      navigationBarIOS: {
        tintColor: '#000000',
        backgroundColor: '#ffffff',
      },
    });

    console.log('Calendar Event Result:', resultDialog);

    return `📅 Calendar event dialog shown for: ${title}\n🕒 ${startDate} to ${endDate}`;
  } catch (error) {
    const now = new Date();
    const fallback: CalendarEvent = {
      Date: now.toISOString().split('T')[0],
      Time: now.toTimeString().slice(0, 5),
      Event: 'Untitled Event',
    };

    console.warn('JSON parsing failed. Falling back to defaults:', error);

    const fallbackMsg = `⚠️ Failed to parse response. Showing fallback event:\n📅 ${fallback.Event} at ${fallback.Time} on ${fallback.Date}\nRaw LLM Output: "${completionResponse?.text || completionResponse || 'unknown'}"`;

    return fallbackMsg;
  }
};
