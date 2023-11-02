import {StyleSheet, View, FlatList, Text, Alert} from 'react-native';
import React, {useEffect} from 'react';
import defaultStyle from '../styles/styles';
import PlaceListItem from '../component/molecules/PlaceListItem';
import colors from '../theme/colors';
import {CommonActions, useNavigation, useRoute} from '@react-navigation/native';
import {getLocations, getSessionCurrencies, leaveSession} from '../services/api';
import {useRecoilValue, useRecoilState} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {Button, FAB, IconButton} from 'react-native-paper';
import _ from 'lodash';
import CustomHeader from '../component/molecules/CustomHeader';
import userAtom from '../recoil/user/user';
import {getSessionMembers} from '../services/api';
import {Avatar, List} from 'react-native-paper';
import {STYLES} from '../styles/Stylesheets';
import {SemiBold} from '../theme/fonts';
import Clipboard from '@react-native-community/clipboard';
import {requestAlert, showErrorToast, showSuccessToast} from '../utils/utils';
import {deleteSession} from '../services/api';
import {sessionsAtom} from '../recoil/session/sessions';
import {socket} from '../services/socket';

const HomeScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();

  const [sessions, setSessions] = useRecoilState(sessionsAtom);
  const user = useRecoilValue(userAtom);
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  const isOwner = React.useMemo(
    () => currentSession?.creator_user_id === user?.user_info?.user_id,
    [currentSession, user],
  );

  // states
  const [places, setPlaces] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [fmVisible, setFmVisible] = React.useState(false);

  // functions
  const fetchPlaces = async () => {
    const res = await getLocations(currentSessionID);
    setPlaces(res);
  };

  const onRefresh = async () => {
    try {
      if (!refreshing) {
        setRefreshing(true);
        await fetchPlaces();
        setRefreshing(false);
      }
    } catch (err) {
      showErrorToast(err);
      setRefreshing(false);
    }
  };

  const onPressAddPlace = () => {
    navigation.navigate('AddPlace', {
      routeKey: route?.key,
    });
  };

  const onPressFriends = () => {
    navigation.navigate('ManageParticipants');
    setFmVisible(true);
  };

  const onLeave = async () => {
    try {
      await leaveSession(currentSessionID);
      setSessions(sessions.filter(session => session.session_id !== currentSessionID));
      navigation.goBack();
    } catch (err) {
      console.error(err);
    }
  };

  const onPressLeave = async () => {
    try {
      requestAlert('Exit Session', 'Are you sure you want to exit this session?', onLeave);
    } catch (err) {
      showErrorToast(err);
    }
  };

  // 세션 삭제
  const onPressDeleteSession = async () => {
    Alert.alert(
      `Delete ${currentSession.name}`,
      `Are you sure you want to delete ${currentSession.name}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', onPress: () => onDelete(currentSession), style: 'destructive'},
      ],
    );
  };

  const onDelete = async () => {
    try {
      await deleteSession(currentSessionID);
      setSessions(sessions.filter(session => session.session_id !== currentSessionID));
      navigation.goBack();
    } catch (err) {
      showErrorToast(err);
    }
  };

  const [joined, setJoined] = React.useState([]);

  const fetchJoined = React.useCallback(async () => {
    try {
      const res = await getSessionMembers(currentSessionID);
      setJoined(res);
    } catch (err) {
      console.error(err);
    }
  }, [currentSessionID]);

  const fetchDatas = React.useCallback(async () => {
    try {
      await fetchPlaces();
      await fetchJoined();
    } catch (err) {
      showErrorToast(err);
    }
  }, [currentSessionID]);

  // effects
  useEffect(() => {
    if (currentSessionID) {
      fetchDatas();
    }
  }, [currentSessionID]);

  React.useEffect(() => {
    if (route.params?.place && currentSessionID) {
      // setPlaces(_.uniqWith([...places, route.params?.place], _.isEqual));
      fetchPlaces()
        .then(() => {
          navigation.dispatch({...CommonActions.setParams({place: null})});
        })
        .catch(err => {
          showErrorToast(err);
        });
    }
  }, [route.params?.place, currentSessionID]);

  React.useEffect(() => {
    if (currentSessionID && socket?.connected) {
      socket.on('location/created', data => {
        setPlaces(prev => [...prev, data]);
      });
      socket.on('location/deleted', data => {
        setPlaces(prev => prev.filter(place => place.location_id !== data.location_id));
      });
      socket.on('session/memberJoined', data => async () => {
        fetchJoined();
      });
      socket.on('session/memberLeft', data => async () => {
        fetchJoined();
      });
    }
    return () => {
      socket.off('location/created');
      socket.off('location/deleted');
      socket.off('session/memberJoined');
      socket.off('session/memberLeft');
    };
  }, [socket, currentSessionID]);

  return (
    <View style={defaultStyle.container}>
      <CustomHeader title={'HOME'} />
      <FlatList
        ListHeaderComponent={
          <FlatList
            style={{padding: 20}}
            ListHeaderComponent={
              <>
                <View
                  style={[
                    styles.sessionCodeContainer,
                    STYLES.FLEX_ROW_ALIGN_CENTER,
                    STYLES.SPACE_BETWEEN,
                  ]}>
                  <Text style={styles.label}>Session Code</Text>
                  <View style={[STYLES.FLEX_ROW_ALIGN_CENTER]}>
                    <Text style={styles.sessionCode}>{currentSession?.session_code}</Text>
                    <IconButton
                      icon="content-copy"
                      size={16}
                      onPress={() => {
                        Clipboard.setString(currentSession?.session_code);
                        showSuccessToast('copied session code');
                      }}
                    />
                  </View>
                </View>
                <View style={styles.line} />
                <Text style={styles.label}>Participants</Text>
              </>
            }
            data={joined}
            renderItem={({item}) => (
              <List.Item
                title={item.username}
                left={props => <Avatar.Image size={48} source={{uri: item.profile_image}} />}
              />
            )}
            ListFooterComponent={
              <>
                {isOwner && (
                  <FAB
                    style={[styles.fab, STYLES.FLEX(1), STYLES.MARGIN_VERTICAL(20)]}
                    icon="account-multiple"
                    color="#fff"
                    onPress={onPressFriends}
                    label="Manage"
                  />
                )}

                <View style={styles.line} />
                <Text style={styles.label}>Places</Text>
              </>
            }
          />
        }
        data={places}
        renderItem={item => <PlaceListItem item={item.item} setArr={setPlaces} />}
        keyExtractor={item => item.location_id}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={
          <View style={[STYLES.PADDING_HORIZONTAL(20)]}>
            <FAB
              style={[styles.fab, STYLES.MARGIN_VERTICAL(20)]}
              icon="map-marker-plus"
              color="#fff"
              onPress={onPressAddPlace}
              label="Add Place"
            />
            <View style={styles.line} />
            <Text style={styles.label}>Others</Text>
            {!isOwner && (
              <FAB
                style={[styles.exitButton, STYLES.FLEX(1), STYLES.MARGIN_VERTICAL(20)]}
                icon="door-open"
                color="#fff"
                onPress={onPressLeave}
                label="Exit"
              />
            )}
            {isOwner && (
              <FAB
                style={[styles.deleteButton, STYLES.FLEX(1), STYLES.MARGIN_VERTICAL(20)]}
                icon="door-open"
                color="#fff"
                onPress={onPressDeleteSession}
                label="Delete"
              />
            )}
          </View>
        }
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  line: {
    width: '100%',
    height: 1,
    marginVertical: 8,
  },
  label: {
    ...SemiBold(16),
  },
  sessionCode: {
    ...SemiBold(16),
    color: colors.primary,
  },
  fab: {
    alignItems: 'stretch',
    backgroundColor: colors.primary,
  },
  exitButton: {
    alignItems: 'stretch',
    backgroundColor: colors.gray,
  },
  deleteButton: {
    alignItems: 'stretch',
    backgroundColor: colors.red,
  },
});
