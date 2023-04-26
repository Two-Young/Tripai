import React from 'react';
import {View, Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SignInScreen from '../screens/SignInScreen';

const authStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <authStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <authStack.Screen name="SignIn" component={SignInScreen} />
    </authStack.Navigator>
  );
}
export default AuthNavigator;
