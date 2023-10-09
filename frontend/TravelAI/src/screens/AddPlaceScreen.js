import React from 'react';
import {StyleSheet, Keyboard, TouchableWithoutFeedback, View} from 'react-native';
import {CommonActions, useNavigation, useRoute} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {createLocation, locateAutoComplete, locateLocation} from '../services/api';
import sessionAtom from '../recoil/session/session';
import {useRecoilValue} from 'recoil';
import SearchResultFlatList from '../component/organisms/SearchResultFlatList';
import {
  ActivityIndicator,
  FAB,
  IconButton,
  Modal,
  Portal,
  Searchbar,
  Snackbar,
} from 'react-native-paper';
import {Header} from '@rneui/themed';
import reactotron from 'reactotron-react-native';
import colors from '../theme/colors';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader, {CUSTOM_HEADER_THEME} from '../component/molecules/CustomHeader';
import {STYLES} from '../styles/Stylesheets';

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
  const [loadingModalVisible, setLoadingModalVisible] = React.useState(false); // loading modal visible 여부

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
      setLoadingModalVisible(true);
      Keyboard.dismiss();

      const place = await locateLocation(item.place_id);
      const {place_id} = place;
      await createLocation(currentSessionID, place_id);

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
    } finally {
      setLoadingModalVisible(false);
    }
  };

  const navigateToAddCustomPlace = () => {
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

  console.log(searchResult);

  return (
    <SafeArea
      top={{style: {backgroundColor: colors.white}, barStyle: 'dark-content'}}
      bottom={{inactive: true}}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={defaultStyle.container}>
        <View style={[STYLES.FLEX(1)]}>
          <CustomHeader title={'Add Place'} theme={CUSTOM_HEADER_THEME.WHITE} useMenu={false} />
          <View style={styles.container}>
            <Searchbar
              value={searchKeyword}
              onChangeText={setSearchKeyword}
              placeholder="Search a place"
              placeholderTextColor={colors.gray}
              onClear={() => {
                setSearchKeyword('');
              }}
              style={styles.searchBar}
            />
            <SearchResultFlatList {...{isZeroResult, searchResult, onPressListItem}} />
          </View>
          <FAB
            style={styles.addCustomPlaceButton}
            icon="map"
            label="Add Custom Place"
            color={colors.white}
            onPress={navigateToAddCustomPlace}
          />
          <Portal>
            <Modal visible={loadingModalVisible} dismissable={false}>
              <ActivityIndicator animating={true} size="large" />
            </Modal>
          </Portal>
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
        </View>
      </TouchableWithoutFeedback>
    </SafeArea>
  );
};

export default AddPlaceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  searchBar: {
    borderRadius: 16,
    backgroundColor: colors.searchBar,
    marginBottom: 10,
  },
  addCustomPlaceButton: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 20,
    backgroundColor: colors.primary,
  },
});
