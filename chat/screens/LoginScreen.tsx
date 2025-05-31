// screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { API } from '../api';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, user } = res.data;
    //   Alert.alert('Login Success', `Welcome ${user.name}`);
      // Save token to storage (e.g., AsyncStorage)
    } catch (err: any) {
    //   Alert.alert('Login Failed', err.response?.data?.error || 'Unknown error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Email" placeholderTextColor="#858585" style={styles.input} onChangeText={setEmail} value={email} />
      <TextInput placeholder="Password" placeholderTextColor="#858585" secureTextEntry style={styles.input} onChangeText={setPassword} value={password} />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#121212', // Dark background
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'center',
    color: '#ffffff', // Light text
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#888', // Light gray underline
    marginBottom: 20,
    padding: 10,
    color: '#ffffff', // Light text inside input
  },
});

