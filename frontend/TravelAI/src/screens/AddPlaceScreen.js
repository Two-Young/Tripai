import React from 'react';
import {StyleSheet, Keyboard, TouchableWithoutFeedback, FlatList} from 'react-native';
import {Icon, SearchBar} from '@rneui/themed';
import {ListItem} from '@rneui/base';
import {CommonActions, useNavigation, useNavigationState} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {createLocation, locateAutoComplete, locateLocation} from '../services/api';
import PropTypes from 'prop-types';
import sessionAtom from '../recoil/session/session';
import {useRecoilValue} from 'recoil';
import reactotron from 'reactotron-react-native';

const SearchResultItemList = props => {
  const {item, onPress} = props;
  return (
    <ListItem bottomDivider onPress={onPress}>
      <ListItem.Content>
        <ListItem.Title>{item.description}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  );
};

SearchResultItemList.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
};

const SearchResultFooterItem = props => {
  const {onPress} = props;
  return (
    <ListItem bottomDivider onPress={onPress}>
      <ListItem.Content>
        <ListItem.Title>Add Custom Place</ListItem.Title>
        <ListItem.Subtitle>Enter the address manually</ListItem.Subtitle>
      </ListItem.Content>
      <Icon name="add" />
    </ListItem>
  );
};

SearchResultFooterItem.propTypes = {
  onPress: PropTypes.func,
};

const AddPlaceScreen = () => {
  // hooks
  const navigation = useNavigation();
  const currentSessionId = useRecoilValue(sessionAtom);
  const navigationState = useNavigationState(state => state);

  // states
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [searchResult, setSearchResult] = React.useState([]);
  const [isZeroResult, setIsZeroResult] = React.useState(false);

  // functions
  const autoCompleteGooglePlace = async keyword => {
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
      await createLocation(currentSessionId, place_id);

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
      autoCompleteGooglePlace(searchKeyword);
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
        <FlatList
          style={{flex: 1}}
          data={isZeroResult ? [] : searchResult}
          renderItem={({item}) => (
            <SearchResultItemList item={item} onPress={() => onPressListItem(item)} />
          )}
          ListFooterComponent={
            searchResult.length > 0 && <SearchResultFooterItem onPress={onPressFooterItem} />
          }
        />
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default AddPlaceScreen;

const styles = StyleSheet.create({});
