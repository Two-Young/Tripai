import {StyleSheet, View, FlatList, Text, ScrollView} from 'react-native';
import React from 'react';
import defaultStyle from '../styles/styles';
import PlaceListItem from '../component/molecules/PlaceListItem';
import colors from '../theme/colors';
import {CommonActions, useNavigation, useRoute} from '@react-navigation/native';
import {getFriends, getLocations, leaveSession} from '../services/api';
import {useRecoilValue, useRecoilValueLoadable} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {FAB, IconButton, Searchbar} from 'react-native-paper';
import _ from 'lodash';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import Modal from 'react-native-modal';
import FriendsModal from '../component/organisms/FriendsModal';
import userAtom from '../recoil/user/user';

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

  return (
    // <SafeArea>
    <>
      <CustomHeader title={'HOME'} />
      <View style={defaultStyle.container}>
        <ScrollView style={{flex: 1}}>
          <Text>Session Invite</Text>
          <Text>Session Code : {currentSession?.session_code}</Text>
          <IconButton icon="account" mode="contained" onPress={onPressFriends} />
          <IconButton icon="door-open" mode="contained" onPress={onPressLeave} />
        </ScrollView>
        <FlatList
          data={places}
          renderItem={item => <PlaceListItem item={item.item} setArr={setPlaces} />}
          keyExtractor={item => item.location_id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={() => <Text style={defaultStyle.heading}>Places</Text>}
        />
        <FAB style={styles.fab} icon="plus" color="#fff" onPress={onPressAddPlace} />
        <FriendsModal visible={fmVisible} setVisible={setFmVisible} />
      </View>
    </>
    // </SafeArea>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 10,
    right: 0,
    bottom: 10,
    backgroundColor: colors.primary,
  },
});
