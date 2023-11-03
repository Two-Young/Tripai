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
import {TripAIIcon} from '../assets/images';
import _ from 'lodash';
import {STYLES} from '../styles/Stylesheets';
import useBottomSpace from '../utils/useBottomSpace';
import {Regular} from '../theme/fonts';
import LinearGradient from 'react-native-linear-gradient';

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
      console.log('sendAssistantMessage ::', inputContent);
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
      setMessages(prev => [
        ...prev,
        {
          ...res,
          type: 'assistant_response',
        },
      ]);
    }
  }, []);

  const userJoinedCallback = React.useCallback(async res => {
    if (res.succes) {
      console.log('userJoinedCallback ::', res);
    }
  }, []);

  const assistantMessageStartCallback = React.useCallback(async res => {
    if (res.success) {
      setMessages(prev => [...prev, {...res.data, type: 'assistant_response', content: ''}]);
    }
  }, []);

  const assistantMessageStreamCallback = React.useCallback(async res => {
    if (res.success) {
      setMessages(prev =>
        prev.map(item => {
          if (item.gpt_response_id === res.data.gpt_response_id) {
            return {
              ...item,
              content: item.content + res.data.content,
            };
          }
          return item;
        }),
      );
    }
  }, []);

  const assistantMessageEndCallback = React.useCallback(async res => {
    if (res.success) {
      setMessages(prev =>
        prev.map(item => {
          if (item.gpt_response_id === res.data.gpt_response_id) {
            return {
              ...item,
              content: res.data.complete_content,
              isEnd: true,
            };
          }
          return item;
        }),
      );
    }
  }, []);

  const assistantMessageErrorCallback = React.useCallback(async res => {
    if (res.success) {
      setMessages(prev =>
        prev.map(item => {
          if (item.gpt_response_id === res.data.gpt_response_id) {
            return {
              ...item,
              content: 'Error occurred. Please try again.',
              isError: true,
            };
          }
          return item;
        }),
      );
    }
  }, []);

  // TODO:: Chat GPT의 경우, Box 하나에 메시지가 추가되는 형태로 구현 (byte 단위로 와서 그럼)

  useEffect(() => {
    if (socket?.connected) {
      socket.on('sessionChat/getMessages', getMessagesCallback);
      socket.on('sessionChat/message', messageCallback);
      socket.on('sessionChat/assistantMessage', assistantMessageCallback);
      socket.on('sessionChat/userJoined', userJoinedCallback);
      socket.on('sessionChat/assistantMessageStart', assistantMessageStartCallback);
      socket.on('sessionChat/assistantMessageStream', assistantMessageStreamCallback);
      socket.on('sessionChat/assistantMessageEnd', assistantMessageEndCallback);
      socket.on('sessionChat/assistantMessageError', assistantMessageErrorCallback);
    }

    () => {
      if (socket) {
        socket.off('sessionChat/getMessages', getMessagesCallback);
        socket.off('sessionChat/message', messageCallback);
        socket.off('sessionChat/assistantMessage', assistantMessageCallback);
        socket.off('sessionChat/userJoined', userJoinedCallback);
        socket.off('sessionChat/assistantMessageStart', assistantMessageStartCallback);
        socket.off('sessionChat/assistantMessageStream', assistantMessageStreamCallback);
        socket.off('sessionChat/assistantMessageEnd', assistantMessageEndCallback);
        socket.off('sessionChat/assistantMessageError', assistantMessageErrorCallback);
      }
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
      }, 1000);
    }
  }, [flatListRef, messages]);

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        flatListRef.current.scrollToEnd();
      }, 500);
    });
    return () => {
      Keyboard.removeAllListeners('keyboardDidShow');
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={STYLES.FLEX(1)}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={bottomSpace + (Platform.OS === 'ios' ? 0 : 60)}>
      <View style={[STYLES.FLEX(1), {backgroundColor: '#f2f7ff'}]}>
        <CustomHeader title={'AI CHAT'} useBack={false} />
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({item, index}) => <MessageItem {...item} />}
          contentContainerStyle={[STYLES.PADDING(16), {backgroundColor: '#f2f7ff'}]}
        />
        <LinearGradient
          colors={
            useChatGPT
              ? ['purple', 'black', 'black', 'black', 'black', 'black', 'cyan']
              : ['#E5E5EA', '#E5E5EA']
          }
          useAngle={true}
          angle={70}
          style={[styles.inputComponent]}>
          <TouchableOpacity
            style={[STYLES.MARGIN_RIGHT(12)]}
            onPress={() => setUseChatGPT(prev => !prev)}>
            <Image source={TripAIIcon} style={[styles.gptIcon]} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: useChatGPT ? '#ffffff20' : '#ffffff',
                color: useChatGPT ? '#ffffff' : '#000000',
              },
            ]}
            value={inputContent}
            onChangeText={setInputContent}
          />
          <IconButton
            icon="send"
            iconColor={useChatGPT ? '#74AA9C' : colors.white}
            containerColor={useChatGPT ? colors.white : colors.primary}
            size={20}
            style={STYLES.MARGIN(0)}
            onPress={sendMessage}
          />
        </LinearGradient>
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
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
