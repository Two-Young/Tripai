import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';

const EditReceiptScreen = () => {
  return (
    <SafeArea>
      <CustomHeader title="Edit Receipt" />
    </SafeArea>
  );
};

export default EditReceiptScreen;

const styles = StyleSheet.create({});
