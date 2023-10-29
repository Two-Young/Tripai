import {StyleSheet, View, Keyboard, Pressable, FlatList} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import {STYLES} from '../styles/Stylesheets';
import CustomHeader, {CUSTOM_HEADER_THEME} from '../component/molecules/CustomHeader';
import {Searchbar} from 'react-native-paper';
import {useRecoilValue} from 'recoil';
import currenciesAtom from '../recoil/currencies/currencies';
import countriesAtom from '../recoil/countries/countries';
import CurrencyListItem from '../component/molecules/CurrencyListItem';
import _ from 'lodash';
import colors from '../theme/colors';
import MainButton from '../component/atoms/MainButton';
import {useNavigation, CommonActions, useNavigationState} from '@react-navigation/native';
import DismissKeyboard from '../component/molecules/DismissKeyboard';
import {getBudget, getSessionCurrencies, putBudget} from '../services/api';
import sessionAtom from '../recoil/session/session';
import reactotron from 'reactotron-react-native';

const defaultCurrencyObject = {
  currency_code: '',
  currency_name: '',
  country_code: '',
  country_symbol: '',
};

const AddBudgetScreen = () => {
  // hooks
  const currencies = useRecoilValue(currenciesAtom);
  const countries = useRecoilValue(countriesAtom);
  const currentSession = useRecoilValue(sessionAtom);

  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);

  // states
  const [fetching, setFetching] = React.useState(true);
  const [defaultCurrency, setDefaultCurrency] = React.useState(defaultCurrencyObject);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sessionCurrencies, setSessionCurrencies] = React.useState([]); // [currency_code, ...
  const [budgets, setBudgets] = React.useState([]);

  // functions
  const fetchDatas = async () => {
    await fetchSessionCurrencies();
    await fetchBudgets();
    setFetching(false);
  };

  const fetchSessionCurrencies = async () => {
    try {
      const res = await getSessionCurrencies(currentSessionID);
      setSessionCurrencies(
        _.keys(res).map(item => ({
          ...res[item][0],
          country_code: item,
        })),
      );
    } catch (err) {
      console.log(err);
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await getBudget(currentSessionID);
      setBudgets(res);
    } catch (err) {
      console.error(err);
    }
  };

  const onPressAdd = async () => {
    try {
      await putBudget({
        currency_code: defaultCurrency.currency_code,
        amount: 0,
        session_id: currentSessionID,
      });
      const target = navigationState.routes[navigationState.routes.length - 2];
      navigation.dispatch({
        ...CommonActions.setParams({refresh: true}),
        source: target.key,
      });
      navigation.goBack();
    } catch (err) {
      console.log(err);
    }
  };

  // effects
  React.useEffect(() => {
    if (currentSessionID) {
      fetchDatas();
    }
  }, [currentSessionID]);

  const filteredCurrencies = React.useMemo(() => {
    return _.uniqBy([...sessionCurrencies, ...currencies], 'currency_code')
      .filter(item => !budgets.find(budget => budget.currency_code === item.currency_code))
      .filter(
        item =>
          item.currency_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.currency_name.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [sessionCurrencies, searchQuery, currencies, budgets]);

  return (
    <SafeArea top={{style: {backgroundColor: colors.white}, barStyle: 'dark-content'}}>
      <DismissKeyboard>
        <CustomHeader
          title="Add Budget"
          theme={CUSTOM_HEADER_THEME.WHITE}
          rightComponent={<React.Fragment />}
        />
      </DismissKeyboard>
      <View style={styles.container}>
        <DismissKeyboard>
          <View style={styles.searchbarWrapper}>
            <Searchbar
              placeholder="Search the country"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </DismissKeyboard>
        <FlatList
          data={fetching ? [] : filteredCurrencies}
          renderItem={item => (
            <CurrencyListItem
              item={{
                ...item.item,
                country: countries.find(i => i.country_code === item.item.country_code),
              }}
              checked={_.isEqual(defaultCurrency, item.item)}
              onChecked={() => {
                if (_.isEqual(defaultCurrency, item.item)) {
                  setDefaultCurrency(defaultCurrencyObject);
                } else {
                  setDefaultCurrency(item.item);
                }
              }}
            />
          )}
        />
      </View>
      <View style={STYLES.PADDING(16)}>
        <MainButton
          text="Add"
          disabled={_.isEqual(defaultCurrency, defaultCurrencyObject)}
          onPress={onPressAdd}
        />
      </View>
    </SafeArea>
  );
};

export default AddBudgetScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  searchbarWrapper: {
    marginTop: 10,
    paddingHorizontal: 31,
    marginBottom: 36,
  },
});
