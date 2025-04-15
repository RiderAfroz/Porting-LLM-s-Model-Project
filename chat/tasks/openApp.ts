import { Linking, Platform, NativeModules } from 'react-native';
import { LlamaContext } from '../utils/types';

const { AppLauncherModule } = NativeModules;

const appNameToPackageMap: Record<string, string> = {
  youtube: 'com.google.android.youtube',
  photos: 'com.google.android.apps.photos',
  calendar: 'com.google.android.calendar',
  gmail: 'com.google.android.gm',
  whatsapp: 'com.whatsapp',
  chrome: 'com.android.chrome',
  facebook: 'com.facebook.katana',
  instagram: 'com.instagram.android',
  camera: 'com.android.camera',
  messages: 'com.google.android.apps.messaging',
};

export const handleOpenApp = async (
  context: LlamaContext,
  userInput: string
): Promise<string> => {
  try {
    console.log('Raw User Input (Open App):', userInput);

    const systemPrompt = `Extract the application name after the word "open" from the given sentence. Respond in pure JSON format like {"App":""}. Use lowercase app names without space, e.g. "youtube", "calendar", "googlephotos".`;

    const result = await context.completion({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      n_predict: 300,
      temperature: 0.5
    });

    const raw = result.text.trim();
    console.log('Raw LLM Response (Open App):', raw);

    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('No valid JSON found');

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('Parsed JSON:', parsed);
    if (!parsed || typeof parsed.App !== 'string') {
      throw new Error(`Invalid or missing "App" key in parsed JSON: ${JSON.stringify(parsed)}`);
    }
    const userAppName = parsed.App?.toLowerCase().trim();

    if (!userAppName) throw new Error('No app name found');

    const appPackage = appNameToPackageMap[userAppName];

    if (!appPackage) {
      return ` I couldn't find a known app for "${userAppName}". Please try a different app.`;
    }

    if (Platform.OS === 'android') {
      const isAvailable = await AppLauncherModule.isAppInstalled(appPackage);
      if (!isAvailable) {
        return ` App "${userAppName}" is not installed on this device.`;
      }

      await AppLauncherModule.launchApp(appPackage);
      return ` Opening ${userAppName}...`;

    } else if (Platform.OS === 'ios') {
      const appUrlScheme = `${userAppName}://`;
      const supported = await Linking.canOpenURL(appUrlScheme);
      if (!supported) {
        return ` App "${userAppName}" is not installed or URL scheme is unavailable.`;
      }

      await Linking.openURL(appUrlScheme);
      return ` Opening ${userAppName}...`;
    }

    return ' Platform not supported for launching apps.';
  } catch (err) {
    console.warn('Open App failed:', err);
    return ` Failed to open app. ${err}`;
  }
};
