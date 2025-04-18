// properly handling of calls to many types of words and numbers.
import { PermissionsAndroid, Platform, NativeModules } from 'react-native';
import { LlamaContext } from '../utils/types';

const { ContactModule } = NativeModules;

// Helper to normalize names (trim + lowercase + single spacing)
const normalize = (str: string): string => {
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
};

export const handleContactCall = async (
  context: LlamaContext,
  userInput: string
): Promise<string> => {
  try {
    console.log('Raw User Input (Contact Call):', userInput);

    // Direct number call handling
    const phoneNumberMatch = userInput.match(/\+?\d{10,}/);
    if (phoneNumberMatch) {
      const number = phoneNumberMatch[0];
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CALL_PHONE
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return '⚠️ Permission denied for calling.';
        }
        ContactModule.callNumber(number);
        return `📞 Calling ${number}...`;
      } else {
        return '⚠️ Not supported on this platform.';
      }
    }

    // Ask LLM to extract name
    const systemPrompt = `Extract the exact name after "call" or "call to" from the text. Respond only with JSON like {"Name":""}.`;
    const result = await context.completion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      n_predict: 300,
      temperature: 0.5
    });

    const raw = result.text.trim();
    console.log('Raw LLM Response (Contact Call):', raw);

    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('No valid JSON found');

    const parsed = JSON.parse(jsonMatch[0]);
    const extractedName = parsed.Name?.trim();
    if (!extractedName) throw new Error('No contact name found');

    const normalizedInput = normalize(extractedName);

    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        PermissionsAndroid.PERMISSIONS.CALL_PHONE
      ]);

      if (
        granted['android.permission.READ_CONTACTS'] !== PermissionsAndroid.RESULTS.GRANTED ||
        granted['android.permission.CALL_PHONE'] !== PermissionsAndroid.RESULTS.GRANTED
      ) {
        return '⚠️ Permissions denied for contacts or calling.';
      }

      const contacts = await ContactModule.getContacts();
      console.log('📇 Native Contacts:', contacts);

      // STRICT exact match only (normalized)
      const match = contacts.find((c: any) => {
        if (!c.name) return false;
        const normalizedContact = normalize(c.name);
        return normalizedContact === normalizedInput;
      });

      if (!match || !match.number) {
        return `❌ No contact found with name "${extractedName}"`;
      }

      ContactModule.callNumber(match.number);
      return `📞 Calling ${match.name} (${match.number})...`;
    } else {
      return '⚠️ Not supported on this platform.';
    }

  } catch (err) {
    console.warn('Contact Call failed:', err);
    return `⚠️ Failed to call contact. ${err}`;
  }
};
