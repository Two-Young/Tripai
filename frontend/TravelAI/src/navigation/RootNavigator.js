import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import OnBoardNavigator from './OnBoardNavigator';
import AuthNavigator from './AuthNavigator';
import TabNavigator from './TabNavigator';
import MainScreen from '../screens/MainScreen';

const Stack = createStackNavigator();

function RootNavigator(props) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
      }}>
      {/* OnBoard */}
      {
        // <Stack.Screen name="OnBoard" component={OnBoardNavigator} />
      }
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="Tab" component={TabNavigator} />
      <Stack.Screen name="MainScreen" component={MainScreen} />
      {/* Tab */}
    </Stack.Navigator>
  );
}

export default RootNavigator;
