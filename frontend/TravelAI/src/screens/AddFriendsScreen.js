import {StyleSheet, View, FlatList, Pressable, Keyboard, Alert, Text} from 'react-native';
import React, {useEffect} from 'react';
import {Avatar, IconButton, List, Searchbar} from 'react-native-paper';
import {requestFriends, searchFriends} from '../services/api';
import {STYLES} from '../styles/Stylesheets';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import colors from '../theme/colors';
import {showErrorToast, showSuccessToast} from '../utils/utils';
import {useRecoilState} from 'recoil';
import {sentFriendsAtom} from '../recoil/friends/friends';
import {getFriendsWaiting} from '../services/api';

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
  // states
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isResult, setIsResult] = React.useState(false);

  // recoil
  const [sentFriends, setSentFriends] = useRecoilState(sentFriendsAtom);

  // functions
  const fetchFriendsWaiting = async () => {
    try {
      const data = await getFriendsWaiting();
      setSentFriends(data.sent);
    } catch (err) {
      console.error(err);
    }
  };

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
      await fetchFriendsWaiting();
      showSuccessToast('Friend request sent');
    } catch (err) {
      showErrorToast(err);
    }
  };

  // effects

  useEffect(() => {
    if (query.length >= 2) {
      search();
    } else {
      setSearchResults([]);
    }
  }, [query]);

  useEffect(() => {
    fetchFriendsWaiting();
  }, []);

  return (
    <Pressable onPress={Keyboard.dismiss} style={STYLES.FLEX(1)}>
      <SafeArea>
        <CustomHeader title="Add Friends" rightComponent={<React.Fragment />} />
        <View style={styles.container}>
          <Searchbar
            placeholder="Search user name"
            onChangeText={setQuery}
            value={query}
            placeholderTextColor={colors.gray}
            onClear={() => {
              setQuery('');
            }}
            onBlur={search}
            style={styles.searchBar}
          />
          <FlatList
            data={searchResults.filter(
              item => !sentFriends.map(item => item.user_id).includes(item.user_id),
            )}
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
  searchBar: {
    borderRadius: 16,
    backgroundColor: colors.searchBar,
    marginBottom: 10,
  },
});
