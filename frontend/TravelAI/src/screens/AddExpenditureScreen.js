import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import CustomInput from '../component/molecules/CustomInput';
import colors from '../theme/colors';
import InputTable from '../component/molecules/InputTable';
import {Picker} from '@react-native-picker/picker';

const AddExpenditureScreen = () => {
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('food');
  const [type, setType] = React.useState('custom');
  const [detail, setDetail] = React.useState([]);

  return (
    <SafeArea>
      <CustomHeader title="Add Expenditure" rightComponent={<View />} />
      <View style={styles.container}>
        <Picker selectedValue={category} onValueChange={itemValue => setCategory(itemValue)}>
          <Picker.Item label="Food" value="food" />
          <Picker.Item label="Transportation" value="transportation" />
          <Picker.Item label="Shopping" value="shopping" />
          <Picker.Item label="Etc" value="etc" />
        </Picker>
        <CustomInput label={'Name'} value={name} setValue={setName} />
        <Text style={styles.label}>Type</Text>
        <Picker selectedValue={type} onValueChange={itemValue => setType(itemValue)}>
          <Picker.Item label="Custom" value="custom" />
          <Picker.Item label="Receipt" value="receipt" />
        </Picker>
        <Text style={styles.label}>Detailed</Text>
        <InputTable data={detail} setData={setDetail} />
      </View>
    </SafeArea>
  );
};

export default AddExpenditureScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
