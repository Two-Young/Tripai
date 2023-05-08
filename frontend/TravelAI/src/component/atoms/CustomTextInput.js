import React from 'react';
import {StyleSheet, Text, TextInput} from 'react-native';
import colors from '../../theme/colors';
import fonts from '../../theme/fonts';

function CustomTextInput(props) {
  const {text, onChangeText, placeholder, secureTextEntry} = props;

  return (
    <TextInput
      style={styles.input}
      text={text}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    justifyContent: 'center',
    width: '100%',
    height: 56,
    paddingHorizontal: 10,
    backgroundColor: colors.lightgray,
    borderRadius: 14,
  },
});

export default CustomTextInput;
