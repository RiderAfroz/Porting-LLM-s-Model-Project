import { Linking, Platform, NativeModules } from 'react-native';
import { LlamaContext } from '../utils/types';

const { AppLauncherModule } = NativeModules; 
//handling of opening the app
export const handleOpenApp = async (
  context: LlamaContext,
  userInput: string
): Promise<string> => {
  try {
    console.log('Raw User Input (Open App):', userInput);

    const systemPrompt = `Extract the application name after the word "open" from the given sentence. Respond in pure JSON format like {"App":""}. If app name has multiple words, combine them without space or as written.`;

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
    const appName = parsed.App?.trim();

    if (!appName) throw new Error('No app name found');

    if (Platform.OS === 'android') {
      const isAvailable = await AppLauncherModule.isAppInstalled(appName);

      if (!isAvailable) {
        return ` App "${appName}" is not installed on this device.`;
      }

      await AppLauncherModule.launchApp(appName);
      return ` Opening ${appName}...`;

    } else if (Platform.OS === 'ios') {//for ios
      const appUrlScheme = `${appName.toLowerCase()}://`;

      const supported = await Linking.canOpenURL(appUrlScheme);
      if (!supported) {
        return ` App "${appName}" is not installed or URL scheme is unavailable.`;
      }

      await Linking.openURL(appUrlScheme);
      return ` Opening ${appName}...`;
    }

    return ' Platform not supported for launching apps.';
  } catch (err) {
    console.warn('Open App failed:', err);
    return ` Failed to open app. ${err}`;
  }
};