import {
  Keyboard,
  TextInput,
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  Pressable,
  Alert,
} from 'react-native';
import React, {useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Header as HeaderRNE} from '@rneui/themed';
import defaultStyle from '../styles/styles';
import {Button, IconButton, Surface, Text} from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import {CommonActions, useNavigation, useRoute, useNavigationState} from '@react-navigation/native';
import colors from '../theme/colors';
import {deleteSchedule, updateSchedule} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import reactotron from 'reactotron-react-native';
import _ from 'lodash';

const EditScheduleScreen = () => {
  // states
  const [scheduleID, setScheduleID] = React.useState('');
  const [name, setName] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [placeID, setPlaceID] = React.useState('');
  const [startAt, setStartAt] = React.useState('');
  const [date, setDate] = React.useState(new Date());
  const [note, setNote] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // hooks
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);
  const route = useRoute();
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  const tab = navigationState.routes[navigationState.routes.length - 2];
  const target = tab?.state?.routes[1];

  // functions
  const handleSetAddress = () => {
    navigation.navigate('AddAddress');
  };

  const onPressDeleteSchedule = async () => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', onPress: onDelete, style: 'destructive'},
    ]);
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await deleteSchedule(scheduleID);

      navigation.dispatch({
        ...CommonActions.setParams({refresh: true}),
        source: target.key,
      });
      navigation.goBack();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onPressEdit = async () => {
    try {
      setLoading(true);
      const res = await updateSchedule({
        schedule_id: scheduleID,
        name,
        address,
        place_id: placeID,
        start_at: date.getTime(),
        memo: note,
      });
      navigation.dispatch({
        ...CommonActions.setParams({refresh: true}),
        source: target.key,
      });
      navigation.goBack();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onPressClearAddress = () => {
    setAddress('');
    setPlaceID('');
  };

  // memo
  const addDisabled = React.useMemo(() => {
    return name.length === 0 && address.length === 0;
  }, [name, address]);

  const isUpdated = React.useMemo(() => {
    return !_.isEqual(route.params?.schedule, {
      schedule_id: scheduleID,
      name,
      address,
      place_id: placeID,
      start_at: date.getTime(),
      memo: note,
    });
  }, [route.params?.schedule, scheduleID, name, address, placeID, date, note]);

  const clearAddressBtnDisabled = React.useMemo(() => {
    return address.length === 0 && placeID.length === 0;
  }, [address]);

  // effects
  React.useEffect(() => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const hours = date.getHours();
    const minutes = date.getMinutes();
    setStartAt(`${year}-${month}-${day} ${hours}:${minutes}`);
  }, [date]);

  useEffect(() => {
    if (route.params?.day) {
      setDate(route.params?.day);
    }
  }, [route.params?.day]);

  React.useEffect(() => {
    if (route.params?.schedule) {
      const {schedule_id, name, address, place_id, start_at, memo} = route.params?.schedule;
      setScheduleID(schedule_id);
      setName(name ?? '');
      setAddress(address ?? '');
      setPlaceID(place_id ?? '');
      setDate(new Date(start_at));
      setNote(memo ?? '');
    }
  }, [route.params?.schedule]);

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
        <HeaderRNE
          backgroundColor={colors.white}
          barStyle="dark-content"
          centerComponent={{text: 'Edit Schedule', style: defaultStyle.heading}}
          leftComponent={
            <IconButton
              mode="contained"
              icon="chevron-left"
              iconColor={colors.black}
              onPress={() => navigation.goBack()}
            />
          }
          rightComponent={
            <IconButton icon="delete" iconColor="#000" onPress={onPressDeleteSchedule} />
          }
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
              <View style={{flexDirection: 'row'}}>
                <Pressable style={{flex: 1}} onPress={() => handleSetAddress()}>
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
                <IconButton
                  icon="close"
                  onPress={onPressClearAddress}
                  disabled={clearAddressBtnDisabled}
                />
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
          <Button
            mode="contained"
            onPress={onPressEdit}
            loading={loading}
            disabled={addDisabled || !isUpdated}>
            {loading ? 'Editing...' : 'Edit'}
          </Button>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default EditScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
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
