import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Swiper from 'react-native-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App'; // Adjusted path to match project root

type IntroScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Intro'>;

export default function Intro() {
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  const navigation = useNavigation<IntroScreenNavigationProp>();

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched === null) {
          await AsyncStorage.setItem('hasLaunched', 'true');
          setShowIntro(true);
        } else {
          setShowIntro(false);
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
        setShowIntro(false); // Fallback to skip intro on error
      }
    };
    checkFirstLaunch();
  }, []);

  if (showIntro === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fbd85d" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!showIntro) {
    navigation.replace('Chat'); // Changed to 'Chat' to match App.tsx
    return null;
  }

  return (
    <Swiper loop={false} showsPagination={true} dotColor="#999" activeDotColor="#fbd85d">
      {/* Screen 1 */}
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Image source={require('./sun2.png')} style={styles.image} resizeMode="contain" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Meet <Text style={styles.highlight}>Sundae</Text>!
          </Text>
          <Text style={styles.subtitle}>Your own AI assistant</Text>
          <Text style={styles.description}>
            Ask your questions and receive articles using{'\n'}
            artificial intelligence assistant
          </Text>
        </View>
      </View>

      {/* Screen 2 */}
      <View style={styles.container}>
        <Image source={require('./tasks.png')} style={styles.image} resizeMode="contain" /> {/* Added image for consistency */}
        <Text style={styles.title}>Welcome to Our App!</Text>
        <Text style={styles.description}>We're glad to have you on board.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            navigation.replace('Chat'); // Changed to 'Chat' to match App.tsx
          }}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </Swiper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B030F',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 350,
    marginTop: 70,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    color: '#fff',
    fontWeight: '600',
  },
  highlight: {
    color: '#fbd85d',
  },
  subtitle: {
    fontSize: 20,
    color: '#fff',
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#a06ef4',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B030F',
  },
  loadingText: {
    color: '#fbd85d',
    marginTop: 10,
  },
});