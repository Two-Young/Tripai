import {StyleSheet, View, FlatList, Text} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {Header} from '@rneui/themed';
import PlaceListItem from '../component/molecules/PlaceListItem';
import colors from '../theme/colors';
import {CommonActions, useNavigation, useRoute} from '@react-navigation/native';
import {getLocations} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {FAB} from 'react-native-paper';

const HomeScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  // states
  const [places, setPlaces] = React.useState([]);

  const [refreshing, setRefreshing] = React.useState(false);

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

  React.useEffect(() => {
    if (currentSession) {
      fetchPlaces();
    }
  }, [currentSession]);

  React.useEffect(() => {
    if (route.params?.place && currentSessionID) {
      // setPlaces(_.uniqWith([...places, route.params?.place], _.isEqual));
      fetchPlaces().then(() => {
        navigation.dispatch({...CommonActions.setParams({place: null})});
      });
    }
  }, [route.params?.place, currentSessionID]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
      <View style={defaultStyle.container}>
        <Header
          backgroundColor="#fff"
          barStyle="dark-content"
          rightComponent={{
            icon: 'menu',
            color: colors.black,
          }}
          centerComponent={{text: 'Home', style: defaultStyle.heading}}
        />
        <Text>Invite</Text>
        <FlatList
          data={places}
          renderItem={item => <PlaceListItem item={item.item} setArr={setPlaces} />}
          keyExtractor={item => item.location_id}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={() => <Text style={defaultStyle.heading}>Places</Text>}
        />
        <FAB style={styles.fab} icon="plus" color="#fff" onPress={onPressAddPlace} />
      </View>
    </SafeAreaView>
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
