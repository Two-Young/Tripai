import {Pressable, StyleSheet, Text, View, Image} from 'react-native';
import React from 'react';
import {useRecoilValue} from 'recoil';
import userAtom from '../../recoil/user/user';
import {STYLES} from '../../styles/Stylesheets';
import {Light} from '../../theme/fonts';
import colors from '../../theme/colors';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';
import {TripAIIcon} from '../../assets/images';

const MessageItem = props => {
  const {senderUserId, senderUsername, senderProfileImage, content, timestamp, type, isError} =
    props;

  const user = useRecoilValue(userAtom);
  const userInfo = React.useMemo(() => user?.user_info, [user]);

  const isMine = React.useMemo(() => senderUserId === userInfo?.user_id, [userInfo, senderUserId]);

  const messageBoxStyle = React.useMemo(() => {
    switch (type) {
      case 'chat_message':
        if (isMine) {
          return styles.myMessageBox;
        } else {
          return styles.otherMessageBox;
        }
      case 'assistant_request':
        return styles.gptRequestMessageBox;
      case 'assistant_response':
        return styles.gptResponseMessageBox;
      default: {
      }
    }
  }, [content]);

  const messageContentStyle = React.useMemo(() => {
    if (isError) {
      return styles.errorContent;
    }
    switch (type) {
      case 'chat_message':
        if (isMine) {
          return styles.myProfileContent;
        } else {
          return styles.otherProfileContent;
        }
      case 'assistant_request':
        return styles.gptContent;
      case 'assistant_response':
        return styles.gptContent;
      default: {
      }
    }
  }, [content]);

  const AssistantMessageBorderComponent = React.useCallback(
    ({children}) => {
      if (type.includes('assistant')) {
        return (
          <LinearGradient
            colors={['purple', 'cyan']}
            useAngle={true}
            angle={70}
            style={[styles.messageBox, STYLES.PADDING(2)]}>
            {children}
          </LinearGradient>
        );
      }
      return children;
    },
    [type],
  );

  return (
    <View
      style={[
        STYLES.FLEX_ROW,
        STYLES.MARGIN_VERTICAL(3),
        {alignItems: 'flex-start', justifyContent: isMine ? 'flex-end' : 'flex-start'},
      ]}>
      {!isMine && type !== 'assistant_response' && (
        <View style={styles.profileBox}>
          <Image source={{uri: senderProfileImage}} style={styles.profileImage} />
        </View>
      )}
      {!isMine && type === 'assistant_response' && (
        <View style={styles.profileBox}>
          <LinearGradient
            colors={['purple', 'cyan']}
            useAngle={true}
            angle={70}
            style={[STYLES.PADDING(2), {borderRadius: 18}]}>
            <Image source={TripAIIcon} style={styles.profileImage} />
          </LinearGradient>
        </View>
      )}
      <View style={[STYLES.FLEX(1)]}>
        {!isMine && type !== 'assistant_response' && (
          <Text style={styles.profileName}>{senderUsername}</Text>
        )}
        {!isMine && type === 'assistant_response' && <Text style={styles.profileName}>TripAI</Text>}
        <View
          style={[
            STYLES.FLEX_ROW,
            {alignItems: 'flex-end', justifyContent: isMine ? 'flex-end' : 'flex-start'},
          ]}>
          {isMine && <Text style={styles.timestamp}>{dayjs(timestamp).format('HH:mm')}</Text>}
          <AssistantMessageBorderComponent>
            {type.includes('response') ? (
              <LinearGradient
                colors={[
                  'purple',
                  colors.black,
                  colors.black,
                  colors.black,
                  colors.black,
                  colors.black,
                  colors.black,
                  'cyan',
                ]}
                useAngle={true}
                angle={75}
                style={[STYLES.PADDING(10), {borderRadius: 14}]}>
                <Text style={messageContentStyle}>{content}</Text>
              </LinearGradient>
            ) : (
              <View style={[messageBoxStyle, STYLES.PADDING(10), {borderRadius: 14}]}>
                <Text style={messageContentStyle}>{content}</Text>
              </View>
            )}
          </AssistantMessageBorderComponent>

          {!isMine && <Text style={styles.timestamp}>{dayjs(timestamp).format('HH:mm')}</Text>}
        </View>
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
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  myMessageBox: {
    backgroundColor: colors.primary,
  },
  otherMessageBox: {
    backgroundColor: colors.lightgray,
  },
  gptRequestMessageBox: {
    backgroundColor: colors.black,
  },
  gptResponseMessageBox: {
    backgroundColor: colors.gpt,
  },
  myProfileContent: {
    color: colors.white,
  },
  otherProfileContent: {
    color: colors.black,
  },
  gptContent: {
    color: colors.white,
  },
  errorContent: {
    color: '#FF6666',
  },
  profileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  profileName: {
    // marginTop: 4,
    marginBottom: 4,
    ...Light(12),
    textAlign: 'left',
  },
  timestamp: {
    marginHorizontal: 8,
    ...Light(12),
    color: colors.gray,
  },
});
