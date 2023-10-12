import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';

const AddExpenditureScreen = () => {
  return (
    <SafeArea>
      <CustomHeader title="Add Expenditure" rightComponent={<View />} />
      <View style={styles.container}>
        <Text>Add Expenditure Screen</Text>
      </View>
    </SafeArea>
  );
};

export default AddExpenditureScreen;

const styles = StyleSheet.create({});
