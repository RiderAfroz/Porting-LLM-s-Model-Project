import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  TextInput,
  Button,
  Text,
  ScrollView,
  StyleSheet,
} from 'react-native';
import RNFS from 'react-native-fs';
import { initLlama, LlamaContext } from 'llama.rn';
import { routeTask } from './utils/taskRouter';

const App: React.FC = () => {
  const [context, setContext] = useState<LlamaContext | null>(null);
  const [message, setMessage] = useState<string>('');
  const [response, setResponse] = useState<string>('Checking model...');

  const modelPath = 'file:///storage/emulated/0/Android/data/com.chat/files/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
  const modelUrl = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

  useEffect(() => {
    const setupModel = async () => {
      try {
        const localPath = modelPath.replace('file://', '');
        const fileExists = await RNFS.exists(localPath);
        if (!fileExists) {
          setResponse('Downloading model...');
          await RNFS.downloadFile({ fromUrl: modelUrl, toFile: localPath }).promise;
          setResponse('Model downloaded!');
        } else {
          setResponse('Model already exists.');
        }

        const llamaContext = await initLlama({
          model: modelPath,
          n_ctx: 512,
          n_gpu_layers: 0,
          n_threads: 4,
        });
        setContext(llamaContext);
        setResponse('Model loaded. Type a command!');
      } catch (err) {
        setResponse(`Error: ${(err as Error).message}`); // Fixed syntax
      }
    };
    setupModel();
  }, []);

  const sendCommand = async () => {
    if (!context || !message.trim()) return;
    setResponse('Processing...');
    try {
      const result = await context.completion({
        messages: [
          {
            role: 'system',
            content: `
            Generate simple json format if date time given from given text. Parse the date,time and event from the given sentence and give pure json format {"Date":"2025-12-24","Time":"13:00","Event":"appointment" }
            `,
          },
          { role: 'user', content: message },
        ],
        n_predict: 500,
        temperature: 0.7,
      });

      const taskResult = await routeTask(message, context, result.text);
      setResponse(taskResult);
      setMessage('');
    } catch (err) {
      setResponse(`Error: ${(err as Error).message}`); // Fixed syntax
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.chatContainer}>
        <Text style={styles.responseText}>{response}</Text>
      </ScrollView>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="e.g., set a birthday event on 26 Jan 2026 at 6am"
        placeholderTextColor="#A5A5A5"
      />
      <Button title="Send" onPress={sendCommand} disabled={!context} color="#7612FA" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#0B1228' },
  chatContainer: { flex: 1, marginBottom: 10, padding: 10, marginTop: 25 },
  responseText: { color: '#fff', marginVertical: 5 },
  input: {
    borderWidth: 2,
    borderColor: '#293C7E',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
    color: '#fff',
    backgroundColor: '#0F193D',
  },
});

export default App;