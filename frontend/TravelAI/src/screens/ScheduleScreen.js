import {Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import MapView, {Marker, PROVIDER_GOOGLE, Polyline} from 'react-native-maps';
import {useNavigation, useRoute} from '@react-navigation/native';
import defaultStyle from './../styles/styles';
import {Button, Header as HeaderRNE} from '@rneui/themed';
import DraggableFlatList from 'react-native-draggable-flatlist';
import {getSchedules, getSessions, locateDirection} from '../services/api';
import {ListItem} from '@rneui/base';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DayButton = props => {
  const {day, onPress} = props;

  return (
    <Button
      containerStyle={{marginHorizontal: 5}}
      type="outline"
      size="sm"
      title={`Day ${day + 1}`}
      onPress={onPress}
    />
  );
};

const PlaceCard = props => {
  const {place, onPressDelete} = props;

  return (
    <ListItem>
      <ListItem.Content>
        <ListItem.Title>{place.name}</ListItem.Title>
        <ListItem.Subtitle>{place.address}</ListItem.Subtitle>
      </ListItem.Content>
      <Button title="delete" size="sm" type="clear" onPress={onPressDelete} />
    </ListItem>
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
  const [currentDay, setCurrentDay] = React.useState(-1);
  const [schedules, setSchedules] = React.useState([]);
  const [locations, setLocations] = React.useState([]);
  const [coords, setCoords] = React.useState([]); // [Place

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
    setCurrentDay(days);
  };

  const handleAddingSchedule = React.useCallback(() => {
    navigation.navigate('AddSchedule', {day: days[currentDay - 1]});
  }, [navigation, currentDay, route, days]);

  const fetchSessionsData = React.useCallback(async () => {
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
      setCurrentDay(1);
    } catch (err) {
      console.error(err);
    }
  }, [currentSessionID, setDays, getSessions]);

  const fetchPlatformScheduleData = React.useCallback(async () => {
    try {
      const res = await getSchedules(currentSessionID, currentDay);
      const {data} = res;
    } catch (err) {
      console.error(err);
    }
  }, [currentSessionID, currentDay]);

  // effects
  React.useEffect(() => {
    if (currentSessionID) {
      fetchSessionsData();
    }
  }, []);

  React.useEffect(() => {
    if (route.params?.place && route.params?.day) {
      const {place, day} = route.params;
      setLocations(prev => [...prev, place]);
    }
  }, [route.params]);

  React.useEffect(() => {
    if (currentSessionID && currentDay > 0) {
      fetchPlatformScheduleData(currentSessionID, currentDay);
    }
  }, [currentSessionID, currentDay]);

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

  return (
    <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
      <HeaderRNE
        backgroundColor="#fff"
        barStyle="dark-content"
        rightComponent={{
          icon: 'menu',
          color: '#000',
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
              <Polyline coordinates={coords} strokeWidth={4} strokeColor="red" />
            )}
          </MapView>
        </View>
        <FlatList
          style={{flexGrow: 0, marginVertical: 10}}
          containerStyle={{flex: 1}}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={days}
          renderItem={({item, index}) => (
            <DayButton day={index} onPress={() => onPressDay(index + 1)} />
          )}
          keyExtractor={item => item.toString()}
        />
        <Text>Day {currentDay}</Text>
        <DraggableFlatList
          style={{flex: 1}}
          containerStyle={{flex: 1}}
          data={locations}
          renderItem={({item, index, drag, isActive}) => (
            <TouchableOpacity onLongPress={drag}>
              <PlaceCard
                place={item}
                onPressDelete={() =>
                  setLocations(prev => {
                    const newLocations = [...prev];
                    newLocations.splice(index + 1, 1);
                    return newLocations;
                  })
                }
              />
            </TouchableOpacity>
          )}
          onDragEnd={({data}) => setLocations(data)}
          keyExtractor={(item, index) => `draggable-item-${index}`}
          ListFooterComponent={
            <Button
              title="Add Schedule"
              onPress={handleAddingSchedule}
              containerStyle={{margin: 10}}
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default ScheduleScreen;

const styles = StyleSheet.create({
  container: {
    height: 400,
    width: 400,
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
    color: '#fff',
    fontWeight: 'bold',
  },
});
