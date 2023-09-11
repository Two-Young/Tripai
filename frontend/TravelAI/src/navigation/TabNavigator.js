import React from 'react';
import {Image, StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import BudgetScreen from '../screens/BudgetScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import ChatScreen from '../screens/ChatScreen';
import colors from '../theme/colors';
import homeIcon from '../assets/images/home.png';
import scheduleIcon from '../assets/images/schedule.png';
import chatIcon from '../assets/images/chat.png';
import budgetIcon from '../assets/images/bill.png';

const Tab = createBottomTabNavigator();

const HomeIcon = ({focused}) => {
  return (
    <Image
      source={homeIcon}
      style={{
        ...styles.homeIcon,
        tintColor: focused ? colors.primary : colors.grey,
      }}
    />
  );
};

const ScheduleIcon = ({focused}) => {
  return (
    <Image
      source={scheduleIcon}
      style={{
        ...styles.scheduleIcon,
        tintColor: focused ? colors.primary : colors.grey,
      }}
    />
  );
};

const ChatIcon = ({focused}) => {
  return (
    <Image
      source={chatIcon}
      style={{
        ...styles.chatIcon,
        tintColor: focused ? colors.primary : colors.grey,
      }}
    />
  );
};

const BudgetIcon = ({focused}) => {
  return (
    <Image
      source={budgetIcon}
      style={{
        ...styles.budgetIcon,
        tintColor: focused ? colors.primary : colors.grey,
      }}
    />
  );
};

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60,
        },
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

const styles = StyleSheet.create({
  homeIcon: {
    width: 26,
    height: 27,
    resizeMode: 'contain',
  },
  scheduleIcon: {
    width: 29,
    height: 26,
    resizeMode: 'contain',
  },
  chatIcon: {
    width: 29,
    height: 29,
    resizeMode: 'contain',
  },
  budgetIcon: {
    width: 27,
    height: 27,
    resizeMode: 'contain',
  },
});
