import {Pressable, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Button, Image} from '@rneui/themed';
import colors from '../../theme/colors';
import {Fonts} from '../../theme';

import {IconButton, Surface} from 'react-native-paper';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {Icon} from '@rneui/base';
import reactotron from 'reactotron-react-native';

const TravelItem = props => {
  const {onPress, travel, onPressDelete} = props;

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
    <>
      {/* <Pressable onPress={onPressDelete}>
        <Text>Delete</Text>
      </Pressable> */}
      <TouchableOpacity style={styles.session} onPress={onPress}>
        <IconButton
          style={styles.sessionDeleteButton}
          icon="close"
          iconColor="#3C3C43"
          containerColor="#F9F9F9"
          mode="contained"
          onPress={onPressDelete}
        />

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
            {/* <Button style={styles.sessionOpenBtn} mode="contained" onPress={onPress}>
            Open
          </Button> */}
          </View>
          {/* <View style={styles.lowerContent}>
          <Button
            compact
            icon="chevron-right"
            textColor="#3C3C43"
            contentStyle={styles.moreInfoBtn}>
            More Info
          </Button>
        </View> */}
        </View>
      </TouchableOpacity>
    </>
    // <Surface style={styles.session}>
    // </Surface>
  );
};

export default TravelItem;

const styles = StyleSheet.create({
  session: {
    width: '100%',
    backgroundColor: colors.white,
    // aspectRatio: 1,
    // borderRadius: 50,
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
    // borderTopLeftRadius: 50,
    // borderTopRightRadius: 50,
  },
  sessionContent: {
    // flex: 1,
    // padding: 24,
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
    // fontSize: 28,
    // fontWeight: 'bold',
    // color: colors.black,
    // marginBottom: 5,
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
