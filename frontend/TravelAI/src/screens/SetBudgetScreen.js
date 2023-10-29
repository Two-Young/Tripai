import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import React from 'react';
import colors from '../theme/colors';
import BudgetWithCurrencyItem from '../component/molecules/BudgetWithCurrencyItem';
import {STYLES} from '../styles/Stylesheets';
import {useNavigation, useRoute} from '@react-navigation/native';
import Modal from 'react-native-modal';
import {Icon} from '@rneui/themed';

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

const BudgetModal = ({isVisible, setModalVisible, item, deleteBudget}) => {
  // states
  const [value, setValue] = React.useState('');

  // functions
  // TODO:: 동작 만들어야 함
  const onPressCancel = () => {
    setModalVisible(false);
  };

  const onPressSave = () => {
    setModalVisible(false);
  };

  const onPressDelete = () => {
    Alert.alert('Delete', 'Are you sure to delete this budget?', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Delete',
        onPress: async () => {
          await deleteBudget();
        },
      },
    ]);
  };

  // effects
  React.useEffect(() => {
    setValue(item?.budget.toString());
  }, [item]);

  return (
    <Modal isVisible={isVisible} onBackdropPress={Keyboard.dismiss}>
      <Pressable onPress={Keyboard.dismiss} style={styles.editModal}>
        <View style={STYLES.FLEX(1)}>
          <Text>
            Set your budget for <Text style={{fontWeight: 'bold'}}>{item?.currency}</Text>
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
          <TouchableOpacity style={styles.textButton} onPress={onPressDelete}>
            <Text style={styles.delete}>Delete</Text>
          </TouchableOpacity>
          <View style={STYLES.FLEX_ROW}>
            <TouchableOpacity
              style={[styles.textButton, STYLES.MARGIN_RIGHT(5)]}
              onPress={onPressCancel}>
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.textButton} onPress={onPressSave}>
              <Text style={styles.save}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const SetBudgetScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();

  // states
  const [budgets, setBudgets] = React.useState(defaultBudget);
  const [isModalVisible, setModalVisible] = React.useState(false);
  const [currency, setCurreny] = React.useState(null);
  const [refreshing, setRefreshing] = React.useState(false);

  // functions
  const handleAddBudget = () => {
    navigation.navigate('AddBudget');
  };

  const onPressItem = item => {
    setModalVisible(true);
    setCurreny(item);
  };

  // TODO:: 실제 서버와 연동
  const fetchBudgets = async () => {};

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBudgets();
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const deleteBudget = async () => {};

  // effects
  // TODO:: 실제 데이터로 교체
  React.useEffect(() => {
    fetchBudgets();
  }, []);

  React.useEffect(() => {
    if (route.params?.refresh) {
      fetchBudgets().finally(() => {
        navigation.setParams({refresh: false});
      });
    }
  }, [route.params?.refresh]);

  return (
    <View style={styles.container}>
      <FlatList
        style={STYLES.MARGIN_TOP(20)}
        data={budgets}
        keyExtractor={item => item.id.toString()}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({item}) => (
          <TouchableOpacity onPress={() => onPressItem(item)}>
            <BudgetWithCurrencyItem item={item} />
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={<View style={STYLES.PADDING_VERTICAL(10)} />}
        ListFooterComponent={
          <TouchableOpacity onPress={handleAddBudget} style={styles.fab}>
            <Icon name="plus" type="material-community" size={28} color={colors.white} />
          </TouchableOpacity>
        }
      />
      <BudgetModal
        isVisible={isModalVisible}
        setModalVisible={setModalVisible}
        item={currency}
        deleteBudget={deleteBudget}
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
    alignItems: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 10,
    margin: 10,
    padding: 5,
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
  delete: {
    color: colors.red,
  },
  buttonWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
