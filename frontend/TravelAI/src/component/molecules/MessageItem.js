import {Pressable, StyleSheet, Text, View, Image} from 'react-native';
import React from 'react';
import {useRecoilValue} from 'recoil';
import userAtom from '../../recoil/user/user';
import {STYLES} from '../../styles/Stylesheets';
import {Light} from '../../theme/fonts';
import colors from '../../theme/colors';
import dayjs from 'dayjs';

const MessageItem = props => {
  const {senderUserId, senderUsername, senderProfileImage, content, timestamp} = props;

  const user = useRecoilValue(userAtom);
  const userInfo = React.useMemo(() => user?.user_info, [user]);

  const isMine = React.useMemo(() => senderUserId === userInfo?.user_id, [userInfo, senderUserId]);

  return (
    <View
      style={[
        STYLES.FLEX_ROW,
        STYLES.MARGIN_VERTICAL(2),
        {alignItems: 'flex-start', justifyContent: isMine ? 'flex-end' : 'flex-start'},
      ]}>
      {!isMine && (
        <View style={styles.profileBox}>
          <Image source={{uri: senderProfileImage}} style={styles.profileImage} />
          <Text style={styles.profileName}>{senderUsername}</Text>
        </View>
      )}
      <View
        style={[
          STYLES.FLEX_ROW,
          STYLES.WIDTH('80%'),
          {alignItems: 'flex-end', justifyContent: isMine ? 'flex-end' : 'flex-start'},
        ]}>
        {isMine && <Text style={styles.timestamp}>{dayjs(timestamp).format('HH:mm')}</Text>}
        <View style={[styles.messageBox, isMine ? styles.myMessageBox : styles.otherMessageBox]}>
          <Text style={isMine ? styles.myProfileContent : styles.otherProfileContent}>
            {content}
          </Text>
        </View>
        {!isMine && <Text style={styles.timestamp}>{dayjs(timestamp).format('HH:mm')}</Text>}
      </View>
    </View>
  );
};

export default MessageItem;

const styles = StyleSheet.create({
  profileBox: {
    alignItems: 'center',
    width: 40,
    marginRight: 10,
  },
  messageBox: {
    maxWidth: '60%',
    padding: 12,
    borderRadius: 16,
  },
  myMessageBox: {
    backgroundColor: colors.primary,
  },
  otherMessageBox: {
    backgroundColor: colors.lightgray,
  },
  myProfileContent: {
    color: colors.white,
  },
  otherProfileContent: {
    color: colors.black,
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileName: {
    marginTop: 4,
    ...Light(12),
  },
  timestamp: {
    marginHorizontal: 8,
    ...Light(12),
    color: colors.gray,
  },
});
