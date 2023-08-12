import {StyleSheet, View, Pressable, Keyboard, FlatList, Touchable} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {Header as HeaderRNE} from '@rneui/themed';
import {useNavigation, useRoute, CommonActions, useNavigationState} from '@react-navigation/native';
import _ from 'lodash';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {createLocation, getLocations, locateAutoComplete, locateLocation} from '../services/api';
import {Searchbar, Text} from 'react-native-paper';
import reactotron from 'reactotron-react-native';

import SearchResultFlatList from '../component/organisms/SearchResultFlatList';
import PlaceImageCard from '../component/atoms/PlaceImageCard';
import {TouchableOpacity} from 'react-native-gesture-handler';

const AddAddressScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const navigationState = useNavigationState(state => state);
  const currentSessionID = useRecoilValue(sessionAtom);

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
      throw error.response.data;
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
      console.error(error);
      throw error.response.data;
    }
  };

  const onPressFooterItem = () => {
    navigation.navigate('AddCustomPlace');
  };

  // useEffect
  React.useEffect(() => {
    if (currentSessionID) {
      getPlacesFromServer().then(() => {});
    }
  }, [currentSessionID]);

  React.useEffect(() => {
    if (searchQuery.length > 0) {
      autoCompletePlace(searchQuery);
    } else {
      setSearchResult([]);
    }
  }, [searchQuery]);

  return (
    <Pressable onPress={Keyboard.dismiss} style={{flex: 1}}>
      <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
        <HeaderRNE
          backgroundColor="#fff"
          barStyle="dark-content"
          centerComponent={{text: 'Location', style: defaultStyle.heading}}
        />
        <View style={styles.container}>
          <Searchbar value={searchQuery} onChangeText={setSearchQuery} />
          {searchQuery.length > 0 ? (
            <SearchResultFlatList
              {...{isZeroResult, searchResult, onPressListItem, onPressFooterItem}}
            />
          ) : (
            <React.Fragment>
              <Text>Quick Select</Text>
              <FlatList
                contentContainerStyle={{paddingTop: 16}}
                data={places}
                numColumns={2}
                renderItem={({item}) => (
                  <TouchableOpacity onPress={() => onPressPlace(item)}>
                    <PlaceImageCard name={item.name} photo_reference={item.photo_reference} />
                  </TouchableOpacity>
                )}
              />
            </React.Fragment>
          )}
        </View>
      </SafeAreaView>
    </Pressable>
  );
};

export default AddAddressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
