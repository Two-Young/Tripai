import {Keyboard, StyleSheet, View, TouchableWithoutFeedback, Alert} from 'react-native';
import React, {useEffect} from 'react';
import {IconButton} from 'react-native-paper';
import {CommonActions, useNavigation, useRoute, useNavigationState} from '@react-navigation/native';
import colors from '../theme/colors';
import {deleteSchedule, updateSchedule} from '../services/api';
import _ from 'lodash';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader, {CUSTOM_HEADER_THEME} from '../component/molecules/CustomHeader';
import CustomInput from '../component/molecules/CustomInput';
import MainButton from '../component/atoms/MainButton';
import dayjs from 'dayjs';

const EditScheduleScreen = () => {
  // states
  const [scheduleID, setScheduleID] = React.useState('');
  const [name, setName] = React.useState('');
  const [place, setPlace] = React.useState({});
  const [startAt, setStartAt] = React.useState('');
  const [note, setNote] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // hooks
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);
  const route = useRoute();

  const day = navigationState.routes.slice(-1)[0]?.params?.day;

  const tab = navigationState.routes[navigationState.routes.length - 2];
  const target = tab?.state?.routes[1];

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
        address: place.address,
        place_id: place.place_id,
        start_at: new Date(startAt).getTime(),
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

  // memo
  const addDisabled = React.useMemo(() => {
    return name.length === 0 || place?.address?.length === 0 || loading;
  }, [name, place]);

  const isUpdated = React.useMemo(() => {
    return !_.isEqual(route.params?.schedule, {
      schedule_id: scheduleID,
      name,
      address: place.address,
      place_id: place?.place_id,
      start_at: new Date(startAt).getTime(),
      memo: note,
    });
  }, [route.params?.schedule, scheduleID, name, place, note]);

  React.useEffect(() => {
    if (route.params?.schedule) {
      const {schedule_id, name, address, place_id, start_at, memo} = route.params?.schedule;
      const schedule = route.params?.schedule;
      setScheduleID(schedule_id);
      setName(name ?? '');
      setPlace({
        address,
        place_id,
      });
      setStartAt(dayjs(start_at).format('YYYY-MM-DD HH:mm'));
      setNote(memo ?? '');
    }
  }, [route.params?.schedule]);

  console.log({day});

  return (
    <SafeArea top={{style: {backgroundColor: 'white'}, barStyle: 'dark-content'}}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{flex: 1}}>
          <CustomHeader
            title="Edit Schedule"
            theme={CUSTOM_HEADER_THEME.WHITE}
            rightComponent={
              <IconButton icon="delete" iconColor={colors.white} onPress={onPressDeleteSchedule} />
            }
          />
          <View style={styles.container}>
            <View style={styles.contentContainer}>
              <CustomInput label={'Name'} value={name} setValue={setName} />
              <CustomInput label={'Address'} value={place} setValue={setPlace} type="place" />
              <CustomInput
                label={'Date'}
                value={startAt}
                setValue={value => {
                  setStartAt(
                    dayjs(startAt)
                      .set('hour', dayjs(value).hour())
                      .set('minute', dayjs(value).minute())
                      .format('YYYY-MM-DD HH:mm'),
                  );
                }}
                type="date"
              />
              <CustomInput label={'Note'} value={note} setValue={setNote} type={'multiline'} />
            </View>
            <MainButton
              text={loading ? 'Editing...' : 'Edit'}
              onPress={onPressEdit}
              disabled={addDisabled}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeArea>
  );
};

export default EditScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingBottom: 10,
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
