import {Dimensions, FlatList, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import MapView, {Marker, PROVIDER_GOOGLE, Polyline} from 'react-native-maps';
import {useNavigation, useRoute, CommonActions} from '@react-navigation/native';
import defaultStyle from './../styles/styles';
import {Header} from '@rneui/themed';
import {getSchedules, getSessions, locateDirection} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {Button, Card, IconButton} from 'react-native-paper';
import colors from '../theme/colors';
import {DateTime} from 'luxon';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DayButton = props => {
  const {day, onPress, selected} = props;

  return (
    <Button
      style={styles.dayBtn}
      contentStyle={styles.dayBtnContent}
      buttonColor={selected ? colors.primary : colors.white}
      textColor={selected ? colors.white : colors.black}
      mode="elevated"
      onPress={onPress}>
      {`Day ${day + 1}`}
    </Button>
  );
};

const RightContent = props => <IconButton icon="chevron-right" iconColor="#000" />;

const PlaceCard = ({item, onPress}) => {
  const {start_at} = item;

  const time = React.useMemo(() => {
    const date = new Date(start_at);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}`;
  }, [start_at]);

  const subTitle = React.useMemo(() => {
    const {address, memo} = item;
    if (address.length > 0 && memo.length > 0) {
      return `${address} | ${memo}`;
    } else if (address.length > 0) {
      return address;
    } else if (memo.length > 0) {
      return memo;
    } else {
      return '';
    }
  }, [item]);

  return (
    <View style={styles.item}>
      <View style={styles.circle} />
      <Text style={styles.itemTimeText}>{time}</Text>
      <Card style={{flex: 1}} right={RightContent} onPress={() => onPress(item)}>
        <Card.Title
          title={item?.name}
          subtitle={subTitle}
          subtitleStyle={{}}
          right={RightContent}
        />
      </Card>
    </View>
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
    <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
      <Header
        backgroundColor="#fff"
        barStyle="dark-content"
        rightComponent={{
          icon: 'menu',
          color: colors.black,
        }}
        centerComponent={{text: 'Schedule', style: defaultStyle.heading}}
      />
      <View style={defaultStyle.container}>
        <View style={styles.container}>
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
          ItemSeparatorComponent={<DaySeperator />}
          keyExtractor={item => item.toString()}
        />
        <View style={{paddingHorizontal: 10}}>
          {/*<Text style={styles.dayTitle}>Day {currentIndex}</Text>*/}
          <Text />
        </View>
        <FlatList
          style={{flex: 1}}
          contentContainerStyle={{paddingHorizontal: 10}}
          data={schedules}
          // data={locations}
          renderItem={({item}) => <PlaceCard item={item} onPress={onPressScheduleCard} />}
          keyExtractor={item => item?.schedule_id?.toString()}
          ListFooterComponent={
            <Button
              mode="elevated"
              style={styles.addScheduleBtn}
              textColor={colors.black}
              onPress={handleAddingSchedule}>
              Add Schedule
            </Button>
          }
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>
    </SafeAreaView>
  );
};

const DaySeperator = () => {
  return <View style={styles.daySeperator} />;
};

export default ScheduleScreen;

const styles = StyleSheet.create({
  dayBtn: {},
  dayBtnContent: {
    fontSize: 11,
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
