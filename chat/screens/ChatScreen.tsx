import React, { useState, useEffect } from 'react';
import { Image } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import LinearGradient from 'react-native-linear-gradient';
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

// Use platform-specific paths for MODELS_DIR
const MODELS_DIR = RNFS.ExternalDirectoryPath + '/models';

const SELECTED_MODEL_KEY = 'selected_model';
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

type Message = {
  text: string;
  type: 'user' | 'bot' | 'loading';
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
  const [errorCount, setErrorCount] = useState(0);
  const [modelError, setModelError] = useState<string | null>(null);

  useEffect(() => {
    LogBox.ignoreLogs(['new NativeEventEmitter']);
  }, []);

  useEffect(() => {
    const initializeModel = async () => {
      try {
        const selectedModelId = await AsyncStorage.getItem(SELECTED_MODEL_KEY);
        if (!selectedModelId) {
          throw new Error('No model selected. Please select a model to start chatting.');
        }

        const modelPath = `${MODELS_DIR}/${selectedModelId}.gguf`;
        const exists = await RNFS.exists(modelPath).catch((err) => {
          console.error('RNFS.exists error:', err);
          return false;
        });
        if (!exists) {
          throw new Error(`The selected model could not be found. Please download a model to continue.`);
        }

        setModelStatus(`Loading ${selectedModelId}...`);
        setCurrentModel(selectedModelId);

        const llamaContext = await initLlama({
          model: `file://${modelPath}`,
          n_ctx: 512,
          n_gpu_layers: 0,
          n_threads: 4,
        }).catch((err) => {
          throw new Error(`Failed to initialize the model. Please try again or select a different model.`);
        });

        if (!llamaContext) {
          throw new Error('Model initialization failed. Please try again.');
        }
        setContext(llamaContext);
        setModelStatus(`Model loaded: ${selectedModelId}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setModelStatus(`Error: ${errorMessage}`);
        setModelError(errorMessage);
        setErrorCount((prev) => prev + 1);
        console.error('Model initialization error:', errorMessage);
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

  const LoadingDots = () => {
    const [dots, setDots] = useState('');

    useEffect(() => {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
      }, 400);
      return () => clearInterval(interval);
    }, []);

    return <Text style={styles.loadingText}>Generating{dots}</Text>;
  };

  const displayWordByWord = (response: string, startTime: number) => {
    const words = response.split(' ');
    let currentIndex = 0;

    const typeNextWord = () => {
      if (currentIndex >= words.length) {
        const responseDuration = ((Date.now() - startTime) / 1000).toFixed(2) + 's';
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) last.responseTime = responseDuration;
          return updated;
        });
        setIsLoading(false);
        return;
      }

      const partial = words.slice(0, currentIndex + 1).join(' ');
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          text: partial,
          type: 'bot',
          time: getCurrentTime(),
        };
        return updated;
      });

      currentIndex++;
      setTimeout(typeNextWord, 60 + Math.random() * 40);
    };

    typeNextWord();
  };

  const handleSend = async () => {
    if (!inputText.trim() || !context || isLoading || isListening) return;

    const userMessage = {
      text: inputText.trim(),
      type: 'user' as const,
      time: getCurrentTime(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      { text: '...', type: 'loading' as const, time: getCurrentTime() },
    ]);

    try {
      const startTime = Date.now();
      const response = await routeTask(userMessage.text, context);

      if (!response || typeof response !== 'string') {
        throw new Error('Invalid response from routeTask');
      }

      displayWordByWord(response, startTime);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Send error:', errorMessage);
      setErrorCount((prev) => prev + 1);

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];

        if (last?.type === 'loading') {
          updated[updated.length - 1] = {
            text: `❌ Error: ${errorMessage}`,
            type: 'bot',
            time: getCurrentTime(),
          };
        } else {
          updated.push({
            text: `❌ Error: ${errorMessage}`,
            type: 'bot',
            time: getCurrentTime(),
          });
        }

        return updated;
      });

      Alert.alert('Error', `Failed to generate response: ${errorMessage}`);
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
    setInputText('Transcribed text');
  };

  const cancelListening = () => {
    setIsListening(false);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.type === 'user'
          ? styles.userMessage
          : item.type === 'loading'
            ? styles.loadingMessage
            : styles.botMessage,
      ]}
    >
      <View style={styles.messageRow}>
        {item.type === 'bot' && (
          <Image
            source={require('./logo.png')}
            style={styles.botIcon}
          />
        )}
        <View style={styles.textContainer}>
          {item.type === 'loading' ? (
            <LoadingDots />
          ) : (
            <Text style={styles.messageText}>{item.text}</Text>
          )}
        </View>
      </View>
      <View style={styles.messageTime}>
        <Text style={styles.messageTimeText}>{item.time}</Text>
        {item.responseTime && (
          <Text style={styles.responseTime}> · {item.responseTime}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {currentModel && (
          <TouchableOpacity
            style={styles.modelContainer}
            onPress={() => {
              try {
                navigation.navigate('Models');
              } catch (navError) {
                console.error('Navigation error:', navError);
                Alert.alert('Navigation Error', 'Failed to navigate to Models screen');
              }
            }}
          >
            <Text style={styles.modelName}>{currentModel}</Text>
            <Icon name="arrow-drop-down" size={24} color="grey" />
          </TouchableOpacity>
        )}
      </View>

      {!context && !modelError ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200EE" />
          <Text style={styles.loadingText}>{modelStatus}</Text>
        </View>
      ) : !context && modelError ? (
        <View style={styles.welcomeContainer}>
          <Text style={styles.errorText}>{modelError}</Text>
          <TouchableOpacity
            style={styles.selectModelButton}
            onPress={() => navigation.navigate('Models')}
          >
            <Text style={styles.selectModelButtonText}>Go to Models Screen</Text>
          </TouchableOpacity>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.welcomeContainer}>
          <MaskedView
            maskElement={
              <View style={styles.maskContainer}>
                <Text style={[styles.welcomeText, { backgroundColor: 'transparent' }]}>
                  How may I help you?
                </Text>
              </View>
            }
          >
            <LinearGradient
              colors={['rgba(232, 74, 127, 1)', 'rgba(122, 95, 255, 1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.welcomeText, { opacity: 0 }]}>
                How may I help you?
              </Text>
            </LinearGradient>
          </MaskedView>
        </View>
      ) : (
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.messagesContainer}
          onError={(error) => console.error('FlatList error:', error)}
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
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type your message..."
            placeholderTextColor="#888"
            editable={!!context && !isLoading && !isListening}
            multiline
            onError={(e) => console.error('TextInput error:', e)}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleSend}
              disabled={!context || isLoading || isListening}
              onPressIn={() => console.log('Send button pressed')}
            >
              <Icon
                name="send"
                size={24}
                color={!context || isLoading || isListening ? '#aaa' : '#888'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={startListening}
              disabled={!context || isLoading || isListening}
              onPressIn={() => console.log('Mic button pressed')}
            >
              <Icon
                name="mic"
                size={24}
                color={!context || isLoading || isListening ? '#aaa' : '#888'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#101626',
  },
  modelContainer: {
    alignItems: 'center',
  },
  modelName: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'sans-serif',
  },
  modelStatus: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'sans-serif',
  },
  arrowButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 17,
    color: '#FFFFFF',
    fontFamily: 'sans-serif',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  maskContainer: {
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    color: '#E5E7EB',
    fontFamily: 'sans-serif',
  },
  errorText: {
    fontSize: 18,
    color: '#FF6F91',
    fontFamily: 'sans-serif',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  selectModelButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  selectModelButtonText: {
    fontSize: 16,
    color: '#F9FAFB',
    fontFamily: 'sans-serif',
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  messageContainer: {
    marginBottom: 14,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#8616f6',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 20,
    borderBottomRightRadius: 0,
    maxWidth: '80%',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    maxWidth: '90%',
  },
  loadingMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 0,
    maxWidth: '80%',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textContainer: {
    flexShrink: 1,
  },
  messageText: {
    fontSize: 15,
    color: '#E5E7EB',
    lineHeight: 24,
    fontFamily: 'sans-serif',
  },
  messageTime: {
    flexDirection: 'row',
    marginTop: 4,
    marginLeft: 24,
  },
  messageTimeText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'sans-serif',
  },
  responseTime: {
    fontSize: 13,
    color: '#9CA3AF',
    fontFamily: 'sans-serif',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 14, // Increased from 16 to 24 to reduce width
    marginVertical: 12,
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: 130,
    fontSize: 17,
    color: '#F9FAFB',
    fontFamily: 'sans-serif',
    paddingVertical: 14,
    paddingRight: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    position: 'absolute',
    right: 10,
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
  },
  listeningContainer: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  listeningText: {
    marginTop: 10,
    fontSize: 17,
    color: '#8B5CF6',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  controls: {
    flexDirection: 'row',
    marginTop: 16,
  },
  controlButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    fontFamily: 'Inter',
  },
  botIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
    resizeMode: 'contain',
    marginTop: 4,
  },
});

export default ChatScreen;