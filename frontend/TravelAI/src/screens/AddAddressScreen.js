import {StyleSheet, View, Pressable, Keyboard, FlatList} from 'react-native';
import React, {useMemo} from 'react';
import {useNavigation, CommonActions, useNavigationState} from '@react-navigation/native';
import _ from 'lodash';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {getLocations, locateAutoComplete, locateLocation} from '../services/api';
import {Searchbar, Text} from 'react-native-paper';
import SearchResultFlatList from '../component/organisms/SearchResultFlatList';
import PlaceImageCard from '../component/atoms/PlaceImageCard';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {STYLES} from '../styles/Stylesheets';
import SafeArea from '../component/molecules/SafeArea';
import {SemiBold} from './../theme/fonts';
import colors from '../theme/colors';
import CustomHeader, {CUSTOM_HEADER_THEME} from '../component/molecules/CustomHeader';
import {showErrorToast} from '../utils/utils';

const AddAddressScreen = () => {
  // hooks
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);
  const currentSession = useRecoilValue(sessionAtom);

  const currentSessionID = useMemo(() => currentSession?.session_id, [currentSession]);

  // states
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResult, setSearchResult] = React.useState([]);
  const [isZeroResult, setIsZeroResult] = React.useState(false);
  const [places, setPlaces] = React.useState([]);

  // functions
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

  const getPlacesFromServer = React.useCallback(async () => {
    const res = await getLocations(currentSessionID);
    setPlaces(res);
  }, [currentSessionID]);

  const onPressPlace = React.useCallback(
    place => {
      const addScheuleScreen = navigationState.routes[navigationState.routes.length - 2];
      navigation.dispatch({
        ...CommonActions.setParams({place: place}),
        source: addScheuleScreen.key,
      });
      navigation.goBack();
    },
    [navigation],
  );

  const onPressListItem = async item => {
    try {
      Keyboard.dismiss();

      const place = await locateLocation(item.place_id);

      const addScheuleScreen = navigationState.routes[navigationState.routes.length - 2];
      navigation.dispatch({
        ...CommonActions.setParams({place: place}),
        source: addScheuleScreen.key,
      });
      navigation.goBack();
    } catch (error) {
      showErrorToast(error);
    }
  };

  const onPressFooterItem = () => {
    navigation.navigate('AddCustomPlace');
  };

  // useEffect
  React.useEffect(() => {
    if (currentSession) {
      getPlacesFromServer().then(() => {});
    }
  }, [currentSession]);

  React.useEffect(() => {
    if (searchQuery.length > 0) {
      autoCompletePlace(searchQuery);
    } else {
      setSearchResult([]);
    }
  }, [searchQuery]);

  return (
    <Pressable onPress={Keyboard.dismiss} style={STYLES.FLEX(1)}>
      <SafeArea
        top={{style: {backgroundColor: colors.white}, barStyle: 'dark-content'}}
        bottom={{inactive: true}}>
        <CustomHeader title={'Select address'} theme={CUSTOM_HEADER_THEME.WHITE} useMenu={false} />
        <View style={styles.container}>
          <Searchbar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search address"
            placeholderTextColor={colors.gray}
            style={styles.searchBar}
          />
          <FlatList
            style={{flex: 1}}
            ListHeaderComponent={() => (
              <React.Fragment>
                {searchQuery.length > 0 && (
                  <SearchResultFlatList
                    {...{isZeroResult, searchResult, onPressListItem, onPressFooterItem}}
                  />
                )}
                <Text style={styles.label}>Registerd Places</Text>
              </React.Fragment>
            )}
            contentContainerStyle={{paddingTop: 16}}
            data={places.filter(place =>
              place.name.toLowerCase().includes(searchQuery.toLowerCase()),
            )}
            numColumns={2}
            renderItem={({item}) => (
              <TouchableOpacity onPress={() => onPressPlace(item)}>
                <PlaceImageCard name={item.name} photo_reference={item.photo_reference} />
              </TouchableOpacity>
            )}
          />
        </View>
      </SafeArea>
    </Pressable>
  );
};

export default AddAddressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  label: {
    marginTop: 20,
    marginBottom: 10,
    ...SemiBold(16),
  },
  searchBar: {
    borderRadius: 16,
    backgroundColor: colors.searchBar,
    marginBottom: 10,
  },
});
