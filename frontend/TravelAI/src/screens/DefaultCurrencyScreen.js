import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  Image,
} from 'react-native';
import React from 'react';
import defaultStyle from '../styles/styles';
import {SafeAreaView} from 'react-native-safe-area-context';
import colors from '../theme/colors';
import {useNavigation} from '@react-navigation/native';
import {useRecoilValue} from 'recoil';
import currenciesAtom from '../recoil/currencies/currencies';
import {Checkbox, Divider, IconButton, List, Searchbar} from 'react-native-paper';
import countriesAtom from '../recoil/countries/countries';
import {Header} from '@rneui/themed';

const DefaultCurrencyScreen = () => {
  // hooks
  const navigation = useNavigation();
  const currencies = useRecoilValue(currenciesAtom);
  const countries = useRecoilValue(countriesAtom);

  // states
  const [defaultCurrency, setDefaultCurrency] = React.useState('USD');
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView edges={['bottom']} style={defaultStyle.container}>
        <Header
          backgroundColor={colors.primary}
          barStyle="light-content"
          leftComponent={
            <IconButton icon="arrow-left" iconColor={colors.white} onPress={navigation.goBack} />
          }
          centerComponent={{text: 'Choose the countries', style: defaultStyle.heading}}
        />
        <View style={styles.container}>
          <View style={styles.searchbarWrapper}>
            <Searchbar
              placeholder="Search the country"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <FlatList
            data={currencies}
            renderItem={item => (
              <CurrencyListItem
                item={{
                  ...item.item,
                  country: countries.find(i => i.country_code === item.item.country_code),
                }}
                checked={defaultCurrency === item.item.currency_code}
                onChecked={() => {
                  if (defaultCurrency === item.item.currency_code) {
                    setDefaultCurrency('');
                  } else {
                    setDefaultCurrency(item.item.currency_code);
                  }
                }}
              />
            )}
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const CurrencyListItem = ({item, checked, onChecked}) => {
  const rightComponent = () => <Checkbox checked={checked} onPress={onChecked} />;

  const leftComponent = () => <MemoizedFlags item={item.country} />;

  return (
    <React.Fragment>
      <List.Item
        style={styles.currencyListItem}
        titleStyle={styles.currencyListTitle}
        title={item.currency_name}
        description={item.currency_code}
        left={leftComponent}
        right={rightComponent}
      />
      <Divider />
    </React.Fragment>
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
