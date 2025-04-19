import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import RNFS from 'react-native-fs';
import { initLlama, LlamaContext } from 'llama.rn';
import AudioWaveform from './audiowaveformCode';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { routeTask } from '../utils/taskRouter';

const ChatScreen = () => {
  const [messages, setMessages] = useState<
    { text: string; type: 'user' | 'bot'; time: string; responseTime?: string }[]
  >([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [context, setContext] = useState<LlamaContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const modelPath = 'file:///storage/emulated/0/Android/data/com.chat/files/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
  const modelUrl = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  useEffect(() => {
    const setupModel = async () => {
      try {
        const localPath = modelPath.replace('file://', '');
        const fileExists = await RNFS.exists(localPath);
        if (!fileExists) {
          setMessages((prev) => [
            ...prev,
            { text: '⬇️ Downloading model...', type: 'bot', time: getCurrentTime() },
          ]);

          await RNFS.downloadFile({
            fromUrl: modelUrl,
            toFile: localPath,
            progress: (res) => {
              const percentage = Math.round((res.bytesWritten / res.contentLength) * 100);
              setDownloadProgress(percentage);
            },
            progressDivider: 1,
          }).promise;

          setMessages((prev) => [
            ...prev,
            { text: '✅ Model downloaded!', type: 'bot', time: getCurrentTime() },
          ]);
        }

        const llamaContext = await initLlama({
          model: modelPath,
          n_ctx: 512,
          n_gpu_layers: 0,
          n_threads: 4,
        });

        setContext(llamaContext);
        setMessages((prev) => [
          ...prev,
          { text: '🤖 Model loaded. Ready to chat!', type: 'bot', time: getCurrentTime() },
        ]);
        setDownloadProgress(null);
      } catch (err) {
        console.error('Model setup error:', err);
        setMessages((prev) => [
          ...prev,
          {
            text: `❌ Error loading model: ${(err as Error).message}`,
            type: 'bot',
            time: getCurrentTime(),
          },
        ]);
      }
    };

    setupModel();
  }, []);

  const handleSend = async () => {
    if (inputText.trim() === '' || !context) return;

    const sendTime = new Date();
    const userMessage = {
      text: inputText,
      type: 'user' as const,
      time: sendTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const startTime = Date.now();
      const taskResult = await routeTask(inputText, context);
      const endTime = Date.now();
      const responseDuration = ((endTime - startTime) / 1000).toFixed(2) + 's';

      const botMessage = {
        text: taskResult,
        type: 'bot' as const,
        time: getCurrentTime(),
        responseTime: responseDuration,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Task routing error:', err);
      setMessages((prev) => [
        ...prev,
        {
          text: `❌ Error: ${(err as Error).message}`,
          type: 'bot',
          time: getCurrentTime(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => setIsListening(true);

  const stopListening = () => {
    setIsListening(false);
    setInputText('Transcribed text');
  };

  const cancelListening = () => setIsListening(false);
  const renderMessage = ({ item }: { item: typeof messages[0] }) => (
    <View style={{ marginBottom: 8 }}>
      <View style={item.type === 'user' ? styles.userMessage : styles.botMessage}>
        <Text style={[styles.messageText, item.type === 'bot' && styles.botMessageText]}>
          {item.text}
        </Text>
      </View>
      <Text
        style={[
          styles.timeText,
          item.type === 'user' ? { textAlign: 'right' } : { textAlign: 'left' },
        ]}
      >
        {item.time}
        {item.responseTime ? ` · ⏱ ${item.responseTime}` : ''}
      </Text>
    </View>
  );
  

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messagesContainer}
      />

      {downloadProgress !== null && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>⬇️ Downloading model... {downloadProgress}%</Text>
        </View>
      )}

      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>⏳ Generating response...</Text>
        </View>
      )}

      {isListening && (
        <View style={styles.listeningContainer}>
          <AudioWaveform />
          <Text style={styles.listeningText}>🎙️ Listening...</Text>
          <View style={styles.controls}>
            <TouchableOpacity onPress={stopListening} style={styles.controlButton}>
              <Icon name="check-circle" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={cancelListening} style={styles.controlButton}>
              <Icon name="close-circle" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            value={inputText}
            onChangeText={setInputText}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendButton, !context && styles.disabledButton]}
            disabled={!context || isLoading}
          >
            <Icon name="send-circle-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={startListening}
            style={[styles.micButton, isLoading && styles.disabledButton]}
            disabled={isLoading}
          >
            <Icon name="microphone" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  messagesContainer: { padding: 12, paddingBottom: 120 },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    marginVertical: 4,
    padding: 12,
    maxWidth: '75%',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    marginVertical: 4,
    padding: 12,
    maxWidth: '75%',
  },
  messageText: { color: '#fff', fontSize: 15 },
  botMessageText: { color: '#333' },
  timeText: {
    fontSize: 12,
    marginTop: 4,
    color: '#aaa',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f2f2f2',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 16,
    marginRight: 8,
    color: '#333',
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 24,
    padding: 10,
    marginRight: 8,
  },
  micButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 24,
    padding: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  listeningContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  listeningText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    marginTop: 12,
  },
  controlButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 24,
    padding: 12,
    marginHorizontal: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 8,
  },
  loadingText: {
    color: '#6C63FF',
    fontSize: 14,
  },
});

export default ChatScreen;
