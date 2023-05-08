import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import OnBoardFirstScreen from '../screens/OnBoardFirstScreen';
import OnBoardSecondScreen from '../screens/OnBoardSecondScreen';
import OnBoardThirdScreen from '../screens/OnBoardThirdScreeen';

const onBoardStack = createStackNavigator();

function OnBoardNavigator(props) {
  return (
    <onBoardStack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
      }}>
      <onBoardStack.Screen name="OnBoardFirst" component={OnBoardFirstScreen} />
      <onBoardStack.Screen name="OnBoardSecond" component={OnBoardSecondScreen} />
      <onBoardStack.Screen name="OnBoardThird" component={OnBoardThirdScreen} />
    </onBoardStack.Navigator>
  );
}

export default OnBoardNavigator;
