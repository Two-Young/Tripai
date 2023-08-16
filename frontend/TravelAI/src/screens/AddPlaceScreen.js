import React from 'react';
import {StyleSheet, Keyboard, TouchableWithoutFeedback, View} from 'react-native';
import {CommonActions, useNavigation, useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {createLocation, locateAutoComplete, locateLocation} from '../services/api';
import sessionAtom from '../recoil/session/session';
import {useRecoilValue} from 'recoil';
import SearchResultFlatList from '../component/organisms/SearchResultFlatList';
import {IconButton, Portal, Searchbar, Snackbar} from 'react-native-paper';
import {Header} from '@rneui/themed';
import reactotron from 'reactotron-react-native';

const AddPlaceScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = currentSession?.session_id;

  // states
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [searchResult, setSearchResult] = React.useState([]);
  const [isZeroResult, setIsZeroResult] = React.useState(false);
  const [dupSnackBarVisible, setDupSnackbarVisible] = React.useState(false); // snackbar visible 여부

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

  const onPressListItem = async item => {
    try {
      Keyboard.dismiss();

      const place = await locateLocation(item.place_id);
      const {place_id} = place;
      await createLocation(currentSessionID, place_id);

      reactotron.log('route.params', route.params);

      /* */
      navigation.dispatch({
        ...CommonActions.setParams({place: place}),
        source: route.params?.routeKey,
      });
      navigation.goBack();
    } catch (error) {
      if (error?.response?.status === 409) {
        setDupSnackbarVisible(true);
        return;
      }
      throw error;
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
        <Header
          backgroundColor="#fff"
          barStyle="dark-content"
          leftComponent={
            <IconButton
              mode="contained"
              icon="chevron-left"
              iconColor="#000"
              onPress={() => navigation.goBack()}
            />
          }
          centerComponent={{text: 'Add Place', style: defaultStyle.heading}}
        />
        <View style={styles.container}>
          <Searchbar
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
        </View>
        <Portal>
          <Snackbar
            visible={dupSnackBarVisible}
            onDismiss={() => setDupSnackbarVisible(false)}
            action={{
              label: 'Close',
            }}>
            Place is already added.
          </Snackbar>
        </Portal>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default AddPlaceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
  },
});
