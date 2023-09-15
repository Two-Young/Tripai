import React from 'react';
import {TouchableOpacity, Image, StyleSheet} from 'react-native';

const SocialButton = ({source, onPress, style, type}) => (
  <TouchableOpacity onPress={onPress} style={[{...style}]}>
    <Image source={source} style={styles.logo} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  logo: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
});

export default SocialButton;
