import {StyleSheet, Text, View, FlatList, Pressable} from 'react-native';
import React from 'react';
import defaultStyle from '../styles/styles';
import colors from '../theme/colors';
import {FAB, List, Surface} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useRecoilValue} from 'recoil';
import {getReceipts, getSessionCurrencies} from '../services/api';
import sessionAtom from '../recoil/session/session';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import {CalendarProvider, WeekCalendar} from 'react-native-calendars';
import dayjs from 'dayjs';
import reactotron from 'reactotron-react-native';
import {STYLES} from '../styles/Stylesheets';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import CurrentBudgetScreen from './CurrentBudgetScreen';
import SettlementScreen from './SettlementScreen';
import SetBudgetScreen from './SetBudgetScreen';

const BudgetTab = createMaterialTopTabNavigator();

const BudgetTabNavigator = () => {
  return (
    <BudgetTab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: {backgroundColor: colors.white},
        tabBarLabelStyle: {fontWeight: 'bold', color: colors.white},
        tabBarStyle: {backgroundColor: colors.primary},
      }}>
      <BudgetTab.Screen name="Set Budget" component={SetBudgetScreen} />
      <BudgetTab.Screen name="Current" component={CurrentBudgetScreen} />
      <BudgetTab.Screen name="Settlement" component={SettlementScreen} />
    </BudgetTab.Navigator>
  );
};

const BudgetScreen = () => {
  return (
    <>
      <CustomHeader title={'BUDGET'} />
      <BudgetTabNavigator />
    </>
  );
};

export default BudgetScreen;

const styles = StyleSheet.create({
  fab: {
    backgroundColor: colors.primary,
  },
});
