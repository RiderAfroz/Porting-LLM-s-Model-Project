import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet } from 'react-native';
import RNFS from 'react-native-fs'; // For file operations
import { initLlama } from 'llama.rn';

const App = () => {
  const [context, setContext] = useState(null);
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('Checking model...');

  const modelPath = 'file:///storage/emulated/0/Android/data/com.chat/files/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
  const modelUrl = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

  // Load or download the model
  useEffect(() => {
    const setupModel = async () => {
      try {
        const localPath = modelPath.replace('file://', ''); // Remove 'file://' for RNFS

        // Check if model exists
        const fileExists = await RNFS.exists(localPath);
        if (!fileExists) {
          setResponse('Downloading model...');
          await RNFS.downloadFile({
            fromUrl: modelUrl,
            toFile: localPath,
          }).promise;
          setResponse('Model downloaded!');
        } else {
          setResponse('Model already exists.');
        }

        // Initialize Llama with the model
        const llamaContext = await initLlama({
          model: modelPath,
          n_ctx: 512,
          n_gpu_layers: 0,
          n_threads: 4,
        });
        setContext(llamaContext);
        setResponse('Model loaded. Type a message!');
      } catch (err) {
        setResponse(`Error: ${err.message}`);
      }
    };

    setupModel();
  }, []);

  // Handle sending a message
  const sendCommand = async () => {
    if (!context || !message.trim()) return;
    setResponse('Generating...');
    try {
      const result = await context.completion({
        messages: [
          { role: 'system', content: 'You are a friendly chatbot.' },
          { role: 'user', content: message },
        ],
        n_predict: 50,
        temperature: 0.7,
      });
      setResponse(result.text);
      setMessage('');
    } catch (err) {
      setResponse(`Error: ${err.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.chatContainer}>
        <Text style={styles.responseText}>{response}</Text>
      </ScrollView>
      <TextInput
        style={styles.input}
        value={message}
        onChangeText={setMessage}
        placeholder="Type your message..."
      />
      <Button title="Send" onPress={sendCommand} disabled={!context} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  chatContainer: { flex: 1, marginBottom: 10 },
  responseText: { color: '#000', marginVertical: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 },
});

export default App;