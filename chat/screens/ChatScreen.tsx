//Rayyan Old code

// import React, { useEffect, useState } from 'react';
// import {
//   SafeAreaView,
//   TextInput,
//   Button,
//   Text,
//   ScrollView,
//   StyleSheet,
// } from 'react-native';
// import RNFS from 'react-native-fs';
// import { initLlama, LlamaContext } from 'llama.rn';
// import { routeTask } from '../utils/taskRouter';

// const App: React.FC = () => {
//   const [context, setContext] = useState<LlamaContext | null>(null);
//   const [message, setMessage] = useState<string>('');
//   const [response, setResponse] = useState<string>('Checking model...');

//   const modelPath = 'file:///storage/emulated/0/Android/data/com.chat/files/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
//   const modelUrl = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

//   useEffect(() => {
//     const setupModel = async () => {
//       try {
//         const localPath = modelPath.replace('file://', '');
//         const fileExists = await RNFS.exists(localPath);
//         if (!fileExists) {
//           setResponse('Downloading model...');
//           await RNFS.downloadFile({ fromUrl: modelUrl, toFile: localPath }).promise;
//           setResponse('Model downloaded!');
//         } else {
//           setResponse('Model already exists.');
//         }

//         const llamaContext = await initLlama({
//           model: modelPath,
//           n_ctx: 512,
//           n_gpu_layers: 0,
//           n_threads: 4,
//         });
//         setContext(llamaContext);
//         setResponse('Model loaded. Type a command!');
//       } catch (err) {
//         setResponse(`Error: ${(err as Error).message}`);
//       }
//     };
//     setupModel();
//   }, []);

//   const sendCommand = async () => {
//     if (!context || !message.trim()) return;
//     setResponse('Processing...');
//     try {
//       const taskResult = await routeTask(message, context);
//       setResponse(taskResult);
//       setMessage('');
//     } catch (err) {
//       setResponse(`Error: ${(err as Error).message}`);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView style={styles.chatContainer}>
//         <Text style={styles.responseText}>{response}</Text>
//       </ScrollView>
//       <TextInput
//         style={styles.input}
//         value={message}
//         onChangeText={setMessage}
//         placeholder="e.g., set a birthday event on 26 Jan 2026 at 6am"
//         placeholderTextColor="#A5A5A5"
//       />
//       <Button title="Send" onPress={sendCommand} disabled={!context} color="#7612FA" />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 10, backgroundColor: '#0B1228' },
//   chatContainer: { flex: 1, marginBottom: 10, padding: 10, marginTop: 25 },
//   responseText: { color: '#fff', marginVertical: 5 },
//   input: {
//     borderWidth: 2,
//     borderColor: '#293C7E',
//     padding: 10,
//     marginBottom: 10,
//     borderRadius: 8,
//     color: '#fff',
//     backgroundColor: '#0F193D',
//   },
// });

// export default App;



// ✅ Final Clean & Optimized Code with TinyLlama Integration
// Path: src/screens/ChatScreen.tsx
// new chatscreen.tsx that is working all ui and mic not functioning
// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   TextInput,
//   TouchableOpacity,
//   Text,
//   StyleSheet,
//   FlatList,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native';
// import RNFS from 'react-native-fs';
// import { initLlama, LlamaContext } from 'llama.rn';
// import AudioWaveform from './audiowaveformCode';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
// import { routeTask } from '../utils/taskRouter';

// const ChatScreen = () => {
//   const [messages, setMessages] = useState<{ text: string; type: 'user' | 'bot' }[]>([]);
//   const [inputText, setInputText] = useState('');
//   const [isListening, setIsListening] = useState(false);
//   const [context, setContext] = useState<LlamaContext | null>(null);
//   const [isLoading, setIsLoading] = useState(false);

//   // TinyLlama model configuration
//   const modelPath = 'file:///storage/emulated/0/Android/data/com.chat/files/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
//   const modelUrl = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

//   // Initialize TinyLlama model
//   useEffect(() => {
//     const setupModel = async () => {
//       try {
//         const localPath = modelPath.replace('file://', '');
//         const fileExists = await RNFS.exists(localPath);
//         if (!fileExists) {
//           setMessages((prev) => [...prev, { text: 'Downloading model...', type: 'bot' }]);
//           await RNFS.downloadFile({ fromUrl: modelUrl, toFile: localPath }).promise;
//           setMessages((prev) => [...prev, { text: 'Model downloaded!', type: 'bot' }]);
//         }

//         const llamaContext = await initLlama({
//           model: modelPath,
//           n_ctx: 512,
//           n_gpu_layers: 0,
//           n_threads: 4,
//         });
//         setContext(llamaContext);
//         setMessages((prev) => [...prev, { text: 'Model loaded. Ready to chat!', type: 'bot' }]);
//       } catch (err) {
//         console.error('Model setup error:', err);
//         setMessages((prev) => [
//           ...prev,
//           { text: `Error loading model: ${(err as Error).message}`, type: 'bot' },
//         ]);
//       }
//     };
//     setupModel();
//   }, []);

//   // Handle sending text messages
//   const handleSend = async () => {
//     if (inputText.trim() === '' || !context) return;

//     const userMessage = { text: inputText, type: 'user' };
//     setMessages((prev) => [...prev, userMessage]);
//     setInputText('');
//     setIsLoading(true);

//     try {
//       // Use taskRouter to process input like in old ChatScreen
//       const taskResult = await routeTask(inputText, context);
//       const botMessage = { text: taskResult, type: 'bot' };
//       setMessages((prev) => [...prev, botMessage]);
//     } catch (err) {
//       console.error('Task routing error:', err);
//       setMessages((prev) => [
//         ...prev,
//         { text: `Error: ${(err as Error).message}`, type: 'bot' },
//       ]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Voice input handling
//   const startListening = () => {
//     setIsListening(true);
//   };

//   const stopListening = () => {
//     setIsListening(false);
//     // Placeholder for Vosk transcription integration
//     setInputText('Transcribed text');
//   };

//   const cancelListening = () => {
//     setIsListening(false);
//   };

//   const renderMessage = ({ item }: { item: { text: string; type: 'user' | 'bot' } }) => (
//     <View style={item.type === 'user' ? styles.userMessage : styles.botMessage}>
//       <Text style={[styles.messageText, item.type === 'bot' && styles.botMessageText]}>
//         {item.text}
//       </Text>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={messages}
//         renderItem={renderMessage}
//         keyExtractor={(_, index) => index.toString()}
//         contentContainerStyle={styles.messagesContainer}
//       />

//       {/* Loading Indicator */}
//       {isLoading && (
//         <View style={styles.loadingContainer}>
//           <Text style={styles.loadingText}>Generating response...</Text>
//         </View>
//       )}

//       {/* Listening UI */}
//       {isListening && (
//         <View style={styles.listeningContainer}>
//           <AudioWaveform />
//           <Text style={styles.listeningText}>Listening...</Text>
//           <View style={styles.controls}>
//             <TouchableOpacity onPress={stopListening} style={styles.controlButton}>
//               <Icon name="check" size={28} color="#fff" />
//             </TouchableOpacity>
//             <TouchableOpacity onPress={cancelListening} style={styles.controlButton}>
//               <Icon name="close" size={28} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}

//       {/* Input */}
//       <KeyboardAvoidingView
//         behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//         keyboardVerticalOffset={80}
//       >
//         <View style={styles.inputContainer}>
//           <TextInput
//             style={styles.textInput}
//             placeholder="Type a message..."
//             placeholderTextColor="#888"
//             value={inputText}
//             onChangeText={setInputText}
//             editable={!isLoading}
//           />
//           <TouchableOpacity
//             onPress={handleSend}
//             style={[styles.sendButton, !context && styles.disabledButton]}
//             disabled={!context || isLoading}
//           >
//             <Icon name="send" size={24} color="#fff" />
//           </TouchableOpacity>
//           <TouchableOpacity
//             onPress={startListening}
//             style={[styles.micButton, isLoading && styles.disabledButton]}
//             disabled={isLoading}
//           >
//             <Icon name="microphone" size={24} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </KeyboardAvoidingView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
//   messagesContainer: {
//     padding: 12,
//     paddingBottom: 120,
//   },
//   userMessage: {
//     alignSelf: 'flex-end',
//     backgroundColor: '#6C63FF',
//     borderRadius: 16,
//     marginVertical: 4,
//     padding: 12,
//     maxWidth: '75%',
//   },
//   botMessage: {
//     alignSelf: 'flex-start',
//     backgroundColor: '#e0e0e0',
//     borderRadius: 16,
//     marginVertical: 4,
//     padding: 12,
//     maxWidth: '75%',
//   },
//   messageText: {
//     color: '#fff',
//     fontSize: 15,
//   },
//   botMessageText: {
//     color: '#333',
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 8,
//     backgroundColor: '#f2f2f2',
//     borderTopWidth: 1,
//     borderColor: '#ddd',
//   },
//   textInput: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//     borderRadius: 24,
//     paddingHorizontal: 16,
//     marginRight: 8,
//     color: '#333',
//     fontSize: 15,
//   },
//   sendButton: {
//     backgroundColor: '#6C63FF',
//     borderRadius: 24,
//     padding: 12,
//     marginRight: 8,
//   },
//   micButton: {
//     backgroundColor: '#6C63FF',
//     borderRadius: 24,
//     padding: 12,
//   },
//   disabledButton: {
//     backgroundColor: '#ccc',
//   },
//   listeningContainer: {
//     position: 'absolute',
//     bottom: 120,
//     left: 20,
//     right: 20,
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     padding: 16,
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   listeningText: {
//     marginTop: 8,
//     fontSize: 16,
//     color: '#6C63FF',
//     fontWeight: '500',
//   },
//   controls: {
//     flexDirection: 'row',
//     marginTop: 12,
//   },
//   controlButton: {
//     backgroundColor: '#6C63FF',
//     borderRadius: 24,
//     padding: 12,
//     marginHorizontal: 8,
//   },
//   loadingContainer: {
//     alignItems: 'center',
//     padding: 8,
//   },
//   loadingText: {
//     color: '#6C63FF',
//     fontSize: 14,
//   },
// });

// export default ChatScreen;


// some animatiions with changes in above
// ChatScreen.tsx
// ChatScreen.tsx
// ChatScreen.tsx
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
  const [messages, setMessages] = useState<{ text: string; type: 'user' | 'bot' }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [context, setContext] = useState<LlamaContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  const modelPath = 'file:///storage/emulated/0/Android/data/com.chat/files/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
  const modelUrl = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';

  useEffect(() => {
    const setupModel = async () => {
      try {
        const localPath = modelPath.replace('file://', '');
        const fileExists = await RNFS.exists(localPath);
        if (!fileExists) {
          setMessages((prev) => [...prev, { text: '⬇️ Downloading model...', type: 'bot' }]);

          await RNFS.downloadFile({
            fromUrl: modelUrl,
            toFile: localPath,
            progress: (res) => {
              const percentage = Math.round((res.bytesWritten / res.contentLength) * 100);
              setDownloadProgress(percentage);
            },
            progressDivider: 1,
          }).promise;

          setMessages((prev) => [...prev, { text: '✅ Model downloaded!', type: 'bot' }]);
        }

        const llamaContext = await initLlama({
          model: modelPath,
          n_ctx: 512,
          n_gpu_layers: 0,
          n_threads: 4,
        });
        setContext(llamaContext);
        setMessages((prev) => [...prev, { text: '🤖 Model loaded. Ready to chat!', type: 'bot' }]);
        setDownloadProgress(null);
      } catch (err) {
        console.error('Model setup error:', err);
        setMessages((prev) => [
          ...prev,
          { text: `❌ Error loading model: ${(err as Error).message}`, type: 'bot' },
        ]);
      }
    };
    setupModel();
  }, []);

  const handleSend = async () => {
    if (inputText.trim() === '' || !context) return;

    const userMessage = { text: inputText, type: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const taskResult = await routeTask(inputText, context);
      const botMessage = { text: taskResult, type: 'bot' };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Task routing error:', err);
      setMessages((prev) => [
        ...prev,
        { text: `❌ Error: ${(err as Error).message}`, type: 'bot' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const startListening = () => {
    setIsListening(true);
  };

  const stopListening = () => {
    setIsListening(false);
    setInputText('Transcribed text');
  };

  const cancelListening = () => {
    setIsListening(false);
  };

  const renderMessage = ({ item }: { item: { text: string; type: 'user' | 'bot' } }) => (
    <View style={item.type === 'user' ? styles.userMessage : styles.botMessage}>
      <Text style={[styles.messageText, item.type === 'bot' && styles.botMessageText]}>
        {item.text}
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
