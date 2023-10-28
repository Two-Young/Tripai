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
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);

  // states
  const [defaultCurrency, setDefaultCurrency] = React.useState(defaultCurrencyObject);
  const [searchQuery, setSearchQuery] = React.useState('');

  // TODO:: 추가했을 때 실제 서버와 동작

  // functions
  const onPressAdd = async () => {
    const target = navigationState.routes[navigationState.routes.length - 2];
    navigation.dispatch({
      ...CommonActions.setParams({refresh: true}),
      source: target.key,
    });
    navigation.goBack();
  };

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
          data={currencies.filter(
            item =>
              item.currency_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.currency_code.toLowerCase().includes(searchQuery.toLowerCase()),
          )}
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
        <MainButton text="Add" disabled={_.isEqual(defaultCurrency, defaultCurrencyObject)} />
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
