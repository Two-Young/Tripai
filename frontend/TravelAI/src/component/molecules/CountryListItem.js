import React from 'react';
import {StyleSheet, View, Image} from 'react-native';
import colors from '../../theme/colors';
import {List} from 'react-native-paper';
import Checkbox from '../atoms/Checkbox';
import reactotron from 'reactotron-react-native';

const CountryListItem = ({item, selected, setSelected}) => {
  const checked = React.useMemo(() => {
    return selected.includes(item.country_code);
  }, [selected, item.country_code]);

  reactotron.log(item);

  const leftComponent = () => <MemoizedFlags item={item} />;

  const rightComponent = () => (
    <Checkbox
      checked={checked}
      onPressCheckbox={() => {
        if (checked) {
          setSelected(prevState => prevState.filter(code => code !== item.country_code));
        } else {
          setSelected(prevState => [...prevState, item.country_code]);
        }
      }}
    />
  );

  return (
    <React.Fragment>
      <List.Item
        style={styles.countryListItem}
        titleStyle={styles.countryListTitle}
        title={item.common_name}
        left={leftComponent}
        right={rightComponent}
      />
      {/* <Divider /> */}
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

export default CountryListItem;

const styles = StyleSheet.create({
  countryListItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryListTitle: {
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
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 5,
  },
});
