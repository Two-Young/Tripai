import {StyleSheet, Text, View, Keyboard, Pressable, FlatList} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import {STYLES} from '../styles/Stylesheets';
import CustomHeader from '../component/molecules/CustomHeader';
import {Searchbar} from 'react-native-paper';
import {useRecoilValue} from 'recoil';
import currenciesAtom from '../recoil/currencies/currencies';
import countriesAtom from '../recoil/countries/countries';
import CurrencyListItem from '../component/molecules/CurrencyListItem';
import _ from 'lodash';
import colors from '../theme/colors';
import MainButton from '../component/atoms/MainButton';

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

  // states
  const [defaultCurrency, setDefaultCurrency] = React.useState(defaultCurrencyObject);
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <SafeArea>
      <Pressable style={[STYLES.FLEX(1)]} onPress={Keyboard.dismiss} accessible={false}>
        <SafeArea>
          <CustomHeader title="Add Budget" rightComponent={<View />} />
          <View style={styles.container}>
            <View style={styles.searchbarWrapper}>
              <Searchbar
                placeholder="Search the country"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
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
      </Pressable>
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
