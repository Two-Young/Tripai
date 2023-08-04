import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CalendarList} from 'react-native-calendars';
import {Button} from '@rneui/themed';
import defaultStyle from '../styles/styles';
import {CommonActions, useNavigation, useNavigationState, useRoute} from '@react-navigation/native';
import {createSession} from '../services/api';
import {useSetRecoilState} from 'recoil';
import sessionAtom from '../recoil/session/session';
import reactotron from 'reactotron-react-native';

const today = new Date();
const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

const AddDateScreen = () => {
  // states
  const [firstDate, setFirstDate] = React.useState(null);
  const [lastDate, setLastDate] = React.useState(null);
  const [marked, setMarked] = React.useState(null);

  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const navigationState = useNavigationState(state => state);
  const setCurrentSessionID = useSetRecoilState(sessionAtom);

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

  const onPressNext = React.useCallback(async () => {
    const res = await createSession(route.params.countries, firstDate, lastDate ?? firstDate);
    const index = navigationState.routes.findIndex(r => r.name === 'Main');
    navigation.dispatch({
      ...CommonActions.setParams({refresh: true}),
      source: navigationState.routes[index].key,
    });
    navigation.pop(2);
    navigation.navigate('Tab');
    setCurrentSessionID(res);
  }, [
    firstDate,
    lastDate,
    route.params?.countries,
    navigationState.routes,
    navigation,
    setCurrentSessionID,
  ]);

  // effects
  React.useEffect(() => {
    let temp_marked = {};
    if (firstDate) {
      temp_marked = {
        [firstDate]: {
          startingDay: true,
          color: '#1A73E8',
          textColor: 'white',
          endingDay: !lastDate,
        },
      };
    }
    if (lastDate) {
      if (lastDate === firstDate) {
        temp_marked = {
          [lastDate]: {
            startingDay: true,
            endingDay: true,
            color: '#1A73E8',
            textColor: 'white',
          },
        };
      } else {
        temp_marked = {
          ...temp_marked,
          [lastDate]: {endingDay: true, color: '#1A73E8', textColor: 'white'},
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
          [date.toISOString().slice(0, 10)]: {color: '#1A73E8', textColor: 'white'},
        };
        date.setDate(date.getDate() + 1);
      }
    }
    setMarked(temp_marked);
  }, [firstDate, lastDate]);

  // rendering
  return (
    <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
      <View style={[styles.container, {paddingBottom: 12}]}>
        <Text>Choose the date you want to add to your travel.</Text>
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
      <View style={{padding: 12}}>
        <Button
          onPress={onPressNext}
          title="Create"
          disabled={!firstDate && !lastDate}
          buttonStyle={defaultStyle.button}
          titleStyle={defaultStyle.buttonContent}
        />
      </View>
    </SafeAreaView>
  );
};

export default AddDateScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
