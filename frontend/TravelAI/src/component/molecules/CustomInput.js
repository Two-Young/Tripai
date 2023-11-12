import React, {useCallback} from 'react';
import {StyleSheet, Text, View, TextInput, Platform} from 'react-native';
import {CommonActions, useNavigation, useRoute} from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import dayjs from 'dayjs';

const CustomInput = ({label, value, setValue, type = 'text', onFocus, onBlur}) => {
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

  const onFocusInput = useCallback(
    e => {
      switch (type) {
        case 'place':
          handleSetAddress();
          ref.current.blur();
          break;
        case 'time':
        case 'date':
          setOpen(true);
          ref.current.blur();
          break;
      }
    },
    [type],
  );

  const ref = React.useRef(null);

  const showValue = React.useMemo(() => {
    switch (type) {
      case 'place':
        return value?.address ?? '';
      case 'time':
        return dayjs(value).format('HH:mm');
      case 'date':
        return dayjs(value).format('YYYY-MM-DD HH:mm');
      default:
        return value;
    }
  }, [type, value]);

  return (
    <>
      <View style={styles.customInput}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          ref={ref}
          onFocus={() => {
            onFocusInput();
            if (onFocus) {
              onFocus();
            }
          }}
          onBlur={() => {
            if (onBlur) {
              onBlur();
            }
          }}
          style={[styles.input, {...(type === 'multiline' && {height: 100})}]}
          placeholder="Type something"
          value={showValue}
          {...(type !== 'date' && {onChangeText: setValue})}
          {...(type === 'multiline' && {multiline: true})}
          showSoftInputOnFocus={type === 'text' || Platform.OS === 'android'}
        />
      </View>
      {(type === 'date' || type === 'time') && value.length > 0 && (
        <DatePicker
          modal
          open={open}
          date={new Date(value)}
          mode={type === 'date' ? 'datetime' : 'time'}
          onConfirm={date => {
            setOpen(false);
            setValue(date);
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
    paddingBottom: Platform.OS === 'ios' ? 8 : 2,
    backgroundColor: '#76768012',
    borderRadius: 5,
    fontSize: 17,
    textAlignVertical: 'top',
  },
});
