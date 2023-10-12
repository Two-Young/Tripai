import React from 'react';
import {StyleSheet, View, Image} from 'react-native';
import {List} from 'react-native-paper';
import colors from '../../theme/colors';

const {default: Checkbox} = require('../atoms/Checkbox');

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

const styles = StyleSheet.create({
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

export default CurrencyListItem;
