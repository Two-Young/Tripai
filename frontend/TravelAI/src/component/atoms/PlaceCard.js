import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Card, IconButton} from 'react-native-paper';
import {STYLES} from '../../styles/Stylesheets';
import colors from '../../theme/colors';
import {Regular} from '../../theme/fonts';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';

const RightContent = props => <IconButton icon="chevron-right" iconColor="#000" />;

const PlaceCard = ({item, onPress, isFirst, isLast, isNext}) => {
  const {start_at} = item;

  const time = React.useMemo(
    () =>
      dayjs(start_at)
        .add(-dayjs().utcOffset() / 60, 'hour')
        .format('HH:mm'),
    [start_at],
  );

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
          STYLES.WIDTH(40),
          STYLES.HEIGHT(50),
          STYLES.MARGIN_RIGHT(20),
        ]}>
        {!isFirst &&
          (isNext ? (
            <LinearGradient
              colors={[colors.gray, colors.primary]}
              useAngle={true}
              angle={180}
              style={styles.line}
            />
          ) : (
            <View style={styles.line} />
          ))}
        <View style={[styles.circle, {backgroundColor: isNext ? colors.primary : colors.gray}]}>
          <Text style={styles.itemTimeText}>{time}</Text>
        </View>
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
    padding: 3,
    paddingHorizontal: 6,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  itemTimeText: {
    ...Regular(10),
    color: colors.white,
  },
  line: {
    position: 'absolute',
    top: -42,
    width: 2,
    height: 52,
    borderRadius: 1,
    backgroundColor: colors.gray,
  },
});

export default PlaceCard;
