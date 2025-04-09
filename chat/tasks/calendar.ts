import { LlamaContext, CalendarEvent } from '../utils/types';
import * as AddCalendarEvent from 'react-native-add-calendar-event';
import moment from 'moment';

/**
 * Cleans JSON string from non-breaking/invisible characters and trailing syntax issues.
 */
const cleanJsonString = (jsonStr: string): string => {
  return jsonStr
    .replace(/\u00A0/g, ' ')                  // Replace non-breaking spaces
    .replace(/[\u200B-\u200D\uFEFF]/g, '')    // Remove zero-width spaces and BOMs
    .replace(/<\/?s>/g, '')                   // Remove special LLM tags like <s>, </s>
    .replace(/,\s*}/g, '}')                   // Remove trailing commas before object close
    .replace(/,\s*]/g, ']')                   // Remove trailing commas before array close
    .trim();
};

export const handleCalendarEvent = async (_context: LlamaContext, llmResponse: string): Promise<string> => {
  let jsonText = '';
  try {
    console.log('Raw LLM Response:', llmResponse);

    // Step 1: Extract first JSON-like block
    const jsonMatch = llmResponse.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) {
      throw new Error(`No valid JSON found. Raw output: "${llmResponse}"`);
    }

    // Step 2: Clean the JSON string
    jsonText = cleanJsonString(jsonMatch[0]);
    console.log('Cleaned JSON:', jsonText);

    // Step 3: Try parsing JSON
    const eventData: Partial<CalendarEvent> = JSON.parse(jsonText);

    // Step 4: Validate required fields
    if (!eventData.Date || !eventData.Time || !eventData.Event) {
      throw new Error('Missing required fields in JSON');
    }

    console.log('Parsed Event Data:', eventData);

    // Step 5: Format time and build event
    const { Date: date, Time: time, Event: title = 'Untitled Event', location = '', notes = '' } = eventData;
    const startMoment = moment(`${date}T${time}`, moment.ISO_8601);

    if (!startMoment.isValid()) {
      throw new Error('Invalid date or time format');
    }

    const startDate = startMoment.toISOString();
    const endDate = startMoment.clone().add(1, 'hour').toISOString();

    // Step 6: Show calendar event dialog
    await AddCalendarEvent.presentEventCreatingDialog({
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

    return `Calendar event dialog shown for: ${title}. JSON used: ${jsonText}`;
  } catch (error) {
    // Fallback in case of failure
    const now = new Date();
    const fallback: CalendarEvent = {
      Date: now.toISOString().split('T')[0],
      Time: now.toTimeString().slice(0, 5),
      Event: 'Untitled Event',
    };
    console.warn('JSON parsing failed. Falling back to defaults:', error);
    return `JSON parsing failed. Raw output: "${jsonText}". Using defaults: ${JSON.stringify(fallback)}`;
  }
};
