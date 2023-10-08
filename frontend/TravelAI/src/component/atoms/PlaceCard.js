import {ImageBackground, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Card, IconButton} from 'react-native-paper';
import {STYLES} from '../../styles/Stylesheets';
import colors from '../../theme/colors';

const RightContent = props => <IconButton icon="chevron-right" iconColor="#000" />;

const PlaceCard = ({item, onPress, isLast}) => {
  const {start_at} = item;

  const time = React.useMemo(() => {
    const date = new Date(start_at);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  }, [start_at]);

  const subTitle = React.useMemo(() => {
    const {address, memo} = item || {};

    if (address === null && memo === null) {
      return '';
    } else {
      return `${address ?? ''} | ${memo ?? ''}`;
    }
  }, [item]);

  return (
    <View style={[styles.item, STYLES.PADDING_HORIZONTAL(20)]}>
      <View
        style={[
          STYLES.ALIGN_CENTER,
          STYLES.FLEX_CENTER,
          STYLES.WIDTH(30),
          STYLES.HEIGHT(50),
          STYLES.MARGIN_RIGHT(20),
        ]}>
        <View style={styles.circle} />
        <Text style={styles.itemTimeText}>{time}</Text>
        {!isLast && <View style={styles.line} />}
      </View>
      <Card
        style={[STYLES.FLEX(1), {backgroundColor: colors.white}]}
        right={RightContent}
        onPress={() => onPress(item)}>
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
    paddingBottom: 10,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  itemTimeText: {
    position: 'absolute',
    top: 0,
    width: 50,
    textAlign: 'center',
    fontSize: 12,
    backgroundColor: colors.white,
    color: colors.gray,
  },
  line: {
    position: 'absolute',
    top: 38,
    width: 2,
    height: 40,
    backgroundColor: colors.gray,
  },
});

export default PlaceCard;
