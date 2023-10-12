import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';

const EditBudgetScreen = () => {
  return (
    <SafeArea>
      <CustomHeader title="Edit Budget" />
    </SafeArea>
  );
};

export default EditBudgetScreen;

const styles = StyleSheet.create({});
