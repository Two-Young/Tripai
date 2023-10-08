import {StyleSheet, View, FlatList, Text} from 'react-native';
import React, {useEffect} from 'react';
import defaultStyle from '../styles/styles';
import PlaceListItem from '../component/molecules/PlaceListItem';
import colors from '../theme/colors';
import {CommonActions, useNavigation, useRoute} from '@react-navigation/native';
import {getLocations, leaveSession} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {FAB, IconButton} from 'react-native-paper';
import _ from 'lodash';
import CustomHeader from '../component/molecules/CustomHeader';
import userAtom from '../recoil/user/user';
import {getSessionMembers} from '../services/api';
import {Avatar, List} from 'react-native-paper';
import {STYLES} from '../styles/Stylesheets';
import {SemiBold} from '../theme/fonts';
import Clipboard from '@react-native-community/clipboard';
import {showSuccessToast} from '../utils/utils';

const HomeScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const user = useRecoilValue(userAtom);
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

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
      console.error(err);
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

  const onPressLeave = async () => {
    try {
      await leaveSession(currentSessionID);
      navigation.navigate('Main');
    } catch (err) {
      console.error(err);
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

  useEffect(() => {
    if (currentSessionID) {
      fetchJoined();
    }
  }, [currentSessionID]);

  // effects
  React.useEffect(() => {
    if (currentSessionID && !_.isEmpty(currentSession)) {
      fetchPlaces();
    }
  }, [currentSession, currentSessionID]);

  React.useEffect(() => {
    if (route.params?.place && currentSessionID) {
      // setPlaces(_.uniqWith([...places, route.params?.place], _.isEqual));
      fetchPlaces().then(() => {
        navigation.dispatch({...CommonActions.setParams({place: null})});
      });
    }
  }, [route.params?.place, currentSessionID]);

  console.log(currentSession?.session_code);

  return (
    <>
      <CustomHeader title={'HOME'} />
      <View style={defaultStyle.container}>
        <FlatList
          ListHeaderComponent={() => (
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
                  left={props => <Avatar.Image size={36} source={{uri: item.profile_image}} />}
                />
              )}
              ListFooterComponent={() => (
                <>
                  <View style={[STYLES.FLEX_ROW_ALIGN_CENTER, STYLES.SPACE_AROUND]}>
                    <FAB
                      style={[styles.fab, STYLES.FLEX(1), STYLES.MARGIN(20)]}
                      icon="account"
                      color="#fff"
                      onPress={onPressFriends}
                      label="Manage"
                    />
                    <FAB
                      style={[styles.fab, STYLES.FLEX(1), STYLES.MARGIN(20)]}
                      icon="door-open"
                      color="#fff"
                      onPress={onPressLeave}
                      label="Exit"
                    />
                  </View>
                  <View style={styles.line} />
                  <Text style={styles.label}>Places</Text>
                </>
              )}
            />
          )}
          data={places}
          renderItem={item => <PlaceListItem item={item.item} setArr={setPlaces} />}
          keyExtractor={item => item.location_id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{flex: 1}}
          ListFooterComponent={() => (
            <FAB
              style={[styles.fab, STYLES.MARGIN(20)]}
              icon="plus"
              color="#fff"
              onPress={onPressAddPlace}
            />
          )}
        />
      </View>
    </>
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
    alignItems: 'center',
    // margin: 20,
    backgroundColor: colors.primary,
  },
});
