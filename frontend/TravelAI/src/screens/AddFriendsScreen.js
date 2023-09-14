import {StyleSheet, Text, View, FlatList, Pressable, Keyboard, Alert} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {Avatar, IconButton, List, Searchbar} from 'react-native-paper';
import {Header} from '@rneui/themed';
import {requestFriends, searchFriends} from '../services/api';
import {useNavigation, useRoute, useNavigationState, CommonActions} from '@react-navigation/native';

const AddFriendsScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const navigationState = useNavigationState(state => state);

  // states
  const [query, setQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);

  // functions
  const search = async () => {
    try {
      if (query.length === 0) {
        return;
      }
      const data = await searchFriends(query);
      setSearchResults(data);
    } catch (err) {
      console.error(err);
    }
  };

  const onPressAdd = item => {
    Alert.alert(
      'Add Friend',
      'Are you sure you want to add this friend?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            onPressOK(item.user_id);
          },
        },
      ],
      {cancelable: false},
    );
  };

  const onPressOK = async user_id => {
    try {
      const data = await requestFriends(user_id);
      const target = navigationState.routes[navigationState.routes.length - 2];
      navigation.dispatch({
        ...CommonActions.setParams({refresh: true}),
        source: target.key,
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Pressable onPress={Keyboard.dismiss} style={{flex: 1}}>
      <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
        <Header
          leftComponent={{icon: 'menu', onPress: () => {}}}
          centerComponent={<Text style={defaultStyle.headerTitle}>Add Friends</Text>}
        />
        <View style={styles.container}>
          <Searchbar value={query} onChangeText={setQuery} onIconPress={search} />
          <FlatList
            data={searchResults}
            renderItem={({item}) => (
              <List.Item
                title={item.username}
                description={item.user_code}
                left={props => (
                  <Avatar.Image size={48} {...props} source={{uri: item.profile_image}} />
                )}
                right={props => (
                  <IconButton {...props} icon="plus" onPress={() => onPressAdd(item)} />
                )}
              />
            )}
          />
        </View>
      </SafeAreaView>
    </Pressable>
  );
};

export default AddFriendsScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
