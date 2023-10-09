import React from 'react';
import {StyleSheet, View, FlatList, SectionList, Text} from 'react-native';
import {Searchbar, Avatar, IconButton, List} from 'react-native-paper';
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
import {Medium} from '../theme/fonts';

const ManageParticipantsScreen = () => {
  // hooks
  const navigation = useNavigation();

  const session = useRecoilValue(sessionAtom);
  const sessionID = React.useMemo(() => session?.session_id, [session]);

  const friends = useRecoilValue(getFriendsSelector);

  // states
  const [searchQuery, setSearchQuery] = React.useState('');

  const [joined, setJoined] = React.useState([]);
  const [inviting, setInviting] = React.useState([]);
  const [requested, setRequested] = React.useState([]);

  // functions
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

  // effects
  React.useEffect(() => {
    if (sessionID) {
      fetchJoined();
      fetchInviting();
    }
  }, [sessionID]);

  const filteredFriends = React.useMemo(() => {
    if (searchQuery.length > 0) {
      return friends.filter(friend =>
        friend.username.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    } else {
      return friends;
    }
  }, [searchQuery, friends]);

  const getJoinStatus = React.useCallback(
    friendID => {
      const joinedFriend = joined.find(joinedFriend => joinedFriend.user_id === friendID);
      const invitingFriend = inviting.find(invitingFriend => invitingFriend.user_id === friendID);
      if (joinedFriend) {
        return 'joined';
      } else if (invitingFriend) {
        return 'inviting';
      } else {
        return 'none';
      }
    },
    [joined, inviting, requested],
  );

  const sections = React.useMemo(() => {
    const joinedSection = {
      title: 'Participants',
      data: joined,
    };
    const invitingSection = {
      title: 'Inviting',
      data: inviting,
    };
    const notInvitedSection = {
      title: 'Not Invited',
      data: friends.filter(friend => getJoinStatus(friend?.user_id) === 'none'),
    };
    return [joinedSection, invitingSection, notInvitedSection];
  }, [joined, inviting, requested]);

  console.log({filteredFriends});

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
      <SectionList
        sections={sections}
        contentContainerStyle={[STYLES.PADDING(20)]}
        ListHeaderComponent={() => (
          <Searchbar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Serach the friend"
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
        renderItem={({item}) => (
          <List.Item
            title={item.username}
            left={props => <Avatar.Image size={48} source={{uri: item.profile_image}} />}
            style={[STYLES.PADDING_RIGHT(0)]}
            right={props => {
              const joinStatus = getJoinStatus(item?.user_id);
              switch (joinStatus) {
                case 'joined':
                  return (
                    <>
                      <IconButton icon="check-decagram" iconColor={colors.primary} />
                      <IconButton
                        icon="account-minus"
                        iconColor="red"
                        onPress={() => onPressExpelMember(item?.user_id)}
                        borderless={false}
                      />
                    </>
                  );
                case 'inviting':
                  return (
                    <>
                      <IconButton icon="account-clock" iconColor={colors.gray} />
                      <IconButton
                        icon="cancel"
                        iconColor="red"
                        onPress={() => onPressCancelInvitation(item?.user_id)}
                      />
                    </>
                  );
                default:
                  return (
                    <IconButton
                      icon="account-plus"
                      iconColor={colors.primary}
                      onPress={() => onPressInviteFriend(item?.user_id)}
                    />
                  );
              }
            }}
          />
        )}
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
