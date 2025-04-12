import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Intro from './screens/intro';
import ChatScreen from './screens/ChatScreen';

export type RootStackParamList = {
  Intro: undefined | { params?: any }; // Union type to allow no params
  Chat: undefined | { params?: any };  // Union type to allow no params
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Intro">
        <Stack.Screen name="Intro" component={Intro} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}