import React from 'react';
import {TouchableOpacity, Image, StyleSheet} from 'react-native';

const SocialButton = ({source, onPress}) => (
  <TouchableOpacity onPress={onPress} style={styles.button}>
    <Image source={source} style={styles.logo} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fff',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  logo: {
    width: 45,
    height: 45,
    borderRadius: 100,
    resizeMode: 'cover',
  },
});

export default SocialButton;
