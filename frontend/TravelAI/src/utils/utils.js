import {Alert} from 'react-native';
import Toast from 'react-native-toast-message';

var base64js = require('base64-js');

export const arrayBufferToBase64 = buffer => {
  var binary = '';
  var bytes = [].slice.call(new Uint8Array(buffer));
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return base64js.fromByteArray(bytes);
};

export const requestAlert = async (title, description, okFunc) => {
  Alert.alert(title, description, [
    {
      text: 'Cancel',
      onPress: () => {},
      style: 'cancel',
    },
    {
      text: 'OK',
      onPress: async () => okFunc(),
    },
  ]);
};

export const showErrorToast = error => {
  Toast.show({
    type: 'error',
    text1: 'Oops!',
    text2: error.response.data.error ?? 'Something went wrong...',
  });
};

export const showSuccessToast = message => {
  Toast.show({
    type: 'success',
    text1: 'Done!',
    text2: message,
  });
};
