import {FlatList, StyleSheet, Text, View, Alert} from 'react-native';
import React from 'react';
import {CommonActions, useFocusEffect, useNavigation, useRoute} from '@react-navigation/native';
import {IconButton, Portal, Snackbar} from 'react-native-paper';
import {getCurrencies, getSessions, locateCountries} from '../services/api';
import {useRecoilState, useRecoilValue, useSetRecoilState} from 'recoil';
import sessionAtom from '../recoil/session/session';
import userAtom from '../recoil/user/user';
import colors from '../theme/colors';
import SafeArea from '../component/molecules/SafeArea';
import countriesAtom from '../recoil/countries/countries';
import currenciesAtom from '../recoil/currencies/currencies';
import {STYLES} from '../styles/Stylesheets';
import CustomHeader from '../component/molecules/CustomHeader';
import TravelItem from '../component/molecules/TravelItem';
import {Fonts} from '../theme';
import LinearGradient from 'react-native-linear-gradient';
import {sessionsAtom} from '../recoil/session/sessions';

const MainScreen = () => {
  /* states */
  const [refreshing, setRefreshing] = React.useState(false); // refresh 여부
  const [snackbarVisible, setSnackbarVisible] = React.useState(false); // snackbar visible 여부
  // const [menuVisible, setMenuVisible] = React.useState(false); // menu visible 여부

  const [sessions, setSessions] = useRecoilState(sessionsAtom);
  const setCountries = useSetRecoilState(countriesAtom);
  const setCurrencies = useSetRecoilState(currenciesAtom);

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
    setCurrentSession(session);
    navigation.navigate('Tab');
  };

  // 세션 목록 가져오기
  const fetchSessions = async () => {
    try {
      const res = await getSessions();
      setSessions(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCountries = async () => {
    try {
      const res = await locateCountries();
      setCountries(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await getCurrencies();
      setCurrencies(res.sort((a, b) => a.currency_code.localeCompare(b.currency_code)));
    } catch (err) {
      console.error(err);
    }
  };

  // 새로고침
  const onRefresh = async () => {
    try {
      if (!refreshing) {
        setRefreshing(true);
        await fetchSessions();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  /* effects */

  React.useEffect(() => {
    fetchSessions();
    fetchCountries();
    fetchCurrencies();
  }, []);

  // route.params.refresh가 true일 경우 새로고침을 합니다.
  React.useEffect(() => {
    if (route.params?.refresh) {
      onRefresh().finally(() => {
        navigation.dispatch({
          ...CommonActions.setParams({refresh: false, target: route.key}),
        });
      });
    }
  }, [route.params?.refresh]);

  // 포커스 되면 새로고침을 합니다.
  useFocusEffect(
    React.useCallback(() => {
      onRefresh();
    }, []),
  );

  return (
    <SafeArea bottom={{inactive: true}}>
      <CustomHeader title={'WELCOME'} useBack={false} />
      <FlatList
        contentContainerStyle={[STYLES.PADDING_BOTTOM(10)]}
        showsVerticalScrollIndicator={false}
        data={sessions}
        ListHeaderComponent={
          <View style={[STYLES.PADDING_HORIZONTAL(20), STYLES.PADDING_VERTICAL(10)]}>
            <Text style={[STYLES.MARGIN_TOP(3), styles.textSectionHeader]}>Hello, {userName}</Text>
            <Text style={styles.textSectionDescription}>What travel do you want to manage?</Text>
          </View>
        }
        renderItem={({item}) => <TravelItem travel={item} onPress={() => onPressSession(item)} />}
        keyExtractor={item => item.session_id}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
      <LinearGradient
        colors={['#ffffff00', '#ffffff']}
        useAngle={true}
        angle={180}
        style={[styles.bottomGradient]}>
        <IconButton
          icon="plus-circle"
          iconColor={colors.primary}
          size={40}
          onPress={onPressCreateNewTravel}
        />
      </LinearGradient>
      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          action={{
            label: 'Close',
          }}>
          Delete Success!
        </Snackbar>
      </Portal>
    </SafeArea>
  );
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
  textSectionHeader: {
    marginTop: 13,
    ...Fonts.Bold(24),
    color: colors.black,
    marginBottom: 5,
  },
  textSectionDescription: {
    ...Fonts.Light(15),
    color: '#808080',
  },
  bottomGradient: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    height: 80,
    bottom: 0,
  },
  moreInfoBtn: {
    width: 100,
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
});
