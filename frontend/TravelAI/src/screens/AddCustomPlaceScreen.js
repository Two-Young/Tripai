import {Dimensions, Keyboard, StyleSheet, Text, TextInput, View} from 'react-native';
import React, {useMemo} from 'react';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {useNavigation, CommonActions, useNavigationState} from '@react-navigation/native';
import {
  createLocation,
  locateAutoComplete,
  locateDetail,
  locateLocation,
  locatePin,
} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import colors from '../theme/colors';
import CustomHeader, {CUSTOM_HEADER_THEME} from '../component/molecules/CustomHeader';
import SafeArea from '../component/molecules/SafeArea';
import {STYLES} from '../styles/Stylesheets';
import {FAB, IconButton, Searchbar} from 'react-native-paper';
import DismissKeyboard from '../component/molecules/DismissKeyboard';
import {showErrorToast} from '../utils/utils';
import SearchResultFlatList from '../component/organisms/SearchResultFlatList';
import SelectDropdown from 'react-native-select-dropdown';

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
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [searchResult, setSearchResult] = React.useState([]);
  const [isZeroResult, setIsZeroResult] = React.useState(false);
  const [dupSnackBarVisible, setDupSnackbarVisible] = React.useState(false); // snackbar visible 여부
  const [loadingModalVisible, setLoadingModalVisible] = React.useState(false); // loading modal visible 여부

  const [marker, setMarker] = React.useState(null);

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
      showErrorToast(err);
    }
  };

  const onPressListItem = async item => {
    try {
      setLoadingModalVisible(true);
      Keyboard.dismiss();
      const res = await locateLocation(item.place_id);
      setMarker({
        coordinate: {
          latitude: res.latitude,
          longitude: res.longitude,
        },
      });
      setPlace(res);
      if (marker && marker.coordinate) {
        mapRef.current.animateToRegion({
          latitude: res.latitude,
          longitude: res.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        });
      }
    } catch (error) {
      if (error?.response?.status === 409) {
        setDupSnackbarVisible(true);
        return;
      }
      throw error;
    } finally {
      setLoadingModalVisible(false);
      setSearchKeyword('');
    }
  };

  const autoCompletePlace = async keyword => {
    try {
      const res = await locateAutoComplete(keyword);
      setSearchResult(res);
      setIsZeroResult(false);
    } catch (error) {
      setSearchResult([]);
      setIsZeroResult(true);
      throw error;
    }
  };

  const onEndEditing = async () => {
    if (searchKeyword.length > 0) {
      autoCompletePlace(searchKeyword);
    } else {
      setSearchResult([]);
    }
  };

  // effects
  React.useEffect(() => {
    if (searchKeyword.length > 0) {
      autoCompletePlace(searchKeyword);
    } else {
      setSearchResult([]);
    }
  }, [searchKeyword]);

  React.useEffect(() => {
    if (marker && marker.coordinate && needSearch) {
      locatePin(marker.coordinate.latitude, marker.coordinate.longitude).then(result => {
        setPlace(result[0]);
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

  return (
    <SafeArea
      top={{style: {backgroundColor: colors.white}, barStyle: 'dark-content'}}
      bottom={{inactive: true}}>
      <DismissKeyboard>
        <CustomHeader title="Add Custom Place" theme={CUSTOM_HEADER_THEME.WHITE} useMenu={false} />
      </DismissKeyboard>
      <View style={styles.container}>
        <View style={styles.locationSearchRow}>
          <DismissKeyboard>
            <Searchbar
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              placeholder="Search a place"
              placeholderTextColor={colors.gray}
              onClear={() => {
                setSearchKeyword('');
              }}
              onEndEditing={onEndEditing}
              style={styles.searchBar}
            />
          </DismissKeyboard>
          <View style={styles.placeSearchResultContainer}>
            <SearchResultFlatList {...{isZeroResult, searchResult, onPressListItem}} />
          </View>
        </View>
        {marker ? (
          <>
            <View style={STYLES.FLEX(1)}>
              <DismissKeyboard>
                <Text style={styles.addressText}>{locationInfo}</Text>
              </DismissKeyboard>
              <View style={STYLES.FLEX(1)}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  onPress={() => Keyboard.dismiss()}
                  initialRegion={{
                    latitude: marker.coordinate.latitude,
                    longitude: marker.coordinate.longitude,
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
          </>
        ) : (
          <View style={STYLES.FLEX(1)}>
            <Text style={styles.description}>
              Search a place and tap the marker to add a custom place.
            </Text>
          </View>
        )}
      </View>
    </SafeArea>
  );
};

export default AddCustomPlaceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  locationSearchRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  labelText: {
    fontSize: 14,
    color: colors.gray_text,
    marginBottom: 1,
  },
  searchBar: {
    borderRadius: 16,
    backgroundColor: colors.searchBar,
    marginBottom: 10,
  },
  description: {
    paddingTop: 80,
    paddingHorizontal: 40,
    fontSize: 15,
    textAlign: 'center',
    color: '#808080',
    marginBottom: 10,
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
  placeSearchResultContainer: {
    position: 'absolute',
    top: 70,
    left: 20,
    width: '100%',
    backgroundColor: colors.white,
    zIndex: 100,
  },
});
