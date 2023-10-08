import {StyleSheet, View, Keyboard, FlatList, Image, Pressable} from 'react-native';
import React from 'react';
import colors from '../theme/colors';
import {useRecoilValue} from 'recoil';
import currenciesAtom from '../recoil/currencies/currencies';
import {Divider, List, Searchbar} from 'react-native-paper';
import Checkbox from '../component/atoms/Checkbox';
import countriesAtom from '../recoil/countries/countries';
import {STYLES} from '../styles/Stylesheets';
import CustomHeader from '../component/molecules/CustomHeader';
import SafeArea from '../component/molecules/SafeArea';
import reactotron from 'reactotron-react-native';
import _ from 'lodash';

const defaultCurrencyObject = {
  currency_code: '',
  currency_name: '',
  country_code: '',
  country_symbol: '',
};

const DefaultCurrencyScreen = () => {
  // hooks
  const currencies = useRecoilValue(currenciesAtom);
  const countries = useRecoilValue(countriesAtom);

  // states
  const [defaultCurrency, setDefaultCurrency] = React.useState(defaultCurrencyObject);
  const [searchQuery, setSearchQuery] = React.useState('');

  reactotron.log(defaultCurrency);

  return (
    <Pressable style={[STYLES.FLEX(1)]} onPress={Keyboard.dismiss} accessible={false}>
      <SafeArea>
        <CustomHeader title="Default Currency" rightComponent={<View />} />
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
      </SafeArea>
    </Pressable>
  );
};

const CurrencyListItem = ({item, checked, onChecked}) => {
  const rightComponent = () => <Checkbox checked={checked} onPressCheckbox={onChecked} />;

  const leftComponent = () => <MemoizedFlags item={item.country} />;

  return (
    <List.Item
      style={styles.currencyListItem}
      titleStyle={styles.currencyListTitle}
      title={item.currency_name}
      description={item.currency_code}
      left={leftComponent}
      right={rightComponent}
    />
  );
};

const MemoizedFlags = React.memo(function MemoizedFlags({item}) {
  return (
    <View style={styles.flagWrapper}>
      <Image style={styles.flag} source={{uri: item?.png}} />
    </View>
  );
});

export default DefaultCurrencyScreen;

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
  currencyListItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyListTitle: {
    fontSize: 15,
    color: colors.black,
  },
  flagWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    width: 45,
    height: 30,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 5,
  },
});
