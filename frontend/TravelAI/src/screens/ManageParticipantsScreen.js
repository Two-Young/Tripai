import React from 'react';
import {StyleSheet, View, FlatList} from 'react-native';
import {Text, Searchbar, Avatar, IconButton, List} from 'react-native-paper';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useRecoilValue} from 'recoil';
import userAtom from '../recoil/user/user';
import {
  getSessionMembers,
  getSessionInvitationWaitings,
  getSessionJoinRequests,
  inviteSession,
  cancelInvitationForSession,
  expelUserFromSession,
  confirmSessionJoinRequest,
} from '../services/api';
import sessionAtom from '../recoil/session/session';
import {getFriendsSelector} from '../recoil/friends/friends';
import SafeArea from '../component/molecules/SafeArea';
import colors from '../theme/colors';
import CustomHeader from '../component/molecules/CustomHeader';
import {STYLES} from '../styles/Stylesheets';

const ManageParticipantsScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const user = useRecoilValue(userAtom);

  const session = useRecoilValue(sessionAtom);
  const sessionID = React.useMemo(() => session?.session_id, [session]);

  const friends = useRecoilValue(getFriendsSelector);

  // states
  const [searchQuery, setSearchQuery] = React.useState('');

  const [joined, setJoined] = React.useState([]);
  const [inviting, setInviting] = React.useState([]);
  const [requested, setRequested] = React.useState([]);
  const [searched, setSearched] = React.useState([]);

  const fetchJoined = React.useCallback(async () => {
    try {
      const res = await getSessionMembers(sessionID);
      setJoined(res);
    } catch (err) {
      console.error(err);
    }
  }, [sessionID]);

  const fetchInviting = React.useCallback(async () => {
    try {
      const res = await getSessionInvitationWaitings(sessionID);
      setInviting(res);
    } catch (err) {
      console.error(err);
    }
  }, [sessionID]);

  const fetchRequested = React.useCallback(async () => {
    try {
      const res = await getSessionJoinRequests(sessionID);
      setRequested(res);
    } catch (err) {
      console.error(err);
    }
  }, [sessionID]);

  const onPressInviteFriend = React.useCallback(
    async friendID => {
      try {
        await inviteSession(sessionID, friendID);
        fetchInviting();
      } catch (err) {
        console.error(err);
      }
    },
    [sessionID],
  );

  const onPressCancelInvitation = React.useCallback(
    async friendID => {
      try {
        await cancelInvitationForSession(sessionID, friendID);
        fetchInviting();
      } catch (err) {
        console.error(err);
      }
    },
    [sessionID],
  );

  const onPressExpelMember = React.useCallback(
    async friendID => {
      try {
        await expelUserFromSession(sessionID, friendID);
        fetchJoined();
      } catch (err) {
        console.error(err);
      }
    },
    [sessionID],
  );

  const onConfirmRequest = React.useCallback(
    async (friendID, accept) => {
      try {
        await confirmSessionJoinRequest(sessionID, friendID, accept);
        fetchJoined();
        fetchRequested();
      } catch (err) {
        console.error(err);
      }
    },
    [sessionID],
  );

  // effects
  React.useEffect(() => {
    if (sessionID) {
      fetchJoined();
      fetchInviting();
      fetchRequested();
    }
  }, [sessionID]);

  React.useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setSearched(filtered);
    } else {
      setSearched(friends);
    }
  }, [searchQuery, friends]);

  return (
    <SafeArea top={{style: {backgroundColor: colors.white}, barStyle: 'dark-content'}}>
      <CustomHeader
        title="Manage Participants"
        leftComponent={
          <IconButton
            icon={'arrow-left'}
            iconColor="black"
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
          />
        }
        titleColor={colors.black}
        backgroundColor={colors.white}
        rightComponent={<></>}
      />
      <View style={[styles.container, STYLES.PADDING(20)]}>
        <Text>Joined</Text>
        <FlatList
          style={{flex: 1}}
          data={joined}
          renderItem={({item}) => (
            <List.Item
              title={item.username}
              left={props => <Avatar.Image size={48} source={{uri: item.profile_image}} />}
              right={props =>
                user?.user_info?.user_id !== item.user_id && (
                  <IconButton icon="close" onPress={() => onPressExpelMember(item?.user_id)} />
                )
              }
            />
          )}
        />
        <Text>Inviting</Text>
        <FlatList
          style={{flex: 1}}
          data={inviting}
          renderItem={({item}) => (
            <List.Item
              title={item.username}
              left={props => <Avatar.Image size={48} source={{uri: item.profile_image}} />}
              right={props => (
                <IconButton icon="close" onPress={() => onPressCancelInvitation(item?.user_id)} />
              )}
            />
          )}
        />
        <Text>Requested</Text>
        <FlatList
          style={{flex: 1}}
          data={requested}
          renderItem={({item}) => (
            <List.Item
              title={item.username}
              left={props => <Avatar.Image size={48} source={{uri: item.profile_image}} />}
              right={props => (
                <View style={{flexDirection: 'row'}}>
                  <IconButton icon="check" onPress={() => onConfirmRequest(item?.user_id, true)} />
                  <IconButton icon="close" onPress={() => onConfirmRequest(item?.user_id, false)} />
                </View>
              )}
            />
          )}
        />
        <Text>Search</Text>
        <Searchbar value={searchQuery} onChangeText={setSearchQuery} />
        <FlatList
          style={{flex: 1}}
          data={searched}
          renderItem={({item}) => (
            <List.Item
              title={item.username}
              left={props => <Avatar.Image size={48} source={{uri: item.profile_image}} />}
              right={props => (
                <IconButton icon="plus" onPress={() => onPressInviteFriend(item?.user_id)} />
              )}
            />
          )}
        />
      </View>
    </SafeArea>
  );
};

export default ManageParticipantsScreen;

const styles = StyleSheet.create({
  iconButton: {
    width: 30,
    height: 30,
    margin: 0,
    borderRadius: 0,
  },
});
