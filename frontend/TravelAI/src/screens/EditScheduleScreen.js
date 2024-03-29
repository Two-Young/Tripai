import {StyleSheet, View, Alert} from 'react-native';
import React from 'react';
import {IconButton} from 'react-native-paper';
import {
  CommonActions,
  useNavigation,
  useRoute,
  useNavigationState,
  useFocusEffect,
} from '@react-navigation/native';
import colors from '../theme/colors';
import {deleteSchedule, updateSchedule} from '../services/api';
import _ from 'lodash';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader, {CUSTOM_HEADER_THEME} from '../component/molecules/CustomHeader';
import CustomInput from '../component/molecules/CustomInput';
import MainButton from '../component/atoms/MainButton';
import dayjs from 'dayjs';
import DismissKeyboard from '../component/molecules/DismissKeyboard';
import {STYLES} from '../styles/Stylesheets';
import {showErrorToast} from '../utils/utils';
import {AvoidSoftInput, AvoidSoftInputView} from 'react-native-avoid-softinput';

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
      showErrorToast(err);
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
        start_at: new Date(startAt).getTime() + dayjs().utcOffset() * 60 * 1000,
        memo: note,
      });
      navigation.dispatch({
        ...CommonActions.setParams({refresh: true}),
        source: target.key,
      });
      navigation.goBack();
    } catch (err) {
      showErrorToast(err);
    } finally {
      setLoading(false);
    }
  };

  // memo
  const addDisabled = React.useMemo(() => {
    return name.length === 0 || place?.address?.length === 0 || loading;
  }, [name, place]);

  React.useEffect(() => {
    if (route.params?.schedule) {
      const {
        schedule_id,
        name: scheduleName,
        address,
        place_id,
        start_at,
        memo,
      } = route.params?.schedule;
      setScheduleID(schedule_id);
      setName(scheduleName ?? '');
      setPlace({
        address,
        place_id,
      });
      setStartAt(
        dayjs(start_at)
          .add(-dayjs().utcOffset() / 60, 'hour')
          .format('YYYY-MM-DD HH:mm'),
      );
      setNote(memo ?? '');
    }
  }, [route.params?.schedule]);

  const onFocusEffect = React.useCallback(() => {
    // This should be run when screen gains focus - enable the module where it's needed
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    return () => {
      // This should be run when screen loses focus - disable the module where it's not needed, to make a cleanup
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, []);

  useFocusEffect(onFocusEffect); // register callback to focus events

  return (
    <SafeArea top={{style: {backgroundColor: 'white'}, barStyle: 'dark-content'}}>
      <View style={STYLES.FLEX(1)}>
        <DismissKeyboard>
          <CustomHeader
            title="Edit Schedule"
            theme={CUSTOM_HEADER_THEME.WHITE}
            rightComponent={
              <IconButton icon="delete" iconColor={'red'} onPress={onPressDeleteSchedule} />
            }
          />
        </DismissKeyboard>
        <View style={styles.container}>
          <AvoidSoftInputView style={styles.contentContainer}>
            <DismissKeyboard>
              <CustomInput label={'Name'} value={name} setValue={setName} />
            </DismissKeyboard>
            <DismissKeyboard>
              <CustomInput label={'Address'} value={place} setValue={setPlace} type="place" />
            </DismissKeyboard>
            <DismissKeyboard>
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
                type="time"
              />
            </DismissKeyboard>
            <DismissKeyboard>
              <CustomInput label={'Note'} value={note} setValue={setNote} type={'multiline'} />
            </DismissKeyboard>
          </AvoidSoftInputView>
          <MainButton
            text={loading ? 'Editing...' : 'Edit'}
            onPress={onPressEdit}
            disabled={addDisabled}
          />
        </View>
      </View>
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
