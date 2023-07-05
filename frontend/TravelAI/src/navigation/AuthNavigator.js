import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import SignInScreen from '../screens/SignInScreen';

const authStack = createStackNavigator();

function AuthNavigator() {
  return (
    <authStack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
      }}>
      <authStack.Screen name="SignIn" component={SignInScreen} />
    </authStack.Navigator>
  );
}
export default AuthNavigator;
