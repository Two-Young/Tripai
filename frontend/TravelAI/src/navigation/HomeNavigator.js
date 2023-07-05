import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import {Text, View} from 'react-native';

const HomeStack = createStackNavigator();

const HomeNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{headerShowwn: false}}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
    </HomeStack.Navigator>
  );
};

function HomeScreen() {
  return (
    <View>
      <Text></Text>
    </View>
  );
}

export default HomeNavigator;
