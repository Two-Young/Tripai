import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import OnBoardFirstScreen from '../screens/OnBoardFirstScreen';
import OnBoardSecondScreen from '../screens/OnBoardSecondScreen';
import OnBoardThirdScreen from '../screens/OnBoardThirdScreeen';

const onBoardStack = createNativeStackNavigator();

function OnBoardNavigator(props) {
  return (
    <onBoardStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <onBoardStack.Screen name="OnBoardFirst" component={OnBoardFirstScreen} />
      <onBoardStack.Screen name="OnBoardSecond" component={OnBoardSecondScreen} />
      <onBoardStack.Screen name="OnBoardThird" component={OnBoardThirdScreen} />
    </onBoardStack.Navigator>
  );
}

export default OnBoardNavigator;
