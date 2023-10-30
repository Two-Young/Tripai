import {
  Platform,
  FlatList,
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import React, {useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import CustomHeader from '../component/molecules/CustomHeader';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {IconButton} from 'react-native-paper';
import MessageItem from '../component/molecules/MessageItem';
import colors from '../theme/colors';
import {socket} from '../services/socket';
import {chatGPTIcon} from '../assets/images';
import _ from 'lodash';
import {STYLES} from '../styles/Stylesheets';
import useBottomSpace from '../utils/useBottomSpace';
import {Regular} from '../theme/fonts';

const ChatScreen = () => {
  const navigation = useNavigation();
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  const [useChatGPT, setUseChatGPT] = React.useState(false);
  const [messages, setMessages] = React.useState([]);
  const [inputContent, setInputContent] = React.useState('');

  const flatListRef = React.useRef();

  const bottomSpace = useBottomSpace();

  const sendMessage = React.useCallback(async () => {
    if (_.isEmpty(inputContent)) {
      return;
    }
    if (useChatGPT) {
      socket.emit('sessionChat/sendAssistantMessage', currentSessionID, inputContent);
    } else {
      socket.emit('sessionChat/sendMessage', currentSessionID, inputContent);
    }
    setInputContent('');
  }, [inputContent, useChatGPT, currentSessionID]);

  const getMessagesCallback = React.useCallback(async res => {
    if (res.success) {
      setMessages(res.data);
    }
  }, []);

  const messageCallback = React.useCallback(
    async res => {
      if (res.success) {
        setMessages(prev => [...prev, res.data]);
      }
    },
    [flatListRef],
  );

  const assistantMessageCallback = React.useCallback(async res => {
    if (res.success) {
      setMessages(prev => [...prev, res]);
    }
  }, []);

  const userJoinedCallback = React.useCallback(async res => {
    if (res.succes) {
      console.log('userJoinedCallback ::', res);
    }
  }, []);

  useEffect(() => {
    socket.on('sessionChat/getMessages', getMessagesCallback);
    socket.on('sessionChat/message', messageCallback);
    socket.on('sessionChat/assistantMessage', assistantMessageCallback);
    socket.on('sessionChat/userJoined', userJoinedCallback);

    () => {
      socket.off('sessionChat/getMessages', getMessagesCallback);
      socket.off('sessionChat/message', messageCallback);
      socket.off('sessionChat/assistantMessage', assistantMessageCallback);
      socket.off('sessionChat/userJoined', userJoinedCallback);
    };
  }, [socket]);

  useEffect(() => {
    navigation.addListener('focus', async () => {
      socket.emit('sessionChat/getMessages', currentSessionID);
    });
    () => {
      navigation.removeListener('focus');
    };
  }, [currentSession]);

  useEffect(() => {
    if (messages.length) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd();
      }, 500);
    }
  }, [flatListRef]);

  return (
    <KeyboardAvoidingView
      style={STYLES.FLEX(1)}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={bottomSpace}>
      <View style={[STYLES.FLEX(1), {backgroundColor: colors.white}]}>
        <CustomHeader title={'AI CHAT'} useBack={false} />
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({item, index}) => <MessageItem {...item} />}
          contentContainerStyle={STYLES.PADDING(16)}
        />
        <View
          style={[styles.inputComponent, {backgroundColor: useChatGPT ? '#74AA9C' : '#E5E5EA'}]}>
          <TouchableOpacity
            style={[STYLES.MARGIN_RIGHT(12)]}
            onPress={() => setUseChatGPT(prev => !prev)}>
            <Image source={chatGPTIcon} style={[styles.gptIcon]} />
          </TouchableOpacity>
          <TextInput style={styles.input} value={inputContent} onChangeText={setInputContent} />
          <IconButton
            icon="send"
            iconColor={useChatGPT ? '#74AA9C' : colors.white}
            containerColor={useChatGPT ? colors.white : colors.primary}
            size={20}
            style={STYLES.MARGIN(0)}
            onPress={sendMessage}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  inputComponent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    // paddingHorizontal: 12,
  },
  gptIcon: {
    width: 36,
    height: 36,
  },
  input: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    marginRight: 12,
    backgroundColor: colors.white,
    color: colors.black,
    ...Regular(16),
  },
});
