import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';

const authStack = createStackNavigator();

function AuthNavigator() {
  return (
    <authStack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
      }}>
      <authStack.Screen name="SignIn" component={SignInScreen} />
      <authStack.Screen name="SignUp" component={SignUpScreen} />
    </authStack.Navigator>
  );
}
export default AuthNavigator;
