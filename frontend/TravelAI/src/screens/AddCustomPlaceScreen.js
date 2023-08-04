import {Dimensions, Keyboard, StyleSheet, Text, TouchableWithoutFeedback, View} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {Header as HeaderRNE, Button} from '@rneui/themed';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {useNavigation, CommonActions, useNavigationState} from '@react-navigation/native';
import {createLocation, locateDetail, locatePin} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const AddCustomPlaceScreen = () => {
  // hooks
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);
  const currentSessionID = useRecoilValue(sessionAtom);

  // states
  const [marker, setMarker] = React.useState({
    coordinate: {
      latitude: 37.5779,
      longitude: 126.9768,
    },
  });
  const [place, setPlace] = React.useState(null);

  // memos
  const locationInfo = React.useMemo(() => {
    if (!place) {
      return '';
    } else if (place.name !== '') {
      return place.name;
    }
    return place.address;
  }, [place]);

  // functions
  const onPressAddPlace = async () => {
    try {
      const result = await locateDetail(place.place_id);
      await createLocation(currentSessionID, result.place_id);
      const targetRoute = navigationState.routes[navigationState.routes.length - 3];
      const placeScreenRoute = targetRoute?.state ? targetRoute.state.routes[1] : targetRoute;
      navigation.dispatch({
        ...CommonActions.setParams({place: result}),
        source: placeScreenRoute.key,
      });
      navigation.pop(2);
    } catch (err) {
      console.error(err);
    }
  };

  // effects
  React.useEffect(() => {
    if (marker && marker.coordinate) {
      locatePin(marker.coordinate.latitude, marker.coordinate.longitude).then(result => {
        setPlace(result[0]);
      });
    }
  }, [marker]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
        <HeaderRNE />
        <Text style={styles.addressText}>{locationInfo ?? ''}</Text>
        <View style={defaultStyle.container}>
          <View style={styles.container}>
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={{
                latitude: 37.5779,
                longitude: 126.9768,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
              }}
              onRegionChangeComplete={region => {
                setMarker({
                  coordinate: {
                    latitude: region.latitude,
                    longitude: region.longitude,
                  },
                });
              }}>
              {marker && marker.coordinate && <Marker coordinate={marker?.coordinate} />}
            </MapView>
          </View>
          <Button title="Add" onPress={onPressAddPlace} />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default AddCustomPlaceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  addressText: {
    padding: 10,
    fontSize: 16,
    color: '#000',
  },
});
