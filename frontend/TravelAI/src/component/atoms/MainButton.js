import React from 'react';
import {StyleSheet, TouchableOpacity, Text} from 'react-native';
import {SemiBold} from '../../theme/fonts';
import colors from '../../theme/colors';

const MainButton = ({onPress, disabled = false, text}) => {
  return (
    <TouchableOpacity
      style={[styles.mainButton, {opacity: disabled ? 0.5 : 1}]}
      onPress={onPress}
      disabled={disabled}>
      <Text style={styles.mainButtonText}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  mainButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 60,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  mainButtonText: {
    ...SemiBold(18),
    color: colors.white,
  },
});

export default MainButton;
