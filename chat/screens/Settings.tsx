import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Setting1 = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Models</Text>

    </View>
  );
};

export default Setting1;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B030F',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#fbd85d',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modelCard: {
    backgroundColor: '#1A1A2E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  modelName: {
    color: '#ffffff',
    fontSize: 18,
  },
});
