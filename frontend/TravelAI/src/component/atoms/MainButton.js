import React from 'react';
import {StyleSheet, TouchableOpacity, Text} from 'react-native';
import {SemiBold} from '../../theme/fonts';
import colors from '../../theme/colors';
import {FAB} from 'react-native-paper';

const MainButton = ({icon, onPress, disabled = false, text}) => {
  return (
    // <TouchableOpacity
    //   style={[styles.mainButton, {opacity: disabled ? 0.5 : 1}]}
    //   onPress={onPress}
    //   disabled={disabled}>
    //   <Text style={styles.mainButtonText}>{text}</Text>
    // </TouchableOpacity>
    <FAB
      style={[
        styles.addScheduleButton,
        {backgroundColor: disabled ? colors.lightgray : colors.primary},
      ]}
      color={disabled ? colors.gray : colors.white}
      label={text}
      onPress={onPress}
      disabled={disabled}
      labelStyle={{fontFamily: SemiBold}}
      {...(Boolean(icon) && {icon})}
    />
  );
};

const styles = StyleSheet.create({
  mainButton: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: colors.primary,
  },
});

export default MainButton;
