import React, {useCallback} from 'react';
import {StyleSheet, Text, View, TextInput} from 'react-native';
import {CommonActions, useNavigation, useRoute} from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import dayjs from 'dayjs';

const CustomInput = ({label, value, setValue, type = 'text'}) => {
  const navigation = useNavigation();
  const route = useRoute();

  const [open, setOpen] = React.useState(false);

  const handleSetAddress = () => {
    navigation.navigate('AddAddress');
  };

  React.useEffect(() => {
    if (type === 'place' && route.params?.place) {
      setValue(route.params?.place);
      navigation.dispatch({...CommonActions.setParams({place: null})});
    }
  }, [type, route.params?.place]);

  const onFocus = useCallback(() => {
    switch (type) {
      case 'place':
        handleSetAddress();
        ref.current.blur();
        break;
      case 'date':
        setOpen(true);
        ref.current.blur();
        break;
    }
  }, [type]);

  const ref = React.useRef(null);

  return (
    <>
      <View style={styles.customInput}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          ref={ref}
          onFocus={onFocus}
          style={[styles.input, {...(type === 'multiline' && {height: 100})}]}
          placeholder="Type something"
          value={type === 'place' ? value?.address ?? '' : value}
          onChangeText={setValue}
          outlineColor="#000"
          {...(type === 'multiline' && {multiline: true})}
        />
      </View>
      {type === 'date' && (
        <DatePicker
          modal
          open={open}
          date={new Date(value)}
          mode="time"
          onConfirm={date => {
            setOpen(false);
            setValue(dayjs(date).format('YYYY-MM-DD HH:mm'));
          }}
          onCancel={() => {
            setOpen(false);
          }}
        />
      )}
    </>
  );
};

export default CustomInput;

const styles = StyleSheet.create({
  customInput: {marginTop: 15},
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#76768012',
    borderRadius: 5,
    fontSize: 17,
    textAlignVertical: 'top',
  },
});
