import React from 'react';
import io from 'socket.io-client';
import {API_URL_DEBUG, API_URL_PROD} from './api';
import {useRecoilValue} from 'recoil';
import userAtom from '../recoil/user/user';
import reactotron from 'reactotron-react-native';
import {showSuccessToast} from '../utils/utils';
import Toast from 'react-native-toast-message';

export let socket;

export const initiateSocket = token => {
  socket = io(API_URL_PROD, {
    // 옵션 설정
    path: '/socket.io/',
    autoConnect: false,
    transports: ['websocket'],
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export const connectSocket = () => {
  if (!socket) {
    return;
  }
  socket.connect();
};

export const SocketManager = () => {
  const user = useRecoilValue(userAtom);
  const token = React.useMemo(() => user?.auth_tokens?.access_token?.token, [user]);

  React.useEffect(() => {
    if (token) {
      initiateSocket(token);
      connectSocket();

      socket.on('connect', () => {
        reactotron.log('connected');
      });

      socket.on('session/memberInvited', data => {
        Toast.show({
          type: 'info',
          text1: 'Invitation',
          text2: 'You have been invited to a session',
        });
      });

      socket.on('session/memberJoinRequested', data => {
        Toast.show({
          type: 'info',
          text1: 'Join request',
          text2: 'You have received a request to join a session',
        });
      });
    }

    return () => {
      disconnectSocket();
    };
  }, [token]);

  return <React.Fragment />;
};
