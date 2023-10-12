import {StyleSheet, Text, View, FlatList, TouchableOpacity} from 'react-native';
import React from 'react';
import colors from '../theme/colors';
import {FAB} from 'react-native-paper';
import BudgetWithCurrencyItem from '../component/molecules/BudgetWithCurrencyItem';
import {STYLES} from '../styles/Stylesheets';
import {useNavigation} from '@react-navigation/native';

const defaultBudget = [
  {
    id: 1,
    currency: 'KRW',
    locale: 'ko-KR',
    budget: 1000000,
    spent: 500000,
  },
  {
    id: 2,
    currency: 'JPY',
    locale: 'ja-JP',
    budget: 1000000,
    spent: 900000,
  },
];

const SetBudgetScreen = () => {
  // hooks
  const navigation = useNavigation();

  // states
  const [budgets, setBudgets] = React.useState(defaultBudget);

  // functions

  const handleAddBudget = () => {
    navigation.navigate('AddBudget');
  };

  return (
    <View style={styles.container}>
      <FlatList
        style={STYLES.MARGIN_TOP(20)}
        data={budgets}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <TouchableOpacity onPress={() => navigation.navigate('EditBudget', {budget: item})}>
            <BudgetWithCurrencyItem item={item} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={<View style={STYLES.PADDING_VERTICAL(10)} />}
        ListFooterComponent={
          <FAB
            style={[styles.fab, STYLES.MARGIN(20)]}
            icon="plus"
            color="#fff"
            onPress={handleAddBudget}
          />
        }
      />
    </View>
  );
};

export default SetBudgetScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  fab: {
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
});
