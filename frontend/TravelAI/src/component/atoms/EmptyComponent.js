import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {STYLES} from '../../styles/Stylesheets';

const EmptyComponent = ({text}) => {
  return (
    <View style={[STYLES.FLEX_CENTER, STYLES.HEIGHT(150)]}>
      <Text>{text}</Text>
    </View>
  );
};

export default EmptyComponent;

const styles = StyleSheet.create({});
