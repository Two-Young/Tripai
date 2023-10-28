import React, {useCallback} from 'react';
import {Image, StyleSheet, TouchableOpacity} from 'react-native';
import {checkbox, checkedbox} from '../../assets/images';

const Checkbox = ({checked, onPressCheckbox, mode = 'default'}) => {
  return (
    <TouchableOpacity style={styles.checkboxContainer} onPress={onPressCheckbox}>
      <Image
        style={[styles.checkboxImage, mode === 'white' && styles.white]}
        source={checked ? checkedbox : checkbox}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkboxContainer: {
    width: 24,
    height: 24,
  },
  checkboxImage: {
    width: 24,
    height: 24,
  },
  white: {
    tintColor: 'white',
  },
});

export default Checkbox;
