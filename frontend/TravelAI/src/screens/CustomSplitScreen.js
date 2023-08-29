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
import {Button, HelperText, IconButton, List, Surface} from 'react-native-paper';
import {useNavigation, useRoute, CommonActions} from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';

const CustomSplitScreen = () => {
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

  // functions
  const handleSetAddress = () => {
    navigation.navigate('AddAddress');
  };

  const onPressClearAddress = () => {
    setAddress('');
    setPlaceID('');
  };

  const handleUploadReceipt = () => {
    launchImageLibrary({mediaType: 'photo'}, response => {
      console.log(response);
    });
    /*
    launchCamera({mediaType: 'photo'}, response => {
      console.log(response);
    });  */
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
      <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
        <View style={styles.container}>
          <Header
            backgroundColor="#fff"
            barStyle="dark-content"
            centerComponent={{text: 'Custom Bill', style: defaultStyle.heading}}
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
                <Text>Expense</Text>
                <HelperText type="info" visible={true}>
                  If you want to write down the expense automatically, you can upload the receipt.
                </HelperText>
                <Button mode="contained" onPress={handleUploadReceipt}>
                  Upload Receipt
                </Button>

                <List.Accordion title="Expense List">
                  <List.Item title="First item" />
                  <List.Item title="Second item" />
                </List.Accordion>
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
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default CustomSplitScreen;

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
