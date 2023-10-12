import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Pressable,
  TextInput,
} from 'react-native';
import React from 'react';
import colors from '../theme/colors';
import {FAB} from 'react-native-paper';
import BudgetWithCurrencyItem from '../component/molecules/BudgetWithCurrencyItem';
import {STYLES} from '../styles/Stylesheets';
import {useNavigation} from '@react-navigation/native';
import Modal from 'react-native-modal';

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
  const [isModalVisible, setModalVisible] = React.useState(false);
  const [value, setValue] = React.useState('');

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
          <TouchableOpacity onPress={() => setModalVisible(true)}>
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
      <Modal isVisible={isModalVisible} onBackdropPress={Keyboard.dismiss}>
        <Pressable onPress={Keyboard.dismiss} style={styles.editModal}>
          <View style={STYLES.FLEX(1)}>
            <Text>
              Set your budget for <Text style={{fontWeight: 'bold'}}>KRW</Text>
            </Text>
            <TextInput
              style={
                (STYLES.MARGIN_TOP(10),
                {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.grey,
                  paddingVertical: 5,
                })
              }
              value={value}
              onChangeText={text => setValue(text)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.buttonWrap}>
            <TouchableOpacity
              style={[styles.textButton, STYLES.MARGIN_RIGHT(5)]}
              onPress={() => setModalVisible(false)}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.textButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.save}>Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
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
  editModal: {
    backgroundColor: colors.white,
    height: 200,
    borderRadius: 10,
    padding: 20,
  },
  textButton: {
    padding: 5,
  },
  save: {
    color: colors.primary,
  },
  buttonWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
