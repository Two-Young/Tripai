import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import colors from '../../theme/colors';
import {STYLES} from '../../styles/Stylesheets';
import {FlatList, Image} from 'react-native';

const formattedNumber = (locale, currency, number) => {
  return new Intl.NumberFormat(locale ?? 'en-US', {
    style: 'currency',
    currency: currency ?? 'IDR',
  }).format(number);
};

const BudgetWithCurrencyItem = ({data}) => {
  const {locale, currency_code, total, spent, countries, defaultCurrency, exchange_rate} = data;

  return (
    <View style={styles.card}>
      <View style={STYLES.FLEX_ROW_ALIGN_CENTER}>
        <Text style={styles.title}>{currency_code}</Text>
        <FlatList
          horizontal
          style={STYLES.MARGIN_LEFT(10)}
          data={countries.slice(0, 3)}
          renderItem={({item}) => (
            <Image source={{uri: item.png}} style={{width: 30, height: 20}} />
          )}
          ItemSeparatorComponent={() => <View style={{width: 5}} />}
          ListFooterComponent={
            countries.length > 3 && (
              <View
                style={{
                  marginLeft: 5,
                  width: 30,
                  height: 20,
                  backgroundColor: '#0D6EFD',
                  borderRadius: 5,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text style={{color: colors.white, fontWeight: 'bold'}}>
                  +{countries.length - 3}
                </Text>
              </View>
            )
          }
        />
      </View>
      <Text style={styles.subTitle}>{formattedNumber(locale, currency_code, total)}</Text>
      <View style={styles.progressbar}>
        <View
          style={{
            height: 10,
            backgroundColor: '#0D6EFD',
            borderRadius: 10,
            width: `${(total <= spent ? 1 : spent / total) * 100}%`,
          }}
        />
      </View>
      <View style={[STYLES.FLEX_ROW, STYLES.SPACE_BETWEEN]}>
        <Text style={styles.spent}>
          <Text>{formattedNumber(locale, currency_code, spent)}</Text>
        </Text>
        <Text style={styles.remaining}>
          <Text>{formattedNumber(locale, currency_code, total - spent)}</Text>
        </Text>
      </View>
      {defaultCurrency !== currency_code && (
        <View style={[STYLES.FLEX_ROW, STYLES.SPACE_BETWEEN]}>
          <Text style={[styles.spent, styles.exchange]}>
            <Text>{formattedNumber(locale, defaultCurrency, spent * exchange_rate)}</Text>
          </Text>
          <Text style={[styles.remaining, styles.exchange]}>
            <Text>{formattedNumber(locale, defaultCurrency, (total - spent) * exchange_rate)}</Text>
          </Text>
        </View>
      )}
    </View>
  );
};

export default BudgetWithCurrencyItem;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E222B',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subTitle: {
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
  progressbar: {
    height: 10,
    backgroundColor: '#0D0D0D',
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 10,
  },
  spent: {
    color: colors.white,
    fontSize: 14,
  },
  remaining: {
    color: colors.white,
    fontSize: 14,
  },
  exchange: {
    fontSize: 10,
  },
});
