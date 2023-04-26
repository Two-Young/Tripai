import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {View, Text} from 'react-native';
import OnBoardNavigator from './OnBoardNavigator';
import AuthNavigator from './AuthNavigator';

const RootStack = createNativeStackNavigator();

function RootNavigator(props) {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <RootStack.Screen name="OnBoard" component={OnBoardNavigator} />
      <RootStack.Screen name="Auth" component={AuthNavigator} />
    </RootStack.Navigator>
  );
}

export default RootNavigator;
