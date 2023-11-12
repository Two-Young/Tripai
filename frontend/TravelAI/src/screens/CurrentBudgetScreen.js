import {
  StyleSheet,
  Text,
  View,
  Animated,
  Pressable,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import React from 'react';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import colors from '../theme/colors';
import {STYLES} from '../styles/Stylesheets';
import dayjs from 'dayjs';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {SemiBold} from './../theme/fonts';
import {FAB} from 'react-native-paper';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {getBudgetSummary, getExpenditures} from '../services/api';
import {Icon} from '@rneui/themed';
import currenciesAtom from '../recoil/currencies/currencies';
import {showErrorToast} from '../utils/utils';
import {socket} from '../services/socket';
import reactotron from 'reactotron-react-native';

const Card = ({myBudget, sessionBudget, currencyCode}) => {
  const currencies = useRecoilValue(currenciesAtom);

  const symbol = React.useMemo(() => {
    const currency = currencies.find(item => item.currency_code === currencyCode);
    return currency?.currency_symbol;
  }, [currencies, currencyCode]);

  const flipAnimation = React.useRef(new Animated.Value(0)).current;

  let flipRotation = 0;
  flipAnimation.addListener(({value}) => {
    flipRotation = value;
  });

  const flipToFrontStyle = {
    transform: [
      {rotateY: flipAnimation.interpolate({inputRange: [0, 180], outputRange: ['0deg', '180deg']})},
    ],
  };

  const flipToBackStyle = {
    transform: [
      {
        rotateY: flipAnimation.interpolate({
          inputRange: [0, 180],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  const flipToFront = () => {
    Animated.timing(flipAnimation, {
      toValue: 180,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const flipToBack = () => {
    Animated.timing(flipAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const spentRatio = React.useMemo(() => {
    if (!myBudget || myBudget?.total === 0) {
      if (myBudget?.spent >= 0) {
        return 100;
      } else {
        return 0;
      }
    }
    return (myBudget?.spent / myBudget?.total) * 100;
  }, [myBudget]);

  const sessionSpentRatio = React.useMemo(() => {
    if (!sessionBudget || sessionBudget?.total === 0) {
      if (sessionBudget?.spent >= 0) {
        return 100;
      } else {
        return 0;
      }
    }
    return (sessionBudget?.spent / sessionBudget?.total) * 100;
  }, [sessionBudget]);

  return (
    <Pressable onPress={() => (flipRotation ? flipToBack() : flipToFront())}>
      <Animated.View style={[styles.card, styles.front, flipToFrontStyle]}>
        <Text style={styles.cardTitle}>My Budget</Text>
        <View style={STYLES.ALIGN_CENTER}>
          <AnimatedCircularProgress
            size={250}
            rotation={265}
            arcSweepAngle={190}
            width={15}
            fill={spentRatio}
            tintColor="#458CF6"
            backgroundColor="black"
          />
          <View style={styles.boxWrapper}>
            <Text style={styles.boxText}>
              You spent {spentRatio.toFixed(3).replace(/\.00$/, '').replace(/\.0$/, '')}%
            </Text>
            <Text style={styles.boxBold}>
              {symbol} {myBudget?.spent?.toLocaleString()}
            </Text>
            <Text style={styles.boxText}>
              of {symbol} {myBudget?.total?.toLocaleString()}
            </Text>
          </View>
        </View>
      </Animated.View>
      <Animated.View style={[styles.card, styles.back, flipToBackStyle]}>
        <Text style={styles.cardTitle}>Session Budget</Text>
        <View style={STYLES.ALIGN_CENTER}>
          <AnimatedCircularProgress
            style={{transform: [{rotateY: '180deg'}]}}
            size={250}
            rotation={265}
            arcSweepAngle={190}
            width={15}
            fill={sessionSpentRatio}
            tintColor="#9345F6"
            backgroundColor="black"
          />
          <View style={styles.boxWrapper}>
            <Text style={styles.boxText}>
              Members spent {sessionSpentRatio.toFixed(3).replace(/\.00$/, '').replace(/\.0$/, '')}%
            </Text>
            <Text style={styles.boxBold}>
              {symbol} {sessionBudget?.spent?.toLocaleString()}
            </Text>
            <Text style={styles.boxText}>
              of {symbol} {sessionBudget?.total?.toLocaleString()}
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const DayItem = ({item, selectedDay, onPress}) => {
  const {date, spent} = item;

  const day = React.useMemo(() => dayjs(date).format('DD'), [date]);

  const isSelected = React.useMemo(() => selectedDay?.date === date, [selectedDay, date]);

  return (
    <TouchableOpacity
      style={[styles.dayItem, styles.smallDayItem, isSelected && styles.selectedDayItem]}
      onPress={onPress}>
      <View style={STYLES.ALIGN_CENTER}>
        <Text style={[styles.day, isSelected && styles.selectedText]}>{day}</Text>
        <Text style={[styles.spent, isSelected && styles.selectedText]}>{spent}%</Text>
      </View>
    </TouchableOpacity>
  );
};

const ExpenditureItem = ({item}) => {
  const {name, total_price, currency_code, payed_at, category, has_receipt} = item;

  const renderIcon = React.useCallback(() => {
    switch (category) {
      case 'lodgment':
        return <Icon name="bed" type="material-community" />;
      case 'transport':
        return <Icon name="car" type="material-community" />;
      case 'activity':
        return <Icon name="account-group" type="material-community" />;
      case 'shopping':
        return <Icon name="shopping" type="material-community" />;
      case 'meal':
        return <Icon name="food" type="material-community" />;
      case 'etc':
        return <Icon name="shopping" type="material-community" />;
      default:
        return <Icon name="progress-question" type="material-community" />;
    }
  }, [category]);

  const categoryColor = React.useMemo(() => {
    switch (category) {
      case 'lodgment':
        return '#7FF954';
      case 'transport':
        return '#79D7FF';
      case 'activity':
        return '#FF8181';
      case 'shopping':
        return '#CB89FF';
      case 'meal':
        return '#FFAB48';
      case 'etc':
        return '#B5B5B5';
      default:
        return '#000000';
    }
  }, [category]);

  return (
    <View style={styles.expenditureItem}>
      <View
        style={[
          styles.expenditureCategory,
          {
            backgroundColor: categoryColor,
          },
        ]}>
        {renderIcon()}
      </View>
      <View style={STYLES.FLEX(1)}>
        <View style={STYLES.FLEX_ROW_ALIGN_CENTER}>
          <Text style={[styles.expenditurePrice, STYLES.FLEX(1)]}>
            {total_price.toLocaleString()} {currency_code}
          </Text>
          <Text style={[styles.expenditureTime, STYLES.MARGIN_LEFT(10)]}>
            {dayjs(payed_at).format('HH:mm')}
          </Text>
        </View>
        <View style={STYLES.FLEX_ROW_ALIGN_CENTER}>
          <Text style={[styles.expenditureName, STYLES.FLEX(1)]}>{name}</Text>
          {has_receipt && (
            <Icon
              name="receipt"
              type="material-community"
              size={14}
              style={STYLES.MARGIN_LEFT(10)}
            />
          )}
        </View>
      </View>
      <Icon
        style={STYLES.MARGIN_LEFT(10)}
        name="chevron-right"
        type="material-community"
        size={20}
      />
    </View>
  );
};

const CurrentBudgetScreen = () => {
  // hooks
  const currentSession = useRecoilValue(sessionAtom);
  const navigation = useNavigation();

  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  const {start_at, end_at} = currentSession;

  const startAt = React.useMemo(() => dayjs(start_at).format('YYYY-MM-DD'), [start_at]);
  const endAt = React.useMemo(() => dayjs(end_at).format('YYYY-MM-DD'), [end_at]);

  // states
  const [defaultCurrency, setDefaultCurrency] = React.useState('');
  const [myBudget, setMyBudget] = React.useState(null);
  const [sessionBudget, setSessionBudget] = React.useState(null);
  const [spentByDay, setSpentByDay] = React.useState(null);

  const [selectedDay, setSelectedDay] = React.useState(null);
  const [expenditures, setExpenditures] = React.useState([]);

  const [refreshing, setRefreshing] = React.useState(false);

  const tripDays = React.useMemo(() => {
    const dates = [];
    let currentDate = dayjs(startAt);

    const total = myBudget?.total || 0;

    while (currentDate.isBefore(endAt) || currentDate.isSame(endAt)) {
      let spent = 0;
      spent = spentByDay?.[currentDate.format('YYYY-MM-DD')] || 0;
      let spentRatio = 0;
      if (total > 0) {
        spentRatio = ((spent / total) * 100).toFixed(2).replace(/\.00$/, '');
      } else if (spent > 0) {
        spentRatio = 100;
      }

      dates.push({
        date: currentDate.format('YYYY-MM-DD'),
        isToday: currentDate.isSame(dayjs(), 'day'),
        spent: spentRatio,
      });
      currentDate = currentDate.add(1, 'day');
    }
    return dates;
  }, [startAt, endAt, spentByDay, myBudget]);

  const previousSpentRatio = React.useMemo(() => {
    const total = myBudget?.total || 0;
    const keys = Object.keys(spentByDay || {});
    let previousSpent = 0;

    for (let i = keys.length - 1; i >= 0; i--) {
      if (dayjs(keys[i]).isBefore(dayjs(tripDays[0].date))) {
        previousSpent += spentByDay?.[keys[i]] || 0;
      }
    }

    if (total > 0) {
      return ((previousSpent / total) * 100).toFixed(2).replace(/\.00$/, '');
    } else if (previousSpent > 0) {
      return 100;
    }
    return 0;
  }, [spentByDay, tripDays, myBudget]);

  const filteredExpenditures = React.useMemo(() => {
    if (selectedDay === 'A') {
      return expenditures;
    }
    if (selectedDay === 'P') {
      return expenditures.filter(item => dayjs(item.payed_at).isBefore(dayjs(tripDays[0].date)));
    }
    return expenditures.filter(item => dayjs(item.payed_at).isSame(dayjs(selectedDay.date), 'day'));
  }, [selectedDay, expenditures, tripDays]);

  // functions
  const onPressAddExpenditure = () => {
    navigation.navigate('AddExpenditure', {
      date: selectedDay?.date,
    });
  };

  const fetchExpenditures = React.useCallback(async () => {
    try {
      const res = await getExpenditures(currentSessionID);
      setExpenditures(res);
    } catch (err) {
      console.error(err);
    }
  }, [currentSessionID]);

  const fetchBudgetSummary = React.useCallback(async () => {
    try {
      const res = await getBudgetSummary(currentSessionID);
      setMyBudget(res.my_budget);
      setSessionBudget(res.session_budget);
      setDefaultCurrency(res.currency_code);
      setSpentByDay(res.spent_by_day);
    } catch (err) {
      console.error(err);
    }
  }, [currentSessionID]);

  const fetchData = React.useCallback(async () => {
    try {
      await fetchBudgetSummary();
      await fetchExpenditures();
    } catch (err) {
      showErrorToast(err);
    }
  }, [fetchBudgetSummary, fetchExpenditures]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchExpenditures]);

  // effects
  React.useEffect(() => {
    if (currentSessionID) {
      fetchData();
    }
  }, [currentSessionID]);

  React.useEffect(() => {
    if (tripDays.some(item => item.isToday)) {
      setSelectedDay(tripDays.find(item => item.isToday));
    } else {
      setSelectedDay('A');
    }
  }, [tripDays]);

  const emptyExpenditureText = React.useMemo(() => {
    if (selectedDay === 'A') {
      return 'No expenditures';
    }
    if (selectedDay === 'P') {
      return 'No previous expenditures';
    }
    return 'No expenditures on this day';
  }, [selectedDay]);

  // 포커스 되면 새로고침을 합니다.
  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, []),
  );

  useFocusEffect(
    React.useCallback(() => {
      if (socket && socket.connected) {
        console.log('Current Budget screen :: socket on');
        socket.on('budget/created', fetchData);
        socket.on('expenditure/created', fetchData);
        socket.on('expenditure/deleted', fetchData);
      }
    }, []),
  );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (socket) {
        console.log('Current Budget screen :: socket off');
        socket.off('budget/created', fetchData);
        socket.off('expenditure/created', fetchData);
        socket.off('expenditure/deleted', fetchData);
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Card myBudget={myBudget} sessionBudget={sessionBudget} currencyCode={defaultCurrency} />
      <View style={[STYLES.FLEX_ROW, STYLES.FLEX(1), STYLES.MARGIN_TOP(10)]}>
        <View
          style={[
            STYLES.WIDTH(60),
            {
              borderRightWidth: 1,
              borderRightColor: '#7D848D',
            },
          ]}>
          <TouchableOpacity
            style={[
              styles.dayItem,
              styles.smallDayItem,
              selectedDay === 'A' && styles.selectedDayItem,
            ]}
            onPress={() => setSelectedDay('A')}>
            <Text style={[styles.day, selectedDay === 'A' && styles.selectedText]}>All</Text>
          </TouchableOpacity>
          <View style={STYLES.PADDING_VERTICAL(5)} />
          <TouchableOpacity
            style={[
              styles.dayItem,
              styles.smallDayItem,
              selectedDay === 'P' && styles.selectedDayItem,
            ]}
            onPress={() => setSelectedDay('P')}>
            <Text style={[styles.day, selectedDay === 'P' && styles.selectedText]}>Pre</Text>
            <Text style={[styles.spent, selectedDay === 'P' && styles.selectedText]}>
              {previousSpentRatio}%
            </Text>
          </TouchableOpacity>
          <View style={STYLES.PADDING_VERTICAL(5)} />
          <View style={styles.divider} />
          <View style={STYLES.PADDING_VERTICAL(5)} />
          <FlatList
            showsVerticalScrollIndicator={false}
            data={tripDays}
            renderItem={({item}) => (
              <DayItem item={item} selectedDay={selectedDay} onPress={() => setSelectedDay(item)} />
            )}
            keyExtractor={item => item.date}
            ItemSeparatorComponent={<View style={STYLES.PADDING_VERTICAL(5)} />}
          />
        </View>
        <FlatList
          style={[STYLES.FLEX(1)]}
          contentContainerStyle={[STYLES.MARGIN_LEFT(10)]}
          data={filteredExpenditures}
          keyExtractor={item => item.expenditure_id}
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('AddExpenditure', {
                  expenditure_id: item.expenditure_id,
                });
              }}>
              <ExpenditureItem item={item} />
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={<View style={STYLES.PADDING_VERTICAL(5)} />}
          ListEmptyComponent={<Text style={styles.infoTxt}>{emptyExpenditureText}</Text>}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
        <FAB style={styles.fab} icon="plus" color={colors.white} onPress={onPressAddExpenditure} />
      </View>
    </View>
  );
};

export default CurrentBudgetScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
  },
  card: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingTop: 15,
    backgroundColor: '#1E222B',
  },
  cardTitle: {
    fontSize: 12,
    color: colors.white,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  front: {
    position: 'absolute',
    backfaceVisibility: 'hidden',
  },
  back: {
    backfaceVisibility: 'hidden',
  },
  boxWrapper: {
    position: 'absolute',
    top: 55,
    alignItems: 'center',
    width: '100%',
  },
  boxText: {
    ...SemiBold(10),
    color: colors.white,
  },
  boxBold: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.white,
  },

  smallDayItem: {
    height: 50,
  },
  dayItem: {
    width: 50,
    height: 90,
    paddingVertical: 12,
    paddingHorizontal: 10,
    ...STYLES.ALIGN_CENTER,
    ...STYLES.JUSTIFY_CENTER,
    borderRadius: 10,
  },
  selectedDayItem: {
    backgroundColor: colors.primary,
  },
  dayName: {
    fontSize: 14,
    color: '#7D848D',
  },
  day: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.black,
  },
  spent: {
    fontSize: 8,
    color: '#7D848D',
  },
  selectedText: {
    color: colors.white,
  },
  divider: {
    width: 50,
    height: 1,
    backgroundColor: '#7D848D',
  },
  fab: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'stretch',
    backgroundColor: colors.primary,
  },
  expenditureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  expenditurePrice: {
    fontSize: 18,
    color: colors.black,
    fontWeight: 'bold',
  },
  expenditureName: {
    fontSize: 14,
    color: '#7D848D',
  },
  expenditureTime: {
    fontSize: 12,
    color: '#7D848D',
  },
  expenditureCategory: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginRight: 22,
  },
  infoTxt: {
    fontSize: 14,
    color: '#7D848D',
    textAlign: 'center',
  },
});
