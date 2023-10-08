import {Keyboard, StyleSheet, View, TouchableWithoutFeedback} from 'react-native';
import React, {useEffect} from 'react';
import {IconButton} from 'react-native-paper';
import {CommonActions, useNavigation, useNavigationState} from '@react-navigation/native';
import colors from '../theme/colors';
import {createSchedule} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import CustomInput from '../component/molecules/CustomInput';
import dayjs from 'dayjs';
import MainButton from '../component/atoms/MainButton';

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

  // memo
  const addDisabled = React.useMemo(() => {
    return name.length === 0 || place?.address?.length === 0;
  }, [name, place]);

  return (
    <SafeArea top={{style: {backgroundColor: 'white'}, barStyle: 'dark-content'}}>
      <TouchableWithoutFeedback
        onPress={() => {
          if (Keyboard.isVisible) {
            Keyboard.dismiss();
          }
        }}>
        <View style={{flex: 1}}>
          <CustomHeader
            backgroundColor={colors.white}
            leftComponent={
              <IconButton
                mode="contained"
                icon="chevron-left"
                iconColor={colors.black}
                onPress={() => navigation.goBack()}
                size={18}
              />
            }
            title="Add Schedule"
            titleColor={colors.black}
            rightComponent={<></>}
          />
          <View style={styles.container}>
            <View style={styles.contentContainer}>
              <CustomInput label={'Name'} value={name} setValue={setName} />
              <CustomInput label={'Address'} value={place} setValue={setPlace} type="place" />
              <CustomInput label={'Date'} value={startAt} setValue={setStartAt} type="date" />
              <CustomInput label={'Note'} value={note} setValue={setNote} type={'multiline'} />
            </View>
            <MainButton
              text={loading ? 'Adding...' : 'Add'}
              onPress={handleAdd}
              disabled={addDisabled}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </SafeArea>
  );
};

export default AddScheduleScreen;

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
