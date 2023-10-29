import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import colors from '../../theme/colors';
import {SemiBold, Light} from './../../theme/fonts';
import {STYLES} from '../../styles/Stylesheets';
import reactotron from 'reactotron-react-native';

const formattedNumber = (locale, currency, number) => {
  return new Intl.NumberFormat(locale ?? 'en-US', {
    style: 'currency',
    currency: currency ?? 'IDR',
  }).format(number);
};

const BudgetWithCurrencyItem = ({item}) => {
  const {locale, currency_code, total, spent} = item;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{currency_code}</Text>
      <Text style={styles.subTitle}>{formattedNumber(locale, currency_code, total)}</Text>
      <View style={styles.progressbar}>
        <View
          style={{
            height: 10,
            backgroundColor: colors.primary,
            borderRadius: 10,
            width: `${(total <= spent ? 1 : spent / total) * 100}%`,
          }}
        />
      </View>
      <View style={[STYLES.FLEX_ROW, STYLES.SPACE_BETWEEN]}>
        <Text>
          <Text style={Light(14)}>Spent </Text>
          <Text>{formattedNumber(locale, currency_code, spent)}</Text>
        </Text>
        <Text>
          <Text style={Light(14)}>Remaining </Text>
          <Text>{formattedNumber(locale, currency_code, total - spent)}</Text>
        </Text>
      </View>
    </View>
  );
};

export default BudgetWithCurrencyItem;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.searchBar,
    padding: 20,
    borderRadius: 10,
  },
  title: {
    ...SemiBold(20),
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  progressbar: {
    height: 10,
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
  },
});
