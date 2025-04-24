import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  LogBox,
} from 'react-native';
import { initLlama, LlamaContext } from 'llama.rn';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AudioWaveform from './audiowaveformCode';
import { routeTask } from '../utils/taskRouter';

const MODELS_DIR = `/storage/emulated/0/Android/data/com.chat/files/models`;
const SELECTED_MODEL_KEY = 'selected_model';
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

type Message = {
  text: string;
  type: 'user' | 'bot';
  time: string;
  responseTime?: string;
};

const ChatScreen = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [context, setContext] = useState<LlamaContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [modelStatus, setModelStatus] = useState('Loading...');
  const [currentModel, setCurrentModel] = useState('');
  const [errorCount, setErrorCount] = useState(0); // Track errors for debugging

  // Suppress specific warnings (e.g., from RNFS or AsyncStorage)
  useEffect(() => {
    LogBox.ignoreLogs(['new NativeEventEmitter']); // Example suppression
  }, []);

  // Load and initialize the selected model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        const selectedModelId = await AsyncStorage.getItem(SELECTED_MODEL_KEY);
        if (!selectedModelId) {
          throw new Error('No model selected. Please select a model from the Models screen.');
        }

        const modelPath = `${MODELS_DIR}/${selectedModelId}.gguf`;
        const exists = await RNFS.exists(modelPath).catch((err) => {
          console.error('RNFS.exists error:', err);
          return false;
        });
        if (!exists) {
          throw new Error(`Model file not found at ${modelPath}. Verify storage permissions.`);
        }

        setModelStatus(`Loading ${selectedModelId}...`);
        setCurrentModel(selectedModelId);

        const llamaContext = await initLlama({
          model: `file://${modelPath}`,
          n_ctx: 512,
          n_gpu_layers: 0,
          n_threads: 4,
        }).catch((err) => {
          throw new Error(`Failed to initialize Llama: ${err.message}`);
        });

        if (!llamaContext) {
          throw new Error('Llama context initialization returned null.');
        }
        setContext(llamaContext);
        setModelStatus(`Model loaded: ${selectedModelId}`);
        setMessages((prev) => [
          ...prev,
          { text: '🤖 Model loaded. Ready to chat!', type: 'bot', time: getCurrentTime() },
        ]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setModelStatus(`Error: ${errorMessage}`);
        setErrorCount((prev) => prev + 1);
        console.error('Model initialization error:', errorMessage);
        Alert.alert(
          'Model Error',
          errorMessage,
          [
            {
              text: 'Select Model',
              onPress: () => navigation.navigate('Models'),
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ],
        );
      }
    };

    initializeModel();

    return () => {
      if (context) {
        try {
          context.release();
        } catch (releaseError) {
          console.error('Error releasing context:', releaseError);
        }
      }
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() || !context || isLoading || isListening) return;

    const userMessage = {
      text: inputText,
      type: 'user' as const,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const question = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      const startTime = Date.now();

      const response = await routeTask(question, context).catch((err) => {
        throw new Error(`Task routing failed: ${err.message}`);
      });

      if (!response || typeof response !== 'string') {
        throw new Error('Invalid response from routeTask');
      }

      const endTime = Date.now();
      const responseDuration = ((endTime - startTime) / 1000).toFixed(2) + 's';

      const botMessage = {
        text: response,
        type: 'bot' as const,
        time: getCurrentTime(),
        responseTime: responseDuration,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setErrorCount((prev) => prev + 1);
      console.error('Send error:', errorMessage);
      setMessages((prev) => [
        ...prev,
        {
          text: `❌ Error: ${errorMessage}`,
          type: 'bot' as const,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      Alert.alert('Error', `Failed to generate response: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    if (isLoading || !context) {
      console.warn('Cannot start listening: Loading or no context');
      return;
    }
    setIsListening(true);
  };

  const stopListening = () => {
    setIsListening(false);
    // Replace with actual transcription logic
    setInputText('Transcribed text'); // Placeholder
  };

  const cancelListening = () => {
    setIsListening(false);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.type === 'user' ? styles.userMessage : styles.botMessage,
    ]}>
      <Text style={styles.messageText}>{item.text}</Text>
      <Text style={styles.messageTime}>
        {item.time} {item.responseTime && `· ${item.responseTime}`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.modelStatus}>{modelStatus}</Text>
        {currentModel && (
          <TouchableOpacity
            style={styles.changeModelButton}
            onPress={() => {
              try {
                navigation.navigate('Models');
              } catch (navError) {
                console.error('Navigation error:', navError);
                Alert.alert('Navigation Error', 'Failed to navigate to Models screen');
              }
            }}
          >
            <Text style={styles.changeModelText}>Change Model</Text>
          </TouchableOpacity>
        )}
      </View>

      {!context ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.loadingText}>{modelStatus}</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.messagesContainer}
          onError={(error) => console.error('FlatList error:', error)} // Handle FlatList errors
        />
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
              <Icon name="cancel" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#888"
            editable={!!context && !isLoading && !isListening}
            multiline
            onError={(e) => console.error('TextInput error:', e)} // Handle TextInput errors
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!context || isLoading || isListening) && styles.disabledButton,
            ]}
            onPress={handleSend}
            disabled={!context || isLoading || isListening}
            onPressIn={() => console.log('Send button pressed')} // Debug button press
          >
            <Icon
              name="send"
              size={24}
              color={!context || isLoading || isListening ? '#aaa' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.micButton,
              (!context || isLoading || isListening) && styles.disabledButton,
            ]}
            onPress={startListening}
            disabled={!context || isLoading || isListening}
            onPressIn={() => console.log('Mic button pressed')} // Debug button press
          >
            <Icon
              name="mic"
              size={24}
              color={!context || isLoading || isListening ? '#aaa' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelStatus: {
    fontSize: 14,
    color: '#666',
  },
  changeModelButton: {
    padding: 8,
  },
  changeModelText: {
    color: '#6200EE',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#6200EE',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e3f2fd',
    borderBottomRightRadius: 0,
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f5f5f5',
    borderBottomLeftRadius: 0,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 24,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
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
    color: '#6200EE',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    marginTop: 12,
  },
  controlButton: {
    backgroundColor: '#6200EE',
    borderRadius: 24,
    padding: 12,
    marginHorizontal: 8,
  },
});

export default ChatScreen;