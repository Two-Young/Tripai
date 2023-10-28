import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Pressable,
} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {Header} from '@rneui/themed';
import {Button, IconButton, SegmentedButtons, Surface} from 'react-native-paper';
import {useNavigation, useRoute, CommonActions} from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';

const SplitBillScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();

  // states
  const [name, setName] = React.useState('');
  const [totalAmount, setTotalAmount] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [placeID, setPlaceID] = React.useState('');
  const [startAt, setStartAt] = React.useState('');
  const [date, setDate] = React.useState(new Date());
  const [note, setNote] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [type, setType] = React.useState('');

  // functions
  const handleSetAddress = () => {
    navigation.navigate('AddAddress');
  };

  const onPressClearAddress = () => {
    setAddress('');
    setPlaceID('');
  };

  // effects
  React.useEffect(() => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const hours = date.getHours();
    const minutes = date.getMinutes();
    setStartAt(`${year}-${month}-${day} ${hours}:${minutes}`);
  }, [date]);

  React.useEffect(() => {
    if (route.params?.place) {
      setAddress(route.params?.place?.address);
      setPlaceID(route.params?.place?.place_id);
      navigation.dispatch({...CommonActions.setParams({place: null})});
    }
  }, [route.params?.place]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {/* <SafeAreaView edges={['bottom']} style={defaultStyle.container}>
        <View style={styles.container}>
          <Header
            backgroundColor="#fff"
            barStyle="dark-content"
            centerComponent={{text: 'Split Bill', style: defaultStyle.heading}}
            leftComponent={
              <IconButton
                mode="contained"
                icon="chevron-left"
                iconColor="#000"
                onPress={() => navigation.goBack()}
              />
            }
          />
          <ScrollView>
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
                <Text>Amount</Text>
                <TextInput
                  placeholder="Type something"
                  value={totalAmount}
                  onChangeText={setTotalAmount}
                  outlineColor="#000"
                  inputMode="numeric"
                  keyboardType="numeric"
                />
              </View>
              <View>
                <Text>Type</Text>
                <SegmentedButtons value={type} onValueChange={setType} buttons={[]} />
              </View>
              <View>
                <Text>Address</Text>
                <View style={{flexDirection: 'row'}}>
                  <Pressable style={{flex: 1}} onPress={handleSetAddress}>
                    <View pointerEvents="none">
                      <TextInput
                        placeholder=""
                        value={address}
                        outlineColor="#000"
                        editable={false}
                        textBreakStrategy="highQuality"
                      />
                    </View>
                  </Pressable>
                  {address !== '' && <IconButton icon="close" onPress={onPressClearAddress} />}
                </View>
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
          </ScrollView>
          <Button mode="contained">{loading ? 'Adding...' : 'Add'}</Button>
        </View>
      </SafeAreaView> */}
    </TouchableWithoutFeedback>
  );
};

export default SplitBillScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  contentContainer: {
    flex: 1,
  },
  surface: {
    marginTop: 10,
    padding: 8,
    height: 200,
    width: '100%',
  },
});
