import {ImageBackground, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Card, IconButton} from 'react-native-paper';
import {STYLES} from '../../styles/Stylesheets';
import colors from '../../theme/colors';

const RightContent = props => <IconButton icon="chevron-right" iconColor="#000" />;

const PlaceCard = ({item, onPress}) => {
  const {start_at} = item;

  const time = React.useMemo(() => {
    const date = new Date(start_at);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  }, [start_at]);

  const subTitle = React.useMemo(() => {
    const {address, memo} = item;
    if (address?.length > 0 && memo?.length > 0) {
      return `${address} | ${memo}`;
    } else if (address?.length > 0) {
      return address;
    } else if (memo?.length > 0) {
      return memo;
    } else {
      return '';
    }
  }, [item]);

  return (
    <View style={[styles.item, STYLES.PADDING_HORIZONTAL(20)]}>
      <View>
        <View style={styles.circle} />
        <Text style={styles.itemTimeText}>{time}</Text>
      </View>
      <Card style={[STYLES.FLEX(1)]} right={RightContent} onPress={() => onPress(item)}>
        <Card.Title
          title={item?.name}
          subtitle={subTitle}
          subtitleStyle={{}}
          right={RightContent}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingLeft: 32,
    // marginLeft: 22,
    borderLeftWidth: 1,
    borderLeftColor: '#808080',
    paddingBottom: 10,
  },
  circle: {
    position: 'absolute',
    top: '50%',
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  itemTimeText: {
    position: 'absolute',
    top: '20%',
    left: -15,
    fontSize: 12,
    backgroundColor: colors.white,
  },
});

export default PlaceCard;
