import {
  Keyboard,
  TextInput,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Pressable,
} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Header as HeaderRNE} from '@rneui/themed';
import defaultStyle from '../styles/styles';
import {Button, Surface, Text} from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import {useNavigation} from '@react-navigation/native';

const AddScheduleScreen = () => {
  // states
  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [startAt, setStartAt] = React.useState('');
  const [date, setDate] = React.useState(new Date());
  const [note, setNote] = React.useState('');
  const [open, setOpen] = React.useState(false);

  // hooks
  const navigation = useNavigation();

  // functions
  const handleAdd = () => {
    navigation.goBack();
  };

  const handleSetAddress = () => {
    navigation.navigate('PlaceWithoutTab', {});
  };

  // memo
  const addDisabled = React.useMemo(() => {
    return !name || !address || !startAt;
  }, [name, address, startAt]);

  // effects
  React.useEffect(() => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const hours = date.getHours();
    const minutes = date.getMinutes();
    setStartAt(`${year}-${month}-${day} ${hours}:${minutes}`);
  }, [date]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
        <HeaderRNE
          backgroundColor="#fff"
          barStyle="dark-content"
          centerComponent={{text: 'Add Schedule', style: defaultStyle.heading}}
        />
        <View style={styles.container}>
          <View style={styles.contentContainer}>
            <View>
              <Text>Name</Text>
              <TextInput
                placeholder="Type something"
                value={name}
                onChangeText={setName}
                outlineColor="#000"
              />
            </View>
            <View>
              <Text>Address</Text>
              <Pressable onPress={() => handleSetAddress()}>
                <View pointerEvents="none">
                  <TextInput placeholder="" value={address} outlineColor="#000" editable={false} />
                </View>
              </Pressable>
            </View>
            <View>
              <Text>Start at</Text>
              <Pressable onPress={() => setOpen(true)}>
                <View pointerEvents="none">
                  <TextInput placeholder="Type something" value={startAt} editable={false} />
                </View>
              </Pressable>
            </View>
            <View>
              <Text>Note</Text>
              <Surface style={styles.surface} mode="flat">
                <TextInput
                  style={{width: '100%', height: '100%', textAlignVertical: 'top'}}
                  placeholder="Type something"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  outlineColor="#000"
                />
              </Surface>
            </View>
            <DatePicker
              modal
              open={open}
              date={date}
              mode="time"
              onConfirm={date => {
                setOpen(false);
                setDate(date);
              }}
              onCancel={() => setOpen(false)}
            />
          </View>

          <Button mode="contained" onPress={handleAdd} disabled={addDisabled}>
            Add
          </Button>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default AddScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  contentContainer: {
    flex: 1,
  },
  surface: {
    padding: 8,
    height: 200,
    width: '100%',
  },
});
