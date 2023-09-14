import {FlatList, StyleSheet, Text, View, Alert} from 'react-native';
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
  const [refresh, setRefresh] = React.useState(true);

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

  const requestAlert = async (title, description, okFunc) => {
    Alert.alert(title, description, [
      {
        text: 'Cancel',
        onPress: () => {},
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => okFunc(),
      },
    ]);
  };

  const deleteFriendConfirm = async user_id => {
    try {
      await deleteFriends(user_id);
      setRefresh(true);
    } catch (err) {
      console.error(err);
    }
  };

  const acceptFriendRequestConfirm = async user_id => {
    try {
      const data = await acceptFriends(user_id);
      setRefresh(true);
    } catch (err) {
      console.error(err);
    }
  };
  const rejectFriendRequestConfirm = async user_id => {
    try {
      const data = await rejectFriends(user_id);
      setRefresh(true);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelFriendRequestConfirm = async user_id => {
    try {
      const data = await cancelFriends(user_id);
      setRefresh(true);
    } catch (err) {
      console.error(err);
    }
  };

  // effects
  React.useEffect(() => {
    if (refresh) {
      setRefresh(false);
      fetchFriends();
      fetchFriendsWaiting();
    }
  }, [refresh]);

  return (
    <SafeAreaView edges={['top, bottom']} style={defaultStyle.container}>
      <Header centerComponent={<Text style={defaultStyle.headerTitle}>Friends</Text>} />
      <View style={styles.container}>
        <Text>Friends Screen</Text>
        <FlatList
          data={friends}
          renderItem={({item}) => (
            <List.Item
              title={item.username}
              left={props => <Avatar.Image size={48} source={{uri: item.profile_image}} />}
              right={props => (
                <IconButton
                  {...props}
                  icon="delete"
                  onPress={() =>
                    requestAlert(
                      'Delete Friend',
                      `Are you sure you want to delete ${item.username} as a friend?`,
                      () => deleteFriendConfirm(item.user_id),
                    )
                  }
                />
              )}
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
                  <IconButton
                    {...props}
                    icon="check"
                    onPress={() =>
                      requestAlert(
                        'Accept Friend Request',
                        `Are you sure you want to accept ${item.username}'s friend request?`,
                        () => acceptFriendRequestConfirm(item.user_id),
                      )
                    }
                  />
                  <IconButton
                    {...props}
                    icon="delete"
                    onPress={() =>
                      requestAlert(
                        'Reject Friend Request',
                        `Are you sure you want to reject ${item.username}'s friend request?`,
                        () => rejectFriendRequestConfirm(item.user_id),
                      )
                    }
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
                  onPress={() =>
                    requestAlert(
                      'Cancel Friend Request',
                      `Are you sure you want to cancel ${item.username}'s friend request?`,
                      () => cancelFriendRequestConfirm(item.user_id),
                    )
                  }
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
  container: {
    flex: 1,
    padding: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
