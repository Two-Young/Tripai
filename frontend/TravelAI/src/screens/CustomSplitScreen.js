import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TextInput,
  Pressable,
  Image,
} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {Header} from '@rneui/themed';
import {Button, HelperText, IconButton, List, Surface} from 'react-native-paper';
import {useNavigation, useRoute, CommonActions} from '@react-navigation/native';
import DatePicker from 'react-native-date-picker';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import reactotron from 'reactotron-react-native';
import {getReceipt, uploadReceipt} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';

const CustomSplitScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

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
  const [receipt, setReceipt] = React.useState(null);

  // functions
  const handleSetAddress = () => {
    navigation.navigate('AddAddress');
  };

  const onPressClearAddress = () => {
    setAddress('');
    setPlaceID('');
  };

  const handleUploadReceipt = async () => {
    try {
      const result = await launchImageLibrary({mediaType: 'photo'});
      reactotron.log(result);
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        return;
      }
      if (result.errorMessage) {
        return;
      }
      setReceipt(result.assets ? result.assets[0].uri : null);
    } catch (error) {
      throw error;
    }
  };

  const onSubmitReceipt = async () => {
    try {
      if (receipt) {
        const formData = new FormData();
        const imageUriParts = receipt.split('.');
        const fileExtension = imageUriParts[imageUriParts.length - 1];
        formData.append('file', {
          uri: receipt,
          name: `receipt.${fileExtension}`,
          type: `image/${fileExtension}`,
        });
        const res = await uploadReceipt({session_id: currentSessionID, file: formData});

        reactotron.log(res);

        await getReceipt(res);
      }
    } catch (error) {
      throw error;
    }
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
      <SafeAreaView edges={['bottom']} style={defaultStyle.container}>
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
                <Image source={{uri: receipt}} style={{width: 200, height: 200}} />
                <Button mode="contained" onPress={onSubmitReceipt} />
                <List.Accordion title="Expense List">
                  <List.Item title="First item" />
                  <List.Item title="Second item" />
                </List.Accordion>
              </View>
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
