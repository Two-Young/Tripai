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
import {useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import Modal from 'react-native-modal';
import {Icon} from '@rneui/themed';
import sessionAtom from '../recoil/session/session';
import {useRecoilValue} from 'recoil';
import {
  deleteBudget,
  getBudget,
  getBudgetCurrent,
  getCurrenciesExchangeInfo,
  postBudget,
} from '../services/api';
import countriesAtom from '../recoil/countries/countries';
import userAtom from '../recoil/user/user';
import {showErrorToast} from '../utils/utils';

const BudgetModal = ({isVisible, setModalVisible, item, requestDeletingBudget}) => {
  const navigation = useNavigation();
  // states
  const [value, setValue] = React.useState('');

  // functions
  const onPressCancel = () => {
    setModalVisible(false);
  };

  const onPressSave = async () => {
    try {
      await postBudget({
        budget_id: item.budget_id,
        amount: Number(value.replace(/[^0-9]/g, '')),
      });
      navigation.setParams({refresh: true});
      setModalVisible(false);
    } catch (err) {
      showErrorToast(err);
    }
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
          setModalVisible(false);
          await requestDeletingBudget(item.budget_id);
        },
      },
    ]);
  };

  // effects
  React.useEffect(() => {
    setValue(item?.amount.toString());
  }, [item]);

  return (
    <Modal isVisible={isVisible} onBackdropPress={Keyboard.dismiss}>
      <Pressable onPress={Keyboard.dismiss} style={styles.editModal}>
        <View style={STYLES.FLEX(1)}>
          <Text>
            Set your budget for <Text style={{fontWeight: 'bold'}}>{item?.currency_code}</Text>
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
            onChangeText={setValue}
            onEndEditing={() => {
              if (Number(value.replace(/[^0-9]/g, '')) < 0) {
                setValue('');
              } else {
                setValue(Number(value.replace(/[^0-9]/g, '')).toLocaleString());
              }
            }}
            placeholder="0"
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

  const currentSession = useRecoilValue(sessionAtom);

  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  const countries = useRecoilValue(countriesAtom);
  const user = useRecoilValue(userAtom);

  const defaultCurrency = React.useMemo(() => {
    if (user?.user_info?.default_currency_code) {
      return user.user_info.default_currency_code;
    }
    return 'USD';
  }, [user]);

  // states
  const [budgets, setBudgets] = React.useState([]);
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
  const fetchBudgets = async () => {
    try {
      const res = await getBudget(currentSessionID);
      const res2 = await getBudgetCurrent(currentSessionID);
      const resultBudgets = res.map(item => {
        const current = res2.find(item2 => item2.currency_code === item.currency_code);
        return {
          ...item,
          ...current,
        };
      });
      let promiseArr = [];
      resultBudgets.forEach(item => {
        promiseArr.push(
          getCurrenciesExchangeInfo({
            from_currency_code: item.currency_code,
            to_currency_code: defaultCurrency,
          }),
        );
      });
      const res3 = await Promise.all(promiseArr);
      const resultBudgets2 = resultBudgets.map((item, index) => {
        return {
          ...item,
          exchange_rate: res3[index],
        };
      });
      setBudgets(resultBudgets2);
    } catch (err) {
      showErrorToast(err);
    }
  };

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

  const requestDeletingBudget = async budget_id => {
    try {
      await deleteBudget(budget_id);
      setBudgets(budgets.filter(item => item.budget_id !== budget_id));
    } catch (err) {
      showErrorToast(err);
    }
  };

  // effects
  React.useEffect(() => {
    if (currentSessionID) {
      fetchBudgets();
    }
  }, [currentSessionID]);

  React.useEffect(() => {
    if (route.params?.refresh) {
      fetchBudgets().finally(() => {
        navigation.setParams({refresh: false});
      });
    }
  }, [route.params?.refresh]);

  // 포커스 되면 새로고침
  useFocusEffect(
    React.useCallback(() => {
      fetchBudgets();
    }, []),
  );

  //
  return (
    <View style={styles.container}>
      <FlatList
        style={STYLES.MARGIN_TOP(20)}
        data={budgets}
        keyExtractor={item => item?.budget_id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({item}) => (
          <TouchableOpacity onPress={() => onPressItem(item)}>
            <BudgetWithCurrencyItem
              data={{
                ...item,
                defaultCurrency: defaultCurrency,
                countries: countries
                  .filter(
                    country =>
                      country.currencies
                        .map(currency => currency.code)
                        .indexOf(item.currency_code) > -1,
                  )
                  .sort(
                    // session에서 받은 국가 정보를 기준으로 정렬
                    (a, b) =>
                      currentSession.country_codes.indexOf(b.country_code) -
                      currentSession.country_codes.indexOf(a.country_code),
                  ),
              }}
            />
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
        requestDeletingBudget={requestDeletingBudget}
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
