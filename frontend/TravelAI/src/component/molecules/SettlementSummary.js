import React, {useMemo, useCallback} from 'react';
import {View, StyleSheet, Text} from 'react-native';
import {STYLES} from '../../styles/Stylesheets';
import {Regular, Medium} from '../../theme/fonts';
import colors from '../../theme/colors';

const CATEGORY_LIST = ['activity', 'meal', 'lodgment', 'transport', 'shopping', 'etc'];
const COLOR_LIST = ['#FF8181', '#FFAB48', '#6FED42', '#79D7FF', '#CB89FF', '#B5B5B5'];

const SettlementSummary = ({title, settlements}) => {
  const data = useMemo(() => {
    if (!settlements) {
      return [];
    }
    return settlements
      .filter(item => CATEGORY_LIST.includes(item.category))
      .map((item, index) => ({...item, color: COLOR_LIST[index]}))
      .sort((a, b) => b.amount - a.amount);
  }, [settlements]);

  const total = useMemo(() => {
    console.log(data);
    if (!data) {
      return 1;
    }
    return data.reduce((acc, cur) => acc + cur.amount, 0);
  }, [settlements]);

  const CategoryRow = useCallback(
    ({item, index}) => {
      return (
        <View
          style={[STYLES.FLEX_ROW_ALIGN_CENTER, STYLES.SPACE_BETWEEN, styles.propertyRow]}
          key={`r_${index}`}>
          <View style={[STYLES.FLEX_ROW_ALIGN_CENTER]}>
            <View style={[styles.propertyDot, {backgroundColor: item.color}]} />
            <Text style={[styles.propertyCategoryText, {color: item.color}]}>
              {item.category} ({((item.amount / total) * 100).toFixed(2)}%)
            </Text>
          </View>
          <Text style={[styles.propertyAmountText, {color: item.color}]}>
            {item.amount.toFixed(2)}
          </Text>
        </View>
      );
    },
    [total],
  );

  return (
    <View>
      {Boolean(title) && <Text style={styles.titleText}>{title}</Text>}
      <View style={[styles.chart]}>
        {data.map((item, index) => {
          return (
            <View
              key={`v_${index}`}
              style={[STYLES.FLEX(item.amount), {backgroundColor: item.color}]}
            />
          );
        })}
      </View>

      <View style={[styles.properties]}>
        {data.map((item, index) => (
          <CategoryRow item={item} index={index} key={`r_${index}`} />
        ))}
        <CategoryRow
          item={{
            category: 'Total',
            amount: total,
            color: 'black',
          }}
          index={settlements?.length}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  titleText: {
    marginBottom: 10,
    ...Medium(16),
    color: colors.gray,
  },
  chart: {
    flexDirection: 'row',
    width: '100%',
    height: 20,
    borderRadius: 4,
    backgroundColor: 'gray',
    overflow: 'hidden',
  },
  properties: {
    width: '100%',
    marginTop: 10,
  },
  propertyRow: {
    width: '100%',
    height: 20,
  },
  propertyDot: {
    width: 8,
    height: 8,
    borderRadius: 8,
  },
  propertyCategoryText: {
    marginLeft: 10,
    ...Regular(12),
  },
  propertyAmountText: {
    ...Regular(12),
  },
});

export default SettlementSummary;
