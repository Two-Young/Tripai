import React from 'react';
import {StyleSheet, View, SectionList, Text} from 'react-native';
import {Searchbar, IconButton} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useRecoilValue, useRecoilState} from 'recoil';
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
import {friendsAtom} from '../recoil/friends/friends';
import SafeArea from '../component/molecules/SafeArea';
import colors from '../theme/colors';
import CustomHeader from '../component/molecules/CustomHeader';
import {STYLES} from '../styles/Stylesheets';
import {Medium} from '../theme/fonts';
import UserItem from '../component/molecules/UserItem';
import {showErrorToast} from '../utils/utils';
import {getFriends} from '../services/api';
import {socket} from '../services/socket';

const ManageParticipantsScreen = () => {
  // hooks
  const navigation = useNavigation();

  const session = useRecoilValue(sessionAtom);
  const sessionID = React.useMemo(() => session?.session_id, [session]);

  const [friends, setFriends] = useRecoilState(friendsAtom);

  // states
  const [refreshing, setRefreshing] = React.useState(true);

  const [searchQuery, setSearchQuery] = React.useState('');

  const [joined, setJoined] = React.useState([]);
  const [inviting, setInviting] = React.useState([]);
  const [requested, setRequested] = React.useState([]);

  // functions
  const fetchFriends = async () => {
    try {
      const data = await getFriends();
      setFriends(data);
    } catch (err) {
      showErrorToast(err);
    }
  };

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

  const fetchRequeted = React.useCallback(async () => {
    try {
      const res = await getSessionJoinRequests(sessionID);
      await setRequested(res);
    } catch (err) {
      console.error(err);
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

  const onPressConfirmSessionJoinRequest = React.useCallback(
    async (friendID, accept) => {
      try {
        await confirmSessionJoinRequest(sessionID, friendID, accept);
        Promise.all([fetchJoined(), fetchInviting(), fetchRequeted()]);
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

  // effects
  React.useEffect(() => {
    if (refreshing) {
      Promise.all([fetchFriends(), fetchJoined(), fetchInviting(), fetchRequeted()])
        .catch(err => {
          showErrorToast(err);
        })
        .finally(() => {
          setRefreshing(false);
        });
    }
  }, [refreshing]);

  React.useEffect(() => {
    if (sessionID) {
      Promise.all([fetchFriends(), fetchJoined(), fetchInviting(), fetchRequeted()]).catch(err => {
        showErrorToast(err);
      });
    }
  }, [sessionID]);

  const getJoinStatus = React.useCallback(
    friendID => {
      const joinedFriend = joined.find(joinedFriend => joinedFriend.user_id === friendID);
      const invitingFriend = inviting.find(invitingFriend => invitingFriend.user_id === friendID);
      const requestedFriend = requested.find(
        requestedFriend => requestedFriend.user_id === friendID,
      );
      if (session.creator_user_id === friendID) {
        return 'owner';
      } else if (joinedFriend) {
        return 'joined';
      } else if (invitingFriend) {
        return 'inviting';
      } else if (requestedFriend) {
        return 'requested';
      } else {
        return 'none';
      }
    },
    [joined, inviting, requested],
  );

  const sections = React.useMemo(() => {
    const ownerSection = {
      title: 'Owner',
      data: joined.find(user => user.user_id === session.creator_user_id)
        ? [joined.find(user => user.user_id === session.creator_user_id)]
        : [],
    };
    const joinedSection = {
      title: 'Participants',
      data: joined.filter(user => user.user_id !== session.creator_user_id),
    };
    const invitingSection = {
      title: 'Inviting',
      data: inviting,
    };
    const requestedSection = {
      title: 'Requested',
      data: requested,
    };
    const notInvitedSection = {
      title: 'Not Invited',
      data: friends.filter(friend => getJoinStatus(friend?.user_id) === 'none'),
    };
    return [ownerSection, joinedSection, invitingSection, requestedSection, notInvitedSection];
  }, [joined, inviting, requested]);

  const userRightComponent = React.useCallback(
    user => {
      const joinStatus = getJoinStatus(user?.user_id);
      switch (joinStatus) {
        case 'owner':
          return <></>;
        case 'joined':
          return (
            <IconButton
              icon="account-minus"
              iconColor={colors.red}
              disabled={user?.user_id === session?.creator_user_id}
              onPress={() => onPressExpelMember(user?.user_id)}
              borderless={false}
            />
          );
        case 'inviting':
          return (
            <IconButton
              icon="close"
              iconColor={colors.red}
              onPress={() => onPressCancelInvitation(user?.user_id)}
            />
          );
        case 'requested':
          return (
            <>
              <IconButton
                icon="check"
                iconColor={colors.primary}
                onPress={() => onPressConfirmSessionJoinRequest(user?.user_id, true)}
              />
              <IconButton
                icon="close"
                iconColor={colors.red}
                onPress={() => onPressConfirmSessionJoinRequest(user?.user_id, false)}
              />
            </>
          );
        default:
          return (
            <IconButton
              icon="account-plus"
              iconColor={colors.primary}
              onPress={() => onPressInviteFriend(user?.user_id)}
            />
          );
      }
    },
    [getJoinStatus],
  );

  React.useEffect(() => {
    socket.on('session/memberJoined', () => {
      fetchJoined();
      fetchInviting();
      fetchRequeted();
    });
    socket.on('session/memberLeft', () => {
      fetchJoined();
    });
    socket.on('session/memberJoinRequested', data => {
      fetchRequeted();
    });
    return () => {
      if (socket) {
        socket.off('session/memberJoined');
        socket.off('session/memberLeft');
        socket.off('session/memberJoinRequested');
      }
    };
  }, [socket]);

  return (
    <SafeArea top={{style: {backgroundColor: colors.primary}, barStyle: 'light-content'}}>
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
      <SectionList
        sections={sections}
        contentContainerStyle={[STYLES.PADDING(20)]}
        refreshing={refreshing}
        onRefresh={() => setRefreshing(true)}
        ListHeaderComponent={() => (
          <Searchbar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search the friend"
            placeholderTextColor={'gray'}
            style={{
              borderRadius: 16,
              backgroundColor: '#F5F4F6',
              marginBottom: 10,
            }}
          />
        )}
        renderSectionHeader={({section: {title}}) => {
          return (
            <View
              style={[
                STYLES.FLEX_ROW_ALIGN_CENTER,
                STYLES.PADDING_TOP(10),
                STYLES.PADDING_BOTTOM(10),
                {backgroundColor: colors.white},
              ]}>
              <Text style={[styles.sectionLabel]}>{title}</Text>
              <Text style={[styles.sectionNumberLabel]}>
                {' '}
                {sections.find(section => section.title === title)?.data.length}
              </Text>
            </View>
          );
        }}
        renderItem={({item}) => <UserItem user={item} rightComponent={userRightComponent} />}
      />
    </SafeArea>
  );
};

export default ManageParticipantsScreen;

const styles = StyleSheet.create({
  sectionLabel: {
    ...Medium(16),
  },
  sectionNumberLabel: {
    ...Medium(16),
    color: colors.gray,
  },
  iconButton: {
    width: 30,
    height: 30,
    margin: 0,
    borderRadius: 0,
  },
});
