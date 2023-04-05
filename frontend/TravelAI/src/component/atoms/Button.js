import React from 'react';
import {StyleSheet, Text, TouchableOpacity} from 'react-native';
import colors from '../../theme/colors';
import fonts from '../../theme/fonts';

function Button(props) {
  const {title, onPress, style, textStyle} = props;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Text style={styles.textContainer}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    width: '100%',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 16,
  },
  textContainer: {
    textAlign: 'center',
    color: colors.white,
    fontSize: fonts.size.font8,
  },
});

export default Button;
