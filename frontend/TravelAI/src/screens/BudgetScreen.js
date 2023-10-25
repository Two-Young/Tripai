import {StyleSheet} from 'react-native';
import React from 'react';
import colors from '../theme/colors';
import CustomHeader from '../component/molecules/CustomHeader';
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
      <CustomHeader title={'BUDGET'} useBack={false} />
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
