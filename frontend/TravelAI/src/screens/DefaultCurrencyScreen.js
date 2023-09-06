import {StyleSheet, Text, View, TouchableWithoutFeedback, Keyboard} from 'react-native';
import React from 'react';
import defaultStyle from '../styles/styles';
import {SafeAreaView} from 'react-native-safe-area-context';

const DefaultCurrencyScreen = () => {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView edges={['bottom']} style={defaultStyle.container} />
    </TouchableWithoutFeedback>
  );
};

export default DefaultCurrencyScreen;

const styles = StyleSheet.create({});
