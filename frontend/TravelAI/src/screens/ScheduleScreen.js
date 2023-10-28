import {Dimensions, FlatList, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import MapView, {Marker, PROVIDER_GOOGLE, Polyline} from 'react-native-maps';
import {useNavigation, useRoute, CommonActions} from '@react-navigation/native';
import {getSchedules, locateDirection} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {IconButton} from 'react-native-paper';
import colors from '../theme/colors';
import CustomHeader from '../component/molecules/CustomHeader';
import {CalendarProvider, WeekCalendar} from 'react-native-calendars';
import dayjs from 'dayjs';
import {STYLES} from '../styles/Stylesheets';
import {Fonts} from '../theme';
import PlaceCard from '../component/atoms/PlaceCard';
import {Medium, Light} from '../theme/fonts';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const ScheduleScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  // states
  const [currentIndex, setCurrentIndex] = React.useState(1);
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
    navigation.navigate('AddSchedule', {day: days[currentIndex - 1].toString()});
  };

  const onPressScheduleCard = item => {
    console.log(item);
    navigation.navigate('EditSchedule', {schedule: item});
  };

  const days = React.useMemo(() => {
    let result = [];
    let day = dayjs(currentSession.start_at);
    while (day.isBefore(dayjs(currentSession.end_at))) {
      result.push(new Date(day));
      day = day.add(1, 'day');
    }
    result.push(new Date(day));
    return result;
  }, [currentSession]);

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

  const markedDates = React.useMemo(() => {
    let markedDates = {};
    let day = dayjs(currentSession.start_at);
    let isFirst = true;
    let index = 1;
    while (day.isBefore(dayjs(currentSession.end_at))) {
      markedDates[day.format('YYYY-MM-DD')] = {
        startingDay: isFirst,
        endingDay: false,
        color: currentIndex === index ? colors.primary : colors.secondary,
        textColor: colors.white,
      };
      isFirst = false;
      day = day.add(1, 'day');
      index++;
      continue;
    }
    markedDates[currentSession.end_at] = {
      endingDay: true,
      color: currentIndex === index ? colors.primary : colors.secondary,
      textColor: colors.white,
    };
    return markedDates;
  }, [schedules, currentIndex]);

  const nextScheduleIndex = React.useMemo(() => {
    let result = 0;
    for (let i = 0; i < schedules.length; i++) {
      if (dayjs(schedules[i].start_at).isAfter(dayjs())) {
        break;
      }
      result = i;
    }
    return result;
  }, [schedules]);

  return (
    <View style={[STYLES.FLEX(1), {backgroundColor: colors.white}]}>
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
              <Text style={styles.title}>{currentSession.name}</Text>
              <Text style={[styles.dates, STYLES.MARGIN_TOP(4)]}>
                {currentSession.start_at} ~ {currentSession.end_at}
              </Text>
            </View>
            <View style={[STYLES.WIDTH_100, STYLES.HEIGHT(80), {backgroundColor: 'green'}]}>
              <CalendarProvider date={dayjs().format('YYYY-MM-DD')}>
                <WeekCalendar
                  testID={'containder'}
                  hideDayNames={false}
                  initialDate={dayjs(currentSession.start_at).format('YYYY-MM-DD')}
                  minDate={dayjs(currentSession.start_at).format('YYYY-MM-DD')}
                  maxDate={dayjs(currentSession.end_at).format('YYYY-MM-DD')}
                  onDayPress={date => {
                    console.log(date);
                    const newIndex = dayjs(date.dateString).diff(
                      dayjs(currentSession.start_at),
                      'day',
                    );
                    console.log(newIndex);
                    if (newIndex < 0) return;
                    if (newIndex >= days.length) return;
                    setCurrentIndex(newIndex + 1);
                  }}
                  markingType="period"
                  markedDates={markedDates}
                />
              </CalendarProvider>
            </View>
            <View style={[STYLES.WIDTH_100, STYLES.HEIGHT(160), {backgroundColor: colors.red}]}>
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
            <View style={[STYLES.PADDING(20)]}>
              <Text style={styles.dayTitle}>
                {`Day ${currentIndex}   `}
                <Text style={[styles.daySubtitle, STYLES.MARGIN_LEFT(10)]}>
                  {dayjs(currentSession.start_at)
                    .add(currentIndex - 1, 'day')
                    .format('M. D. ddd')}
                </Text>
              </Text>
            </View>
          </>
        }
        style={{backgroundColor: colors.white}}
        data={schedules}
        renderItem={({item, index}) => (
          <PlaceCard
            item={item}
            onPress={onPressScheduleCard}
            isFirst={0 === index}
            isLast={schedules.length - 1 === index}
            isNext={nextScheduleIndex === index}
          />
        )}
        keyExtractor={item => item?.schedule_id?.toString()}
        ListFooterComponent={
          <View style={[STYLES.ALIGN_CENTER, STYLES.HEIGHT(80)]}>
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
    </View>
  );
};

export default ScheduleScreen;

const styles = StyleSheet.create({
  dayBtn: {},
  dayBtnContent: {
    margin: 0,
    padding: 0,
    ...Fonts.SemiBold(11),
    backgroundColor: colors.red,
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
    ...Medium(18),
    color: colors.black,
  },
  daySubtitle: {
    marginLeft: 10,
    ...Light(14),
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
