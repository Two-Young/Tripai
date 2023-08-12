import {
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CommonActions, useNavigation, useRoute} from '@react-navigation/native';
import {Button, Icon} from '@rneui/themed';
import defaultStyle from '../styles/styles';
import {deleteSession, getSessions, locateCountries} from '../services/api';
import {useRecoilState, useSetRecoilState} from 'recoil';
import sessionAtom from '../recoil/session/session';
import countriesAtom from '../recoil/countries/countries';

const MainScreen = () => {
  // states
  const [sessions, setSessions] = React.useState([]);
  const [countries, setCountries] = useRecoilState(countriesAtom);
  const [refreshing, setRefreshing] = React.useState(false);

  // hooks
  const navigation = useNavigation();
  const route = useRoute();
  const setCurrentSessionID = useSetRecoilState(sessionAtom);

  // functions
  const onPressAddTravel = React.useCallback(() => {
    navigation.navigate('AddTravel');
    // navigation.navigate('Tab');
  }, [navigation]);

  const onPressItem = travel => {
    navigation.navigate('Tab');
    setCurrentSessionID(travel.session_id);
  };

  const onPressDeleteItem = React.useCallback(
    async travel => {
      try {
        await deleteSession(travel.session_id);
        setSessions(sessions.filter(session => session.session_id !== travel.session_id));
      } catch (err) {
        console.error(err);
      }
    },
    [sessions, getSessionsFromServer],
  );

  const getCountriesFromServer = async () => {
    try {
      const data = await locateCountries();
      const sortedData = [...data].sort((a, b) => a.country_code.localeCompare(b.country_code));
      setCountries(sortedData);
    } catch (err) {
      console.error(err);
    }
  };

  const getSessionsFromServer = React.useCallback(async () => {
    const res = await getSessions();
    setSessions(res);
  }, []);

  const onRefresh = React.useCallback(async () => {
    try {
      if (!refreshing) {
        setRefreshing(true);
        await getSessionsFromServer();
        setRefreshing(false);
      }
    } catch (err) {
      console.error(err);
      setRefreshing(false);
    }
  }, [refreshing, getSessionsFromServer]);

  // effects
  React.useEffect(() => {
    getSessionsFromServer();
    getCountriesFromServer();
  }, []);

  React.useEffect(() => {
    if (route.params?.refresh) {
      onRefresh().finally(() => {
        navigation.dispatch({
          ...CommonActions.setParams({refresh: false}),
        });
      });
    }
  }, [route.params?.refresh, onRefresh]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safearea}>
      <View style={styles.container}>
        <Text>Hello, Traveler</Text>
        <Text>What travel do you want to manage?</Text>
        <FlatList
          contentContainerStyle={{paddingBottom: 100}}
          showsVerticalScrollIndicator={false}
          data={sessions}
          renderItem={({item}) => (
            <TravelItem
              travel={item}
              countries={countries.filter(country =>
                item.country_codes.includes(country.country_code),
              )}
              onPress={() => onPressItem(item)}
              onPressDelete={() => onPressDeleteItem(item)}
            />
          )}
          keyExtractor={item => item.session_id}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
        <View style={styles.travelButton}>
          <Button
            title="Add Travel"
            onPress={onPressAddTravel}
            buttonStyle={defaultStyle.button}
            titleStyle={defaultStyle.buttonContent}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const TravelItem = props => {
  const {onPress, travel, countries, onPressDelete} = props;

  const {name, start_at, end_at, country_codes, thumbnail_url} = React.useMemo(() => {
    const {name, start_at, end_at, country_codes, thumbnail_url} = travel;
    return {
      name,
      start_at,
      end_at,
      country_codes,
      thumbnail_url,
    };
  }, [travel]);

  console.log(
    country_codes.map(country => {
      countries.find(c => c.country_code === country)?.png;
    }),
  );

  return (
    <TouchableOpacity onPress={onPress} style={{paddingBottom: 10}}>
      <ImageBackground source={{uri: thumbnail_url}} style={{width: '100%', height: 200}}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            padding: 5,
            width: 30,
            height: 30,
          }}
          onPress={onPressDelete}>
          <Icon name="delete" color={'red'} />
        </TouchableOpacity>
        <View style={{flex: 1, justifyContent: 'flex-end', padding: 12}}>
          <Text style={{color: 'white', fontSize: 24}}>{name}</Text>
          <Text
            style={{
              color: 'white',
              fontSize: 12,
            }}>{`${start_at} ~ ${end_at}`}</Text>
          <View style={{flexDirection: 'row', marginTop: 3}}>
            {country_codes?.map(country => (
              <Image
                key={country}
                source={{uri: countries.find(c => c.country_code === country)?.png}}
                style={{width: 30, height: 20, marginRight: 5}}
                resizeMode="cover"
              />
            ))}
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
  },
  travelButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
});
