import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CalendarList} from 'react-native-calendars';
import defaultStyle from '../styles/styles';
import {CommonActions, useNavigation, useNavigationState, useRoute} from '@react-navigation/native';
import {createSession} from '../services/api';
import {useSetRecoilState} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {Button, IconButton} from 'react-native-paper';
import {Header} from '@rneui/themed';
import colors from '../theme/colors';
import reactotron from 'reactotron-react-native';
import CustomHeader from '../component/molecules/CustomHeader';
import SafeArea from '../component/molecules/SafeArea';
import MainButton from '../component/atoms/MainButton';

const today = new Date();
const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

const colorStyle = {color: colors.primary, textColor: colors.white};

const AddDateScreen = () => {
  // states
  const [firstDate, setFirstDate] = React.useState(null);
  const [lastDate, setLastDate] = React.useState(null);
  const [marked, setMarked] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const navigationState = useNavigationState(state => state);
  const setCurrentSession = useSetRecoilState(sessionAtom);

  // functions
  const onDayPress = day => {
    if (firstDate && !lastDate) {
      if (day.dateString < firstDate) {
        setFirstDate(day.dateString);
        setLastDate(firstDate);
      } else {
        setLastDate(day.dateString);
      }
    } else {
      setFirstDate(day.dateString);
      setLastDate(null);
    }
  };

  const onPressCreate = async () => {
    try {
      setLoading(true);
      const res = await createSession(route.params.countries, firstDate, lastDate ?? firstDate);
      const target = navigationState.routes[navigationState.routes.length - 3];
      navigation.dispatch({
        ...CommonActions.setParams({refresh: true}),
        source: target.key,
      });
      navigation.pop(2);
      navigation.navigate('Tab');
      setCurrentSession({
        session_id: res,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // effects
  React.useEffect(() => {
    let temp_marked = {};
    if (firstDate) {
      temp_marked = {
        [firstDate]: {
          startingDay: true,
          endingDay: !lastDate,
          ...colorStyle,
        },
      };
    }
    if (lastDate) {
      if (lastDate === firstDate) {
        temp_marked = {
          [lastDate]: {
            startingDay: true,
            endingDay: true,
            color: colors.primary,
            textColor: colors.white,
          },
        };
      } else {
        temp_marked = {
          ...temp_marked,
          [lastDate]: {endingDay: true, ...colorStyle},
        };
      }
    }
    if (firstDate && lastDate) {
      const range = {start: firstDate, end: lastDate};
      const date = new Date(range.start);
      date.setDate(date.getDate() + 1);
      while (date < new Date(range.end)) {
        temp_marked = {
          ...temp_marked,
          [date.toISOString().slice(0, 10)]: {...colorStyle},
        };
        date.setDate(date.getDate() + 1);
      }
    }
    setMarked(temp_marked);
  }, [firstDate, lastDate]);

  reactotron.log(marked);

  // rendering
  return (
    <SafeArea top={{style: {backgroundColor: 'white'}, barStyle: 'dark-content'}}>
      <CustomHeader
        backgroundColor={'white'}
        leftComponent={
          <IconButton
            mode="contained"
            icon="chevron-left"
            iconColor="#000"
            size={18}
            onPress={() => navigation.goBack()}
          />
        }
        title="Choose the date"
        titleColor="black"
        rightComponent={<></>}
      />
      <View style={styles.container}>
        <Text style={styles.description}>Choose the date you want to add to your travel.</Text>
        <CalendarList
          pastScrollRange={0}
          futureScrollRange={12}
          scrollEnabled={true}
          showScrollIndicator={true}
          minDate={todayString}
          markingType="period"
          markedDates={marked}
          onDayPress={onDayPress}
        />
      </View>
      <View style={{padding: 10}}>
        <MainButton
          text={loading ? 'Creating...' : 'Create'}
          disabled={!firstDate && !lastDate}
          onPress={onPressCreate}
        />
      </View>
    </SafeArea>
  );
};

export default AddDateScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  description: {
    paddingHorizontal: 80,
    fontSize: 15,
    textAlign: 'center',
    color: '#808080',
    marginBottom: 10,
  },
  createBtn: {
    borderRadius: 5,
    margin: 10,
  },
  createBtnContent: {
    height: 50,
  },
});
