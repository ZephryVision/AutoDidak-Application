import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// IMPORT HALAMAN (Pastikan semua dari folder Screen)
import LoginScreen from './Screen/LoginScreen';
import RegisterScreen from './Screen/RegisterScreen';
import HomeScreen from './Screen/HomeScreen'; 
import SkillTree from './Screen/SkillTree'; 
import AskPage from './Screen/AskPage'; // <--- PERBAIKAN DI SINI

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      {/* Ganti initialRouteName="Home" jika ingin bypass login sementara */}
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="SkillTree" component={SkillTree} />
        <Stack.Screen name="AskPage" component={AskPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}