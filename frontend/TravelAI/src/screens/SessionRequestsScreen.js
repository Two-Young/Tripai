import {StyleSheet, View, FlatList, TextInput, Keyboard, Pressable, Image} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import {
  cancelSessionJoinRequest,
  confirmSessionInvitation,
  getSessionInvitationRequests,
  getSessionJoinWaitings,
  joinSession,
} from '../services/api';
import {IconButton, List} from 'react-native-paper';
import {STYLES} from '../styles/Stylesheets';
import colors from '../theme/colors';
import CustomHeader from '../component/molecules/CustomHeader';
import {showErrorToast, showSuccessToast} from '../utils/utils';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {socket} from '../services/socket';
import DismissKeyboard from '../component/molecules/DismissKeyboard';

const MyRequestTab = createMaterialTopTabNavigator();

const MyRequestTabNavigator = ({refreshing, setRefreshing}) => {
  return (
    <MyRequestTab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: {backgroundColor: colors.primary},
        tabBarLabelStyle: {fontWeight: 'bold'},
        tabBarStyle: {backgroundColor: colors.white},
      }}>
      <MyRequestTab.Screen name="My Request" component={MyRequest} />
      <MyRequestTab.Screen name="My Invitation" component={MyInvitation} />
    </MyRequestTab.Navigator>
  );
};

const MyRequest = () => {
  // contexts
  const {refreshing: shouldRefresh, setRefreshing: setShouldRefresh} =
    React.useContext(RefreshContext);
  // state
  const [request, setRequest] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(true);

  // functions
  const fetchRequest = async () => {
    try {
      const res = await getSessionJoinWaitings();
      setRequest(res);
    } catch (err) {
      showErrorToast(err);
    }
  };

  const onCancelRequest = async sessionID => {
    try {
      await cancelSessionJoinRequest(sessionID);
      setRequest(request.filter(item => item.session_id !== sessionID));
      showSuccessToast('Request cancelled');
    } catch (err) {
      showErrorToast(err);
    }
  };

  // effects
  React.useEffect(() => {
    if (shouldRefresh) {
      fetchRequest();
      setShouldRefresh(false);
    }
  }, [shouldRefresh]);

  React.useEffect(() => {
    if (refreshing) {
      fetchRequest();
      setRefreshing(false);
    }
  }, [refreshing]);

  React.useEffect(() => {
    if (socket?.connected) {
      socket.on('session/memberJoined', fetchRequest);
    }
    return () => {
      if (socket) {
        socket.off('session/memberJoined', fetchRequest);
      }
    };
  }, [socket?.connected]);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[STYLES.PADDING_HORIZONTAL(20), STYLES.PADDING_TOP(10)]}
      data={request}
      refreshing={refreshing}
      onRefresh={() => setRefreshing(true)}
      renderItem={({item}) => (
        <List.Item
          style={STYLES.PADDING_RIGHT(0)}
          title={item.session_name}
          description={item.session_code}
          left={() => <Image style={{width: 48, height: 48}} source={{uri: item.thumbnail_url}} />}
          right={props => (
            <IconButton
              icon="close"
              iconColor={colors.red}
              onPress={() => onCancelRequest(item?.session_id)}
            />
          )}
        />
      )}
    />
  );
};

const MyInvitation = () => {
  // state
  const [invited, setInvited] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(true);

  // functions
  const fetchInvited = async () => {
    try {
      const res = await getSessionInvitationRequests();
      setInvited(res);
    } catch (err) {
      showErrorToast(err);
    }
  };

  const onConfirmInvitation = async (sessionID, accept) => {
    try {
      await confirmSessionInvitation(sessionID, accept);
      fetchInvited();
      showSuccessToast(`Invitation confirmed ${accept ? 'accepted' : 'rejected'}`);
    } catch (err) {
      showErrorToast(err);
    }
  };

  // effects
  React.useEffect(() => {
    if (refreshing) {
      fetchInvited().finally(() => [setRefreshing(false)]);
    }
  }, [refreshing]);

  React.useEffect(() => {
    if (socket?.connected) {
      socket.on('session/memberInvited', async () => {
        fetchInvited();
      });
    }
    return () => {
      socket?.off('session/memberInvited');
    };
  }, [socket?.connected]);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={[STYLES.PADDING_HORIZONTAL(20), STYLES.PADDING_TOP(10)]}
      data={invited}
      refreshing={refreshing}
      onRefresh={() => setRefreshing(true)}
      renderItem={({item}) => (
        <List.Item
          style={STYLES.PADDING_RIGHT(0)}
          title={item.session_name}
          description={item.session_code}
          left={() => <Image style={{width: 48, height: 48}} source={{uri: item.thumbnail_url}} />}
          right={props => (
            <View style={STYLES.FLEX_ROW}>
              <IconButton
                icon="check"
                iconColor={colors.primary}
                onPress={() => onConfirmInvitation(item?.session_id, true)}
              />
              <IconButton
                icon="close"
                iconColor={colors.red}
                onPress={() => onConfirmInvitation(item?.session_id, false)}
              />
            </View>
          )}
        />
      )}
    />
  );
};

const RefreshContext = React.createContext({
  refreshing: false,
  setRefreshing: () => {},
});

const MyRequestScreen = () => {
  // states
  const [sessionCode, setSessionCode] = React.useState('');
  const [refreshing, setRefreshing] = React.useState(false);

  // functions
  const onRequestSessionJoin = async () => {
    try {
      Keyboard.dismiss();
      if (sessionCode.length === 0) {
        return;
      }
      await joinSession(sessionCode);
      showSuccessToast('Request sent');
      setRefreshing(true);
    } catch (err) {
      showErrorToast(err);
    } finally {
      setSessionCode('');
    }
  };

  return (
    <SafeArea>
      <RefreshContext.Provider value={{refreshing, setRefreshing}}>
        <DismissKeyboard>
          <CustomHeader title="Session Requests" rightComponent={<React.Fragment />} />
        </DismissKeyboard>
        <DismissKeyboard>
          <View style={[STYLES.FLEX_ROW_ALIGN_CENTER, STYLES.PADDING(16)]}>
            <View style={styles.searchBarWrapper}>
              <TextInput
                style={[STYLES.FLEX(1), STYLES.PADDING(8)]}
                placeholder="Type session code here"
                value={sessionCode}
                onChangeText={setSessionCode}
                keyboardType="numeric"
                returnKeyType="search"
                onSubmitEditing={onRequestSessionJoin}
              />
            </View>
            <IconButton icon="send" onPress={onRequestSessionJoin} />
          </View>
        </DismissKeyboard>
        <MyRequestTabNavigator />
      </RefreshContext.Provider>
    </SafeArea>
  );
};

export default MyRequestScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  searchBarWrapper: {
    ...STYLES.FLEX(1),
    backgroundColor: colors.searchBar,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
});
