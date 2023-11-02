import {View, Text, FlatList, TextInput, StyleSheet} from 'react-native';
import React from 'react';
import Modal from 'react-native-modal';
import {Avatar, IconButton, List, Searchbar} from 'react-native-paper';
import {useRecoilValue, useRecoilValueLoadable} from 'recoil';
import {getFriendsSelector} from '../../recoil/friends/friends';
import {
  cancelInvitationForSession,
  confirmSessionJoinRequest,
  expelUserFromSession,
  getSessionInvitationWaitings,
  getSessionJoinRequests,
  getSessionMembers,
  inviteSession,
} from '../../services/api';
import sessionAtom from '../../recoil/session/session';
import reactotron from 'reactotron-react-native';
import userAtom from '../../recoil/user/user';
import {showErrorToast} from '../../utils/utils';

const FriendsModal = props => {
  const {visible, setVisible} = props;

  // hooks
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

  // functions
  const onClose = () => {
    setVisible(false);
  };

  const fetchJoined = React.useCallback(async () => {
    try {
      const res = await getSessionMembers(sessionID);
      setJoined(res);
    } catch (err) {
      showErrorToast(err);
    }
  }, [sessionID]);

  const fetchInviting = React.useCallback(async () => {
    try {
      const res = await getSessionInvitationWaitings(sessionID);
      setInviting(res);
    } catch (err) {
      showErrorToast(err);
    }
  }, [sessionID]);

  const fetchRequested = React.useCallback(async () => {
    try {
      const res = await getSessionJoinRequests(sessionID);
      setRequested(res);
    } catch (err) {
      showErrorToast(err);
    }
  }, [sessionID]);

  const onPressInviteFriend = React.useCallback(
    async friendID => {
      try {
        await inviteSession(sessionID, friendID);
        await fetchInviting();
      } catch (err) {
        showErrorToast(err);
      }
    },
    [sessionID],
  );

  const onPressCancelInvitation = React.useCallback(
    async friendID => {
      try {
        await cancelInvitationForSession(sessionID, friendID);
        await fetchInviting();
      } catch (err) {
        showErrorToast(err);
      }
    },
    [sessionID],
  );

  const onPressExpelMember = React.useCallback(
    async friendID => {
      try {
        await expelUserFromSession(sessionID, friendID);
        await fetchJoined();
      } catch (err) {
        showErrorToast(err);
      }
    },
    [sessionID],
  );

  const onConfirmRequest = React.useCallback(
    async (friendID, accept) => {
      try {
        await confirmSessionJoinRequest(sessionID, friendID, accept);
        await fetchJoined();
        await fetchRequested();
      } catch (err) {
        showErrorToast(err);
      }
    },
    [sessionID],
  );

  // effects
  React.useEffect(() => {
    if (sessionID && visible) {
      const fetchDatas = async () => {
        await fetchJoined();
        await fetchInviting();
        await fetchRequested();
      };
      fetchDatas().catch(err => {
        showErrorToast(err);
      });
    }
  }, [sessionID, visible]);

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
    <Modal isVisible={visible} onBackdropPress={onClose}>
      <View style={styles.container}>
        <Text style={{textAlign: 'center'}}>FriendsModal</Text>
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
    </Modal>
  );
};

export default FriendsModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
  },
});
