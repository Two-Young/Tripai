import {Dimensions, StyleSheet, Text, TextInput, View} from 'react-native';
import React, {useMemo} from 'react';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {useNavigation, CommonActions, useNavigationState} from '@react-navigation/native';
import {createLocation, locateDetail, locatePin} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import colors from '../theme/colors';
import CustomHeader, {CUSTOM_HEADER_THEME} from '../component/molecules/CustomHeader';
import SafeArea from '../component/molecules/SafeArea';
import {STYLES} from '../styles/Stylesheets';
import {FAB, IconButton} from 'react-native-paper';
import DismissKeyboard from '../component/molecules/DismissKeyboard';

const {width, height} = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const FIXED = 4;

const AddCustomPlaceScreen = () => {
  // hooks
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);
  const currentSession = useRecoilValue(sessionAtom);

  const currentSessionID = useMemo(() => currentSession?.session_id, [currentSession]);

  // states
  const [marker, setMarker] = React.useState({
    coordinate: {
      latitude: 37.5779,
      longitude: 126.9768,
    },
  });

  const [latitude, setLatitude] = React.useState('0');
  const [longitude, setLongitude] = React.useState('0');
  const [place, setPlace] = React.useState(null);
  const [needSearch, setNeedSearch] = React.useState(true);
  const [needAnimation, setNeedAnimation] = React.useState(false);

  // refs
  const mapRef = React.useRef(null);

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
  const onPressSearch = async () => {
    try {
      const result = await locatePin(latitude * 1, longitude * 1);
      setPlace(result[0]);
      setMarker({
        coordinate: {
          latitude: result[0].latitude,
          longitude: result[0].longitude,
        },
      });
      setNeedAnimation(true);
    } catch (err) {
      console.error(err);
    }
  };

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
    if (marker && marker.coordinate && needSearch) {
      locatePin(marker.coordinate.latitude, marker.coordinate.longitude).then(result => {
        setPlace(result[0]);
        setLatitude(result[0].latitude?.toFixed(FIXED).toString());
        setLongitude(result[0].longitude?.toFixed(FIXED).toString());
      });
      setNeedSearch(false);
    }
  }, [marker, needSearch]);

  React.useEffect(() => {
    if (needAnimation) {
      mapRef.current.animateToRegion({
        latitude: place.latitude,
        longitude: place.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });
      setNeedAnimation(false);
    }
  }, [needAnimation]);

  React.useEffect(() => {
    if (place) {
      setLatitude(place.latitude?.toFixed(FIXED).toString());
      setLongitude(place.longitude?.toFixed(FIXED).toString());
    }
  }, [place]);

  return (
    <DismissKeyboard>
      <SafeArea
        top={{style: {backgroundColor: colors.white}, barStyle: 'dark-content'}}
        bottom={{inactive: true}}>
        <CustomHeader title="Add Custom Place" theme={CUSTOM_HEADER_THEME.WHITE} useMenu={false} />
        <View style={styles.locationSearchRow}>
          <View style={styles.locationSearchBarContainer}>
            <Text style={styles.labelText}>latitude</Text>
            <TextInput
              style={styles.locationSearchBar}
              value={latitude}
              keyboardType="numeric"
              onChangeText={setLatitude}
            />
          </View>
          <View style={styles.locationSearchBarContainer}>
            <Text style={styles.labelText}>longitude</Text>
            <TextInput
              style={styles.locationSearchBar}
              value={longitude}
              keyboardType="numeric"
              onChangeText={setLongitude}
            />
          </View>
          <IconButton icon="search-web" mode="contained" onPress={onPressSearch} />
        </View>
        <Text style={styles.addressText}>{locationInfo ?? ''}</Text>
        <View style={STYLES.FLEX(1)}>
          <View style={STYLES.FLEX(1)}>
            <MapView
              ref={mapRef}
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
                setNeedSearch(true);
              }}>
              {marker && marker.coordinate && <Marker coordinate={marker?.coordinate} />}
            </MapView>
          </View>
          <View style={styles.addCustomPlaceButtonContainer}>
            <FAB
              style={styles.addCustomPlaceButton}
              icon={'map-marker-plus'}
              label="Add Place"
              color={colors.white}
              onPress={onPressAddPlace}
            />
          </View>
        </View>
      </SafeArea>
    </DismissKeyboard>
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
  locationSearchRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'flex-end',
  },
  locationSearchBarContainer: {
    flex: 1,
    backgroundColor: colors.white,
    marginRight: 10,
    paddingVertical: 5,
  },
  labelText: {
    fontSize: 14,
    color: colors.gray_text,
    marginBottom: 1,
  },
  locationSearchBar: {
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    fontSize: 16,
    color: colors.black,
    borderWidth: 1,
    paddingVertical: 2,
  },
  addressText: {
    padding: 10,
    fontSize: 16,
    color: colors.black,
  },
  addCustomPlaceButtonContainer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    paddingBottom: 20,
  },
  addCustomPlaceButton: {
    alignItems: 'stretch',
    marginHorizontal: 20,
    backgroundColor: colors.primary,
  },
});
