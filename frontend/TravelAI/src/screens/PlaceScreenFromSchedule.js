import {StyleSheet, View, FlatList} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {FAB, Header as HeaderRNE} from '@rneui/themed';
import PlaceListItem from '../component/molecules/PlaceListItem';
import colors from '../theme/colors';
import {useNavigation, useRoute, CommonActions} from '@react-navigation/native';
import _ from 'lodash';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {getLocations} from '../services/api';

const PlaceScreenFromSchedule = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const currentSessionID = useRecoilValue(sessionAtom);

  // states
  const [places, setPlaces] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);

  // functions
  const onPressAddPlace = React.useCallback(() => {
    navigation.navigate('AddPlace', {routeKey: route?.key});
  }, [navigation, route]);

  const onPressPlace = React.useCallback(
    place => {
      navigation.dispatch({
        ...CommonActions.setParams({place, day: route.params?.day}),
        source: route.params?.routeKey,
      });
      navigation.goBack();
    },
    [navigation],
  );

  const getPlacesFromServer = React.useCallback(async () => {
    const res = await getLocations(currentSessionID);
    setPlaces(res);
  }, [currentSessionID]);

  const onRefresh = React.useCallback(async () => {
    try {
      if (!refreshing) {
        setRefreshing(true);
        await getPlacesFromServer();
        setRefreshing(false);
      }
    } catch (err) {
      console.error(err);
      setRefreshing(false);
    }
  }, [refreshing, getPlacesFromServer]);

  // effects
  React.useEffect(() => {
    if (currentSessionID) {
      getPlacesFromServer();
    }
  }, [currentSessionID]);

  React.useEffect(() => {
    if (route.params?.place) {
      // setPlaces(_.uniqWith([...places, route.params?.place], _.isEqual));
      getPlacesFromServer();
      navigation.dispatch({...CommonActions.setParams({place: null})});
    }
  }, [route.params?.place]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
      <View style={defaultStyle.container}>
        <HeaderRNE
          backgroundColor="#fff"
          barStyle="dark-content"
          centerComponent={{text: 'Location', style: defaultStyle.heading}}
        />
        <FlatList
          data={places}
          renderItem={item => (
            <PlaceListItem item={item.item} setArr={setPlaces} onPress={onPressPlace} />
          )}
          keyExtractor={item => item.location_id}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
        <FAB
          placement="right"
          icon={{name: 'add', color: 'white'}}
          color={colors.primary}
          onPress={onPressAddPlace}
        />
      </View>
    </SafeAreaView>
  );
};

export default PlaceScreenFromSchedule;

const styles = StyleSheet.create({});
