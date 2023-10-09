import {Dimensions, FlatList, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import MapView, {Marker, PROVIDER_GOOGLE, Polyline} from 'react-native-maps';
import {useNavigation, useRoute, CommonActions} from '@react-navigation/native';
import {getSchedules, getSessions, locateDirection} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {Button, Card, IconButton} from 'react-native-paper';
import colors from '../theme/colors';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import {CalendarProvider, WeekCalendar} from 'react-native-calendars';
import reactotron from 'reactotron-react-native';
import dayjs from 'dayjs';
import {STYLES} from '../styles/Stylesheets';
import {Fonts} from '../theme';
import PlaceCard from '../component/atoms/PlaceCard';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DayButton = props => {
  const {day, onPress, selected} = props;

  return (
    <Button
      style={styles.dayBtn}
      // contentStyle={styles.dayBtnContent}
      // labelStyle={styles.dayBtnContent}
      buttonColor={selected ? colors.primary : colors.white}
      textColor={selected ? colors.white : colors.black}
      mode="elevated"
      onPress={onPress}>
      {`Day ${day + 1}`}
    </Button>
  );
};

const ScheduleScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  // states
  const [days, setDays] = React.useState([]);
  const [currentIndex, setCurrentIndex] = React.useState(-1);
  const [schedules, setSchedules] = React.useState([]);
  const [coords, setCoords] = React.useState([]); // [Place
  const [refreshing, setRefreshing] = React.useState(false);

  // memo
  const locations = React.useMemo(
    () =>
      schedules
        .filter(s => s.place_id !== null && s.place_id !== '')
        .map(s => ({
          name: s.name,
          address: s.address,
          place_id: s.place_id,
          latitude: s.latitude,
          longitude: s.longitude,
        })),
    [schedules],
  );

  const markers = React.useMemo(() => {
    return locations.map(location => {
      return {
        coordinate: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        title: location.name,
      };
    });
  }, [locations]);

  // refs
  const mapRef = React.useRef(null);

  // functions
  const onPressDay = day => {
    setCurrentIndex(day);
  };

  const handleAddingSchedule = () => {
    navigation.navigate('AddSchedule', {day: days[currentIndex - 1]});
  };

  const onPressScheduleCard = item => {
    navigation.navigate('EditSchedule', {schedule: item});
  };

  const fetchSessionsData = async () => {
    try {
      const res = await getSessions();
      const target = res.find(session => session.session_id === currentSessionID);
      const {start_at, end_at} = target;
      const startDate = new Date(start_at);
      const endDate = new Date(end_at);
      let tempDays = [];
      for (let i = startDate; i <= endDate; i.setDate(i.getDate() + 1)) {
        tempDays.push(new Date(i));
      }
      setDays(tempDays);
      setCurrentIndex(1);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlatformScheduleData = async () => {
    try {
      const data = await getSchedules(currentSessionID, currentIndex);
      setSchedules(data.sort((a, b) => a.start_at - b.start_at));
    } catch (err) {
      console.error(err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlatformScheduleData();
    setRefreshing(false);
  };

  // effects
  React.useEffect(() => {
    if (currentSessionID) {
      fetchSessionsData();
    }
  }, []);

  React.useEffect(() => {
    if (currentSessionID && currentIndex > 0) {
      fetchPlatformScheduleData(currentSessionID, currentIndex);
    }
  }, [currentSessionID, currentIndex]);

  React.useEffect(() => {
    if (locations.length > 1) {
      let promiseArr = [];
      for (let i = 0; i < locations.length - 1; i++) {
        const origin = locations[i].place_id;
        const destination = locations[i + 1].place_id;
        promiseArr.push(locateDirection(origin, destination));
      }
      Promise.all(promiseArr).then(res => {
        const newCoords = res.reduce((acc, cur) => {
          return [...acc, ...cur];
        }, []);
        setCoords(newCoords);
      });
    } else {
      setCoords([]);
    }
  }, [locations]);

  React.useEffect(() => {
    if (markers.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: markers[0].coordinate.latitude,
          longitude: markers[0].coordinate.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        },
        1000,
      );
    }

    if (markers.length > 1) {
      mapRef.current.fitToCoordinates(
        markers.map(marker => marker.coordinate),
        {
          edgePadding: {top: 50, right: 50, bottom: 50, left: 50},
          animated: true,
        },
      );
    }
  }, [markers]);

  React.useEffect(() => {
    if (route?.params?.refresh) {
      fetchPlatformScheduleData();
      navigation.dispatch({...CommonActions.setParams({refresh: false})});
    }
  }, [route?.params?.refresh]);

  return (
    <>
      <CustomHeader title={'SCHEDULE'} leftComponent={<React.Fragment />} />
      <FlatList
        ListHeaderComponent={
          <>
            <View
              style={[
                STYLES.ALIGN_CENTER,
                STYLES.FLEX_CENTER,
                STYLES.HEIGHT(64),
                {backgroundColor: colors.primary},
              ]}>
              <Text style={styles.title}>{`Day ${currentIndex}`}</Text>
              <Text style={[styles.dates, STYLES.MARGIN_TOP(4)]}>
                {currentSession.start_at} ~ {currentSession.end_at}
              </Text>
            </View>
            <View
              style={[
                STYLES.WIDTH_100,
                STYLES.MARGIN_TOP(4),
                STYLES.HEIGHT(48),
                {backgroundColor: 'green'},
              ]}>
              <CalendarProvider date={dayjs().format('YYYY-MM-DD')}>
                <WeekCalendar
                  testID={'containder'}
                  hideDayNames={true}
                  firstDay={1}
                  // allowShadow={false}
                  // markedDates={{
                  //   [currentSession.start_at]: {
                  //     startingDay: true,
                  //     endingDay: false,
                  //     color: colors.primary,
                  //     textColor: colors.white,
                  //   },
                  //   [currentSession.end_at]: {
                  //     endingDay: true,
                  //     color: colors.primary,
                  //     textColor: colors.white,
                  //   },
                  // }}
                />
              </CalendarProvider>
            </View>
            <View style={[STYLES.WIDTH_100, STYLES.HEIGHT(160), {backgroundColor: 'red'}]}>
              <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                  latitude: 37.5779,
                  longitude: 126.9768,
                  latitudeDelta: LATITUDE_DELTA,
                  longitudeDelta: LONGITUDE_DELTA,
                }}>
                {markers.map((marker, index) => (
                  <Marker
                    key={'marker-' + index}
                    coordinate={marker.coordinate ?? {latitude: 0, longitude: 0}}
                    title={marker.title}>
                    <View style={styles.marker}>
                      <Text style={styles.markerText}>{index + 1}</Text>
                    </View>
                  </Marker>
                ))}
                {coords.length > 0 && (
                  <Polyline coordinates={coords} strokeWidth={4} strokeColor={colors.primary} />
                )}
              </MapView>
            </View>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.flatList}
              contentContainerStyle={styles.dayFlatListContent}
              data={days}
              renderItem={({item, index}) => (
                <DayButton
                  day={index}
                  onPress={() => onPressDay(index + 1)}
                  selected={index === currentIndex - 1}
                />
              )}
              ItemSeparatorComponent={<View style={[STYLES.WIDTH(10)]} />}
              keyExtractor={item => item.toString()}
            />
          </>
        }
        style={{flex: 1, backgroundColor: colors.primary}}
        contentContainerStyle={{flex: 1, backgroundColor: colors.white}}
        data={schedules}
        renderItem={({item, index}) => (
          <PlaceCard
            item={item}
            onPress={onPressScheduleCard}
            isLast={schedules.length - 1 === index}
          />
        )}
        keyExtractor={item => item?.schedule_id?.toString()}
        ListFooterComponent={
          <View style={[STYLES.ALIGN_CENTER, STYLES.PADDING_LEFT(50), STYLES.HEIGHT(80)]}>
            <IconButton
              icon={'plus-circle'}
              iconColor={colors.primary}
              size={40}
              onPress={handleAddingSchedule}
            />
          </View>
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </>
  );
};

export default ScheduleScreen;

const styles = StyleSheet.create({
  dayBtn: {
    // paddingVertical: 6,
    // paddingHorizontal: 16,
  },
  dayBtnContent: {
    margin: 0,
    padding: 0,
    ...Fonts.SemiBold(11),
    backgroundColor: 'red',
    // borderRadius: 0,
  },
  container: {
    height: 300,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  marker: {
    backgroundColor: '#550bbc',
    padding: 5,
    borderRadius: 5,
  },
  markerText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  flatList: {
    flexGrow: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  dates: {
    fontSize: 15,
    color: colors.white,
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.black,
  },
  dayFlatListContent: {
    padding: 10,
  },
  daySeperator: {
    width: 10,
  },
  addScheduleBtn: {
    marginVertical: 10,
    marginLeft: 52,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 32,
    marginLeft: 22,
    borderLeftWidth: 1,
    borderLeftColor: '#808080',
    paddingBottom: 10,
  },
  circle: {
    position: 'absolute',
    top: '50%',
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  itemTimeText: {
    position: 'absolute',
    top: '20%',
    left: -15,
    fontSize: 12,
    backgroundColor: colors.white,
  },
});
