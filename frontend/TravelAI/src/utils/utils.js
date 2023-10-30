import {Alert, StyleSheet, View, Text} from 'react-native';
import Toast from 'react-native-toast-message';
import {Regular} from '../theme/fonts';
import colors from '../theme/colors';

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

export const toastConfig = {
  success: ({text1, text2, props}) => (
    <View style={[styles.toastLayout, styles.successBackground]}>
      <Text style={styles.toastMainText}>{text1}</Text>
      <Text style={styles.toastSubtext}>{text2}</Text>
    </View>
  ),
  error: ({text1, text2, props}) => (
    <View style={[styles.toastLayout, styles.errorBackground]}>
      <Text style={styles.toastMainText}>{text1}</Text>
      <Text style={styles.toastSubtext}>{text2}</Text>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastLayout: {
    width: '80%',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    shadowColor: colors.black,
    shadowOffset: {
      width: 5,
      height: 5,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3.84,
    elevation: 2.5,
  },
  successBackground: {
    backgroundColor: '#d0ffff',
  },
  errorBackground: {
    backgroundColor: '#ffd0d0',
  },
  toastMainText: {
    ...Regular(12),
    color: colors.black,
  },
  toastSubtext: {
    // marginTop: 2,
    ...Regular(10),
    color: colors.black,
  },
});
