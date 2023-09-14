import {FlatList, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {Header} from '@rneui/base';
import {
  acceptFriends,
  cancelFriends,
  deleteFriends,
  getFriends,
  getFriendsWaiting,
  rejectFriends,
} from '../services/api';
import {Avatar, FAB, IconButton, List} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';

const FriendsScreen = () => {
  // hooks
  const navigation = useNavigation();

  // states
  const [friends, setFriends] = React.useState([]);
  const [receivedFriendsRequest, setReceivedFriendsRequest] = React.useState([]);
  const [sentFriendsRequest, setSentFriendsRequest] = React.useState([]);

  // functions
  const onPressAdd = () => {
    navigation.navigate('AddFriends');
  };

  const fetchFriends = async () => {
    try {
      const data = await getFriends();
      setFriends(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFriendsWaiting = async () => {
    try {
      const data = await getFriendsWaiting();
      setReceivedFriendsRequest(data.received);
      setSentFriendsRequest(data.sent);
    } catch (err) {
      console.error(err);
    }
  };

  const acceptFriendRequest = async user_id => {
    try {
      const data = await acceptFriends(user_id);
    } catch (err) {
      console.error(err);
    }
  };

  const rejectFriendRequest = async user_id => {
    try {
      const data = await rejectFriends(user_id);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelFriendRequest = async user_id => {
    try {
      const data = await cancelFriends(user_id);
    } catch (err) {
      console.error(err);
    }
  };

  // effects
  React.useEffect(() => {
    fetchFriends();
    fetchFriendsWaiting();
  }, []);

  return (
    <SafeAreaView edges={['top, bottom']} style={defaultStyle.container}>
      <Header centerComponent={<Text style={defaultStyle.headerTitle}>Friends</Text>} />
      <View style={defaultStyle.container}>
        <Text>Friends Screen</Text>
        <FlatList
          data={friends}
          renderItem={({item}) => (
            <List.Item
              title={item.username}
              left={props => <Avatar.Image size={48} source={{uri: item.profile_image}} />}
              right={props => <List.Icon {...props} icon="delete" />}
            />
          )}
        />
        <Text>Received Friends Request</Text>
        <FlatList
          data={receivedFriendsRequest}
          renderItem={({item}) => (
            <List.Item
              title={item.username}
              left={props => <Avatar.Image size={48} source={{uri: item.profile_image}} />}
              right={props => (
                <View style={{flexDirection: 'row'}}>
                  <IconButton {...props} icon="check" />
                  <IconButton
                    {...props}
                    icon="delete"
                    onPress={() => rejectFriendRequest(item.user_id)}
                  />
                </View>
              )}
            />
          )}
        />
        <Text>Sent Friends Request</Text>
        <FlatList
          data={sentFriendsRequest}
          renderItem={({item}) => (
            <List.Item
              title={item.username}
              left={props => <Avatar.Image size={48} source={{uri: item.profile_image}} />}
              right={props => (
                <IconButton
                  {...props}
                  icon="delete"
                  onPress={() => cancelFriendRequest(item.user_id)}
                />
              )}
            />
          )}
        />
      </View>
      <FAB icon="plus" style={styles.fab} onPress={onPressAdd} />
    </SafeAreaView>
  );
};

export default FriendsScreen;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
