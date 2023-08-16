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

const today = new Date();
const todayString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

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
      const index = navigationState.routes.findIndex(r => r.name === 'Main');
      navigation.dispatch({
        ...CommonActions.setParams({refresh: true}),
        source: navigationState.routes[index].key,
      });
      setCurrentSession({
        session_id: res,
      });
      navigation.pop(2);
      navigation.navigate('Tab');
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
      <Header
        backgroundColor="#fff"
        barStyle="dark-content"
        leftComponent={
          <IconButton
            mode="contained"
            icon="chevron-left"
            iconColor="#000"
            onPress={() => navigation.goBack()}
          />
        }
        centerComponent={{text: 'Choose the date', style: defaultStyle.heading}}
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
      <Button
        style={styles.createBtn}
        contentStyle={styles.createBtnContent}
        mode="contained"
        onPress={onPressCreate}
        disabled={!firstDate && !lastDate}
        loading={loading}>
        {loading ? 'Creating...' : 'Create'}
      </Button>
    </SafeAreaView>
  );
};

export default AddDateScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
