import React from 'react';
import {TouchableOpacity, Image, StyleSheet, Text} from 'react-native';
import colors from '../../theme/colors';

const SocialButton = ({source, onPress, style, type}) => (
  <TouchableOpacity onPress={onPress} style={[{...style}, styles.button]}>
    <Image source={source} style={styles.logo} />
    <Text style={styles.socialButtonText}>Sign in with {type}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  logo: {
    width: 20,
    height: 20,
    resizeMode: 'cover',
  },
  socialButtonText: {
    color: colors.black,
    marginLeft: 8,
    fontSize: 16,
  },
});

export default SocialButton;
