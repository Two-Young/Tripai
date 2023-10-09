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
import {FAB, IconButton} from 'react-native-paper';
import {useNavigation, useRoute, useNavigationState, CommonActions} from '@react-navigation/native';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import {STYLES} from '../styles/Stylesheets';
import colors from '../theme/colors';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {requestAlert, showErrorToast, showSuccessToast} from '../utils/utils';
import EmptyComponent from '../component/atoms/EmptyComponent';
import UserItem from '../component/molecules/UserItem';

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
      showErrorToast(err);
    }
  };

  const deleteFriendConfirm = async user_id => {
    try {
      await deleteFriends(user_id);
      showSuccessToast('Friend deleted');
      setFriends(friends.filter(item => item.user_id !== user_id));
    } catch (err) {
      showErrorToast(err);
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
      contentContainerStyle={[STYLES.PADDING_HORIZONTAL(20), STYLES.PADDING_TOP(10)]}
      data={friends}
      keyExtractor={item => item.user_id.toString()}
      refreshing={refreshing}
      onRefresh={() => setRefreshing(true)}
      renderItem={({item}) => (
        <UserItem
          user={item}
          rightComponent={user => (
            <IconButton
              icon="account-minus"
              iconColor={colors.red}
              onPress={() =>
                requestAlert(
                  'Delete Friend',
                  `Are you sure you want to delete ${user.username} as a friend?`,
                  () => deleteFriendConfirm(user.user_id),
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
      contentContainerStyle={[STYLES.PADDING_HORIZONTAL(20), STYLES.PADDING_TOP(10)]}
      data={requests}
      refreshing={refreshing}
      onRefresh={() => setRefreshing(true)}
      renderItem={({item}) => <UserItem user={item} rightComponent={receivedUserRightComponent} />}
      ListEmptyComponent={<EmptyComponent text="You have no received friend requests yet" />}
    />
  );
};

const receivedUserRightComponent = user => {
  const navigation = useNavigation();
  const navigationState = useNavigationState(state => state);

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

  return (
    <View style={[STYLES.FLEX_ROW]}>
      <IconButton
        icon="check"
        iconColor={colors.primary}
        onPress={() =>
          requestAlert(
            'Accept Friend Request',
            `Are you sure you want to accept ${user.username}'s friend request?`,
            () => acceptFriendRequestConfirm(user.user_id),
          )
        }
      />
      <IconButton
        icon="close"
        iconColor={colors.red}
        onPress={() =>
          requestAlert(
            'Reject Friend Request',
            `Are you sure you want to reject ${user.username}'s friend request?`,
            () => rejectFriendRequestConfirm(user.user_id),
          )
        }
      />
    </View>
  );
};

const Sent = () => {
  // hooks
  const {refreshing: shouldRefresh, setRefreshing: setShouldRefresh} =
    React.useContext(RefreshContext);

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
  React.useEffect(() => {
    if (shouldRefresh) {
      fetchFriendsWaiting();
      setShouldRefresh(false);
    }
  }, [shouldRefresh]);

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
      contentContainerStyle={[STYLES.PADDING_HORIZONTAL(20), STYLES.PADDING_TOP(10)]}
      data={requests}
      refreshing={refreshing}
      onRefresh={() => setRefreshing(true)}
      renderItem={({item}) => (
        <UserItem
          user={item}
          rightComponent={user => (
            <IconButton
              icon="close"
              iconColor={colors.red}
              onPress={() =>
                requestAlert(
                  'Cancel Friend Request',
                  `Are you sure you want to cancel ${user.username}'s friend request?`,
                  () => cancelFriendRequestConfirm(user.user_id),
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

const RefreshContext = React.createContext({
  refreshing: false,
  setRefreshing: () => {},
});

const FriendsScreen = () => {
  // state
  const [refreshing, setRefreshing] = React.useState(false);

  // hooks
  const navigation = useNavigation();
  const route = useRoute();

  // functions
  const onPressAdd = () => {
    navigation.navigate('AddFriends');
  };

  // effects
  React.useEffect(() => {
    if (route.params?.refresh) {
      setRefreshing(true);
      navigation.setParams({refresh: false});
    }
  }, [route.params?.refresh]);

  return (
    <SafeArea>
      <RefreshContext.Provider value={{refreshing, setRefreshing}}>
        <CustomHeader title="Friends" rightComponent={<React.Fragment />} />
        <FriendsTabNavigator />
        <FAB icon="plus" style={styles.fab} color={colors.white} onPress={onPressAdd} />
      </RefreshContext.Provider>
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
