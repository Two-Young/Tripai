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

      socket.on('session/memberInvited', () => {
        Toast.show({
          type: 'info',
          text: 'You have been invited to a session',
          position: 'bottom',
        });
      });

      socket.on('session/memberJoinedRequest', () => {
        Toast.show({
          type: 'info',
          text: 'You have received a request to join a session',
          position: 'bottom',
        });
      });

      socket.on('connect', () => {
        reactotron.log('connected');
      });
    }

    return () => {
      disconnectSocket();
      socket.off('session/memberInvited');
      socket.off('session/memberJoinedRequest');
    };
  }, [token]);

  return <React.Fragment />;
};
