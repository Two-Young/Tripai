import {FlatList, StyleSheet, Text, View, Image, Alert} from 'react-native';
import React, {Suspense} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {CommonActions, useNavigation, useRoute} from '@react-navigation/native';
import {Header, Icon} from '@rneui/themed';
import {Button, IconButton, Surface} from 'react-native-paper';
import defaultStyle from '../styles/styles';
import {deleteSession, getSessions, locateCountries} from '../services/api';
import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import sessionAtom from '../recoil/session/session';
import countriesAtom from '../recoil/countries/countries';
import userAtom from '../recoil/user/user';

const MainScreen = () => {
  /* states */
  const [sessions, setSessions] = React.useState([]); // 세션 목록
  const [countries, setCountries] = useRecoilState(countriesAtom); // 국가 목록
  const [refreshing, setRefreshing] = React.useState(false); // refresh 여부

  /* hooks */
  const navigation = useNavigation();
  const route = useRoute();
  const setCurrentSession = useSetRecoilState(sessionAtom);
  const user = useRecoilValue(userAtom);

  const userName = React.useMemo(() => user?.user_info?.username, [user]);

  /* functions */
  // 여행 추가 버튼 클릭
  const onPressCreateNewTravel = () => {
    navigation.navigate('AddTravel');
  };

  // 세션 클릭 시
  const onPressSession = session => {
    navigation.navigate('Tab');
    setCurrentSession(session);
  };

  // 세션 삭제
  const onPressDeleteSession = async session => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Delete', onPress: () => onDelete(session), style: 'destructive'},
    ]);
  };

  const onDelete = async session => {
    try {
      await deleteSession(session.session_id);
      setSessions(sessions.filter(sess => sess.session_id !== session.session_id));
    } catch (err) {
      console.error(err);
    }
  };

  // 세션 목록 가져오기
  const fetchSessions = async () => {
    const res = await getSessions();
    setSessions(res);
  };

  // 새로고침
  const onRefresh = async () => {
    try {
      if (!refreshing) {
        setRefreshing(true);
        await fetchSessions();
        setRefreshing(false);
      }
    } catch (err) {
      console.error(err);
      setRefreshing(false);
    }
  };

  /* effects */

  React.useEffect(() => {
    fetchSessions();
  }, []);

  // route.params.refresh가 true일 경우 새로고침을 합니다.
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
    <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
      <Header
        backgroundColor="#fff"
        barStyle="dark-content"
        leftComponent={{text: 'HOME', style: defaultStyle.heading}}
        rightComponent={{
          icon: 'settings',
          color: '#000',
        }}
      />
      <View style={styles.container}>
        <FlatList
          contentContainerStyle={{paddingBottom: 100}}
          showsVerticalScrollIndicator={false}
          data={sessions}
          ListHeaderComponent={
            <View style={styles.textSection}>
              <Text style={styles.textSectionHeader}>Hello, {userName}</Text>
              <Text style={styles.textSectionDescription}>What travel do you want to manage?</Text>
            </View>
          }
          renderItem={({item}) => (
            <TravelItem
              travel={item}
              countries={countries.filter(country =>
                item.country_codes.includes(country.country_code),
              )}
              onPress={() => onPressSession(item)}
              onPressDelete={() => onPressDeleteSession(item)}
            />
          )}
          ItemSeparatorComponent={renderSeparator}
          keyExtractor={item => item.session_id}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
        <Button
          style={styles.createTravelBtn}
          contentStyle={styles.createTravelBtnContent}
          mode="contained"
          onPress={onPressCreateNewTravel}>
          Create New Travel
        </Button>
      </View>
    </SafeAreaView>
  );
};

const TravelItem = props => {
  const {onPress, travel, onPressDelete} = props;

  const {name, start_at, end_at, thumbnail_url} = React.useMemo(() => {
    const {name, start_at, end_at, thumbnail_url} = travel;
    return {
      name,
      start_at,
      end_at,
      thumbnail_url,
    };
  }, [travel]);

  return (
    <Surface style={styles.session}>
      <IconButton
        style={styles.sessionDeleteButton}
        icon="close"
        iconColor="#3C3C43"
        containerColor="#F9F9F9"
        mode="contained"
        onPress={onPressDelete}
      />
      <Image source={{uri: thumbnail_url}} style={styles.sessionImage} />
      <View style={styles.sessionContent}>
        <View style={styles.upperContent}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName} numberOfLines={2}>
              {name}
            </Text>
            <Text
              style={styles.sessionDescription}
              numberOfLines={2}>{`${start_at} ~ ${end_at}`}</Text>
          </View>
          <Button style={styles.sessionOpenBtn} mode="contained" onPress={onPress}>
            Open
          </Button>
        </View>
        <View style={styles.lowerContent}>
          <Button
            compact
            icon="chevron-right"
            textColor="#3C3C43"
            contentStyle={styles.moreInfoBtn}>
            More Info
          </Button>
        </View>
      </View>
    </Surface>
  );
};

const renderSeparator = () => {
  return <View style={styles.separator} />;
};

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 10,
  },
  createTravelBtn: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    zIndex: 1,
  },
  createTravelBtnContent: {
    height: 50,
    borderRadius: 30,
  },
  textSection: {
    paddingHorizontal: 11,
    marginBottom: 23,
  },
  textSectionHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  textSectionDescription: {
    fontSize: 15,
    color: '#808080',
  },
  session: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 50,
  },
  sessionDeleteButton: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 1,
  },
  sessionImage: {
    width: '100%',
    height: '55%',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
  },
  sessionContent: {
    flex: 1,
    padding: 24,
  },
  upperContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lowerContent: {
    alignItems: 'flex-end',
  },
  sessionInfo: {
    flex: 1,
    marginRight: 24,
  },
  sessionName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  sessionDescription: {
    fontSize: 12,
    color: '#000',
  },
  sessionOpenBtn: {
    width: 100,
    borderRadius: 30,
    height: 50,
    justifyContent: 'center',
  },
  separator: {
    height: 18,
    backgroundColor: 'transparent',
  },
  moreInfoBtn: {
    width: 100,
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
});
