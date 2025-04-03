import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, StyleSheet, SafeAreaView, Pressable } from 'react-native';
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
          { role: 'system', content:  'You are a json format generating and friendly chatbot which parse date,time and event from the given sentence and give pure json format {"Date":" ","Time":" ","Event":" " }' },
          { role: 'user', content: message },
        ],
        n_predict: 500,
        temperature: 0.7,
      });
      setResponse(result.text);
      setMessage('');
    } catch (err) {
      setResponse(`Error: ${err.message}`);
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
        placeholder="Type your message..."
        placeholderTextColor="#A5A5A5"
      />
      <Button title="Send" onPress={sendCommand} disabled={!context} color="#7612FA"  />
      

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10,backgroundColor:'#0B1228' },
  chatContainer: { flex: 1, marginBottom: 10,padding:10,marginTop:25 },
  responseText: { color: '#fff', marginVertical: 5 },
  input: { borderWidth: 2, borderColor: '#293C7E', padding: 10, marginBottom: 10, borderRadius: 8,color:'#fff',backgroundColor:'#0F193D' },
});

export default App;