import {StyleSheet, View} from 'react-native';
import React from 'react';
import {CommonActions, useNavigation, useNavigationState} from '@react-navigation/native';
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

const AddScheduleScreen = () => {
  // states
  const [name, setName] = React.useState('');
  const [place, setPlace] = React.useState({});
  const [startAt, setStartAt] = React.useState(dayjs().format('YYYY-MM-DD HH:mm'));
  const [note, setNote] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // hooks
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  const day = navigationState.routes.slice(-1)[0]?.params?.day;

  const tab = navigationState.routes[navigationState.routes.length - 2];
  const target = tab?.state?.routes[1];

  // functions
  const handleAdd = async () => {
    try {
      setLoading(true);
      await createSchedule({
        session_id: currentSessionID,
        name,
        place_id: place?.place_id,
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

  console.log(place);

  // memo
  const addDisabled = React.useMemo(() => {
    return name.length === 0 || !place?.address;
  }, [name, place]);

  return (
    <SafeArea top={{style: {backgroundColor: 'white'}, barStyle: 'dark-content'}}>
      <DismissKeyboard>
        <View style={STYLES.FLEX(1)}>
          <CustomHeader title="Add Schedule" theme={CUSTOM_HEADER_THEME.WHITE} useMenu={false} />
          <View style={styles.container}>
            <View style={styles.contentContainer}>
              <CustomInput label={'Name'} value={name} setValue={setName} />
              <CustomInput label={'Address'} value={place} setValue={setPlace} type="place" />
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
                type="date"
              />
              <CustomInput label={'Note'} value={note} setValue={setNote} type={'multiline'} />
            </View>
            <MainButton
              icon={loading ? 'loading' : 'calendar-month'}
              text={loading ? 'Adding...' : 'Add Schedule'}
              onPress={handleAdd}
              disabled={addDisabled}
            />
          </View>
        </View>
      </DismissKeyboard>
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
    // marginTop: 20,
    // marginBottom: 20,
    // marginHorizontal: 20,
    backgroundColor: colors.primary,
  },
});
