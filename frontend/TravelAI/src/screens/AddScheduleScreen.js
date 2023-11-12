import {StyleSheet, View} from 'react-native';
import React from 'react';
import {
  CommonActions,
  useFocusEffect,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native';
import colors from '../theme/colors';
import {createSchedule} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader, {CUSTOM_HEADER_THEME} from '../component/molecules/CustomHeader';
import CustomInput from '../component/molecules/CustomInput';
import dayjs from 'dayjs';
import MainButton from '../component/atoms/MainButton';
import DismissKeyboard from '../component/molecules/DismissKeyboard';
import {STYLES} from '../styles/Stylesheets';
import {showErrorToast} from '../utils/utils';
import {AvoidSoftInput, AvoidSoftInputView} from 'react-native-avoid-softinput';

const AddScheduleScreen = () => {
  // states
  const [name, setName] = React.useState('');
  const [place, setPlace] = React.useState({});
  const [note, setNote] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [places, setPlaces] = React.useState([]);

  // hooks
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  const day = navigationState.routes.slice(-1)[0]?.params?.day;

  const [startAt, setStartAt] = React.useState(dayjs(day).format('YYYY-MM-DD HH:mm'));

  const tab = navigationState.routes[navigationState.routes.length - 2];
  const target = tab?.state?.routes[1];

  // functions
  const fetchPlaces = async () => {
    const res = await getLocations(currentSessionID);
    setPlaces(res);
  };

  const handleAdd = async () => {
    try {
      setLoading(true);
      // await createLocation(currentSessionID, place?.place_id);
      await createSchedule({
        session_id: currentSessionID,
        name,
        place_id: place?.place_id,
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
    return name.length === 0;
  }, [name]);

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
          <CustomHeader title="Add Schedule" theme={CUSTOM_HEADER_THEME.WHITE} useMenu={false} />
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
                    dayjs(day)
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
            icon={loading ? 'loading' : 'calendar-month'}
            text={loading ? 'Adding...' : 'Add Schedule'}
            onPress={handleAdd}
            disabled={addDisabled}
          />
        </View>
      </View>
    </SafeArea>
  );
};

export default AddScheduleScreen;

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
  addScheduleButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
});
