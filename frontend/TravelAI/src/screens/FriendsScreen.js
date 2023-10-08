import {FlatList, StyleSheet, View} from 'react-native';
import React from 'react';
import {
  acceptFriends,
  cancelFriends,
  deleteFriends,
  getFriends,
  getFriendsWaiting,
  rejectFriends,
} from '../services/api';
import {Avatar, FAB, IconButton, List} from 'react-native-paper';
import {useNavigation, useRoute, useNavigationState, CommonActions} from '@react-navigation/native';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import {STYLES} from '../styles/Stylesheets';
import colors from '../theme/colors';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {requestAlert, showErrorToast, showSuccessToast} from '../utils/utils';
import EmptyComponent from '../component/atoms/EmptyComponent';
import {useFocusEffect} from '@react-navigation/native';

const FriendsTab = createMaterialTopTabNavigator();

const FriendsTabNavigator = () => {
  return (
    <FriendsTab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: {backgroundColor: colors.primary},
        tabBarLabelStyle: {fontWeight: 'bold'},
        tabBarStyle: {backgroundColor: colors.white},
      }}>
      <FriendsTab.Screen name="Friends" component={Friends} />
      <FriendsTab.Screen name="Received" component={Received} />
      <FriendsTab.Screen name="Sent" component={Sent} />
    </FriendsTab.Navigator>
  );
};

const Friends = () => {
  const route = useRoute();

  // states
  const [friends, setFriends] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(true);

  const fetchFriends = async () => {
    try {
      const data = await getFriends();
      setFriends(data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteFriendConfirm = async user_id => {
    try {
      await deleteFriends(user_id);
      showSuccessToast('Friend deleted');
      setFriends(friends.filter(item => item.user_id !== user_id));
    } catch (err) {
      console.error(err);
    }
  };

  // effects

  React.useEffect(() => {
    if (route.params?.refresh) {
      setRefreshing(true);
    }
  }, [route.params?.refresh]);

  React.useEffect(() => {
    if (refreshing) {
      fetchFriends().finally(() => {
        setRefreshing(false);
      });
    }
  }, [refreshing]);

  return (
    <FlatList
      style={styles.container}
      data={friends}
      keyExtractor={item => item.user_id.toString()}
      refreshing={refreshing}
      onRefresh={() => setRefreshing(true)}
      renderItem={({item}) => (
        <List.Item
          style={STYLES.PADDING_LEFT(30)}
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
      ListEmptyComponent={<EmptyComponent text="You have no friends yet" />}
    />
  );
};

const Received = () => {
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);

  // states
  const [requests, setRequests] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(true);

  // functions
  const fetchFriendsWaiting = async () => {
    try {
      const data = await getFriendsWaiting();
      setRequests(data.received);
    } catch (err) {
      console.error(err);
    }
  };

  const acceptFriendRequestConfirm = async user_id => {
    try {
      await acceptFriends(user_id);
      setRequests(requests.filter(item => item.user_id !== user_id));
      showSuccessToast('Friend request accepted');
      navigation.dispatch({
        ...CommonActions.setParams({
          refresh: true,
        }),
        source: navigationState.routes[0].key,
      });
    } catch (err) {
      showErrorToast(err);
    }
  };

  const rejectFriendRequestConfirm = async user_id => {
    try {
      await rejectFriends(user_id);
      setRequests(requests.filter(item => item.user_id !== user_id));
      showSuccessToast('Friend request rejected');
      navigation.dispatch({
        ...CommonActions.setParams({
          refresh: true,
        }),
        source: navigationState.routes[0].key,
      });
    } catch (err) {
      showErrorToast(err);
    }
  };

  // effects
  React.useEffect(() => {
    if (refreshing) {
      fetchFriendsWaiting().finally(() => {
        setRefreshing(false);
      });
    }
  }, [refreshing]);

  return (
    <FlatList
      style={styles.container}
      data={requests}
      refreshing={refreshing}
      onRefresh={() => setRefreshing(true)}
      renderItem={({item}) => (
        <List.Item
          title={item.username}
          left={props => <Avatar.Image size={48} source={{uri: item.profile_image}} />}
          right={props => (
            <View style={STYLES.FLEX_ROW}>
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
      ListEmptyComponent={<EmptyComponent text="You have no received friend requests yet" />}
    />
  );
};

const Sent = () => {
  // hooks
  const route = useRoute();

  // states
  const [requests, setRequests] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(true);

  const fetchFriendsWaiting = async () => {
    try {
      const data = await getFriendsWaiting();
      setRequests(data.sent);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelFriendRequestConfirm = async user_id => {
    try {
      await cancelFriends(user_id);
      showSuccessToast('Friend request cancelled');
      setRequests(requests.filter(item => item.user_id !== user_id));
    } catch (err) {
      showErrorToast(err);
    }
  };

  // effects
  useFocusEffect(
    React.useCallback(() => {
      setRefreshing(true);
    }, []),
  );

  React.useEffect(() => {
    if (refreshing) {
      fetchFriendsWaiting().finally(() => {
        setRefreshing(false);
      });
    }
  }, [refreshing]);

  return (
    <FlatList
      style={styles.container}
      data={requests}
      refreshing={refreshing}
      onRefresh={() => setRefreshing(true)}
      renderItem={({item}) => (
        <List.Item
          refreshing={refreshing}
          style={STYLES.PADDING_LEFT(15)}
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
      ListEmptyComponent={<EmptyComponent text="You have no sent friend requests yet" />}
    />
  );
};

const FriendsScreen = () => {
  // hooks
  const navigation = useNavigation();

  // functions
  const onPressAdd = () => {
    navigation.navigate('AddFriends');
  };

  return (
    <SafeArea>
      <CustomHeader title="Friends" rightComponent={<React.Fragment />} />
      <FriendsTabNavigator />
      <FAB icon="plus" style={styles.fab} color={colors.white} onPress={onPressAdd} />
    </SafeArea>
  );
};

export default FriendsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  tabButton: {
    ...STYLES.FLEX(1),
    ...STYLES.FLEX_CENTER,
    ...STYLES.HEIGHT(40),
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selected: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },

  selectedText: {
    color: colors.primary,
  },
  fab: {
    position: 'absolute',
    margin: 10,
    right: 0,
    bottom: 10,
    backgroundColor: colors.primary,
  },
});
