import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Image} from '@rneui/themed';
import colors from '../../theme/colors';
import {Fonts} from '../../theme';

import {IconButton} from 'react-native-paper';
import {TouchableOpacity} from 'react-native-gesture-handler';

const TravelItem = props => {
  const {onPress, travel} = props;

  const {name, start_at, end_at, thumbnail_url} = React.useMemo(() => {
    const {name, start_at, end_at, thumbnail_url} = travel;
    return {
      name,
      start_at,
      end_at,
      thumbnail_url,
    };
  }, [travel]);

  return (
    <TouchableOpacity style={styles.session} onPress={onPress}>
      <Image source={{uri: thumbnail_url}} style={styles.sessionImage} />
      <View style={styles.sessionContent}>
        <View style={styles.upperContent}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName} numberOfLines={2}>
              {name}
            </Text>
            <Text
              style={styles.sessionDescription}
              numberOfLines={2}>{`${start_at} ~ ${end_at}`}</Text>
          </View>
          <IconButton icon={'greater-than'} size={10} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TravelItem;

const styles = StyleSheet.create({
  session: {
    width: '100%',
    backgroundColor: colors.white,
  },
  sessionDeleteButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 1,
  },
  sessionImage: {
    width: '100%',
    height: 137,
  },
  sessionContent: {
    minHeight: 100,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  upperContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lowerContent: {
    alignItems: 'flex-end',
  },
  sessionInfo: {
    flex: 1,
    marginRight: 24,
  },
  sessionName: {
    ...Fonts.SemiBold(16),
  },
  sessionDescription: {
    fontSize: 12,
    color: colors.black,
  },
  sessionOpenBtn: {
    width: 100,
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
  },
});
