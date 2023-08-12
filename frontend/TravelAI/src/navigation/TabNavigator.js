import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import ChatScreen from '../screens/ChatScreen';
import colors from '../theme/colors';
import {Icon} from '@rneui/themed';

const Tab = createBottomTabNavigator();

const HomeIcon = ({focused}) => {
  return (
    <Icon
      name="home"
      type="font-awesome-5"
      size={24}
      color={focused ? colors.primary : colors.grey}
    />
  );
};

const ScheduleIcon = ({focused}) => {
  return (
    <Icon
      name="calendar"
      type="font-awesome-5"
      size={24}
      color={focused ? colors.primary : colors.grey}
    />
  );
};

const ChatIcon = ({focused}) => {
  return (
    <Icon name="chatbox" type="ionicon" size={24} color={focused ? colors.primary : colors.grey} />
  );
};

const BudgetIcon = ({focused}) => {
  return (
    <Icon
      name="money-check"
      type="font-awesome-5"
      size={20}
      color={focused ? colors.primary : colors.grey}
    />
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: HomeIcon,
        }}
      />
      <Tab.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{
          tabBarIcon: ScheduleIcon,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ChatIcon,
        }}
      />
      <Tab.Screen
        name="Budget"
        component={BudgetScreen}
        options={{
          tabBarIcon: BudgetIcon,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
