import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {Header as HeaderRNE} from '@rneui/themed';
import Icon from 'react-native-vector-icons/FontAwesome';

const Header = () => {
  return (
    <HeaderRNE
      leftComponent={<Icon name="angle-left" size={20} />}
      centerComponent={{
        text: 'Choose the Countries',
      }}
    />
  );
};

export default Header;

const styles = StyleSheet.create({});
