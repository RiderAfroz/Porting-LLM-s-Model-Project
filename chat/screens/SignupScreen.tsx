// screens/SignupScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { API } from '../api';

const SignupScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

const handleSignup = async () => {
  try {
    const res = await fetch('http://192.18.34.152:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    // Alert.alert('Signup Success', data.message);
  } catch (err: any) {
    // Alert.alert('Signup Failed', err.message || 'Unknown error');
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Signup</Text>
      <TextInput placeholder="Name"  placeholderTextColor="#858585" style={styles.input} onChangeText={setName} value={name} />
      <TextInput placeholder="Email" placeholderTextColor="#858585" style={styles.input} onChangeText={setEmail} value={email} />
      <TextInput placeholder="Password" placeholderTextColor="#858585" secureTextEntry style={styles.input} onChangeText={setPassword} value={password} />
      <Button title="Signup" onPress={handleSignup} />
    </View>
  );
};

export default SignupScreen;

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

