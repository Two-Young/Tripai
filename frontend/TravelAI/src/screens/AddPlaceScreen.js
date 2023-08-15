import React from 'react';
import {StyleSheet, Keyboard, TouchableWithoutFeedback, FlatList} from 'react-native';
import {SearchBar} from '@rneui/themed';
import {CommonActions, useNavigation, useNavigationState} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {createLocation, locateAutoComplete, locateLocation} from '../services/api';
import sessionAtom from '../recoil/session/session';
import {useRecoilValue} from 'recoil';
import reactotron from 'reactotron-react-native';
import SearchResultFlatList from '../component/organisms/SearchResultFlatList';

const AddPlaceScreen = () => {
  // hooks
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = currentSession?.session_id;

  // states
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [searchResult, setSearchResult] = React.useState([]);
  const [isZeroResult, setIsZeroResult] = React.useState(false);

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

  const onPressListItem = async item => {
    try {
      Keyboard.dismiss();

      const place = await locateLocation(item.place_id);
      const {place_id} = place;
      await createLocation(currentSessionID, place_id);

      /* */
      reactotron.log('navigationState', navigationState.routes[navigationState.routes.length - 2]);
      const tabNavigation = navigationState.routes[navigationState.routes.length - 2].state;
      const placeScreenRoute = tabNavigation.routes[1];
      navigation.dispatch({
        ...CommonActions.setParams({place: place}),
        source: placeScreenRoute.key,
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

  // effects
  React.useEffect(() => {
    if (searchKeyword.length > 0) {
      autoCompletePlace(searchKeyword);
    } else {
      setSearchResult([]);
    }
  }, [searchKeyword]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={defaultStyle.container}>
      <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
        <SearchBar
          value={searchKeyword}
          onChangeText={setSearchKeyword}
          placeholder="Search"
          placeholderTextColor={'#888'}
          onClear={() => {
            setSearchKeyword('');
          }}
        />
        <SearchResultFlatList
          {...{isZeroResult, searchResult, onPressListItem, onPressFooterItem}}
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default AddPlaceScreen;

const styles = StyleSheet.create({});
