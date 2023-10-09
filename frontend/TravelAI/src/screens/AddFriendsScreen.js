import {
  StyleSheet,
  TextInput,
  View,
  FlatList,
  Pressable,
  Keyboard,
  Alert,
  Image,
  Text,
} from 'react-native';
import React from 'react';
import {ActivityIndicator, Avatar, IconButton, List} from 'react-native-paper';
import {requestFriends, searchFriends} from '../services/api';
import {useNavigation, useNavigationState, CommonActions} from '@react-navigation/native';
import {STYLES} from '../styles/Stylesheets';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import colors from '../theme/colors';
import {Icon} from '@rneui/themed';
import {searchIcon} from '../assets/images';
import {showErrorToast, showSuccessToast} from '../utils/utils';

const AddFriendListItem = ({item, onPress}) => {
  return (
    <List.Item
      title={item.username}
      description={item.user_code}
      titleNumberOfLines={1}
      descriptionNumberOfLines={1}
      left={props => <Avatar.Image size={48} {...props} source={{uri: item.profile_image}} />}
      right={({color, style}) => (
        <IconButton
          style={{...style, transform: [{translateX: 10}]}}
          color={color}
          icon="plus"
          onPress={() => onPress(item)}
        />
      )}
    />
  );
};

const AddFriendListEmptyComponent = ({isResult}) => {
  return (
    <View style={[STYLES.FLEX_CENTER, STYLES.HEIGHT(150)]}>
      {isResult ? <Text>No results found</Text> : <Text>Search for your friends</Text>}
    </View>
  );
};

const AddFriendsScreen = () => {
  // hooks
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);

  // states
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isResult, setIsResult] = React.useState(false);

  // functions
  const search = async () => {
    try {
      if (query.length === 0) {
        return;
      }
      setIsSearching(true);
      const data = await searchFriends(query);
      setSearchResults(data);
      setIsResult(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const onPressAdd = item => {
    Alert.alert(
      'Add Friend',
      `Are you sure you want to add ${item.username}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => await onPressOK(item.user_id),
        },
      ],
      {cancelable: false},
    );
  };

  const onPressOK = async user_id => {
    try {
      await requestFriends(user_id);
      const target = navigationState.routes[navigationState.routes.length - 2];
      navigation.dispatch({
        ...CommonActions.setParams({refresh: true}),
        source: target.key,
      });
      showSuccessToast('Friend request sent');
    } catch (err) {
      showErrorToast(err);
    }
  };

  const onPressClear = () => {
    setQuery('');
    setSearchResults([]);
    setIsResult(false);
  };

  return (
    <Pressable onPress={Keyboard.dismiss} style={STYLES.FLEX(1)}>
      <SafeArea>
        <CustomHeader title="Add Friends" rightComponent={<React.Fragment />} />
        <View style={styles.container}>
          <View style={styles.searchBarWrapper}>
            <Image source={searchIcon} style={styles.searchIcon} />
            <TextInput
              style={[STYLES.FLEX(1), {color: colors.black}]}
              placeholder="Search"
              onChangeText={setQuery}
              value={query}
              returnKeyType="search"
              onSubmitEditing={search}
            />
            {query.length > 0 &&
              (isSearching ? (
                <View style={STYLES.PADDING(5)}>
                  <ActivityIndicator size={14} color="gray" />
                </View>
              ) : (
                <Pressable style={STYLES.PADDING(5)} onPress={onPressClear}>
                  <Icon name="close" size={14} color="gray" />
                </Pressable>
              ))}
          </View>
          <FlatList
            data={searchResults}
            renderItem={({item}) => <AddFriendListItem item={item} onPress={onPressAdd} />}
            ListEmptyComponent={<AddFriendListEmptyComponent isResult={isResult} />}
          />
        </View>
      </SafeArea>
    </Pressable>
  );
};

export default AddFriendsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 8,
  },
  searchBarWrapper: {
    ...STYLES.FLEX_ROW_ALIGN_CENTER,
    backgroundColor: colors.searchBar,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
});
