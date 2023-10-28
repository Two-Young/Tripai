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
import {FAB, List} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';

const Card = ({children, style}) => {
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

  return (
    <Pressable onPress={() => (flipRotation ? flipToBack() : flipToFront())}>
      <Animated.View style={[styles.card, styles.front, flipToFrontStyle]}>
        <View style={STYLES.ALIGN_CENTER}>
          <AnimatedCircularProgress
            size={250}
            rotation={265}
            arcSweepAngle={190}
            width={15}
            fill={70}
            tintColor="orange"
            backgroundColor="black"
          />
          <View style={styles.boxWrapper}>
            <Text style={styles.boxText}>You spent 70.14%</Text>
            <Text style={styles.boxBold}>₩1,390,989</Text>
            <Text style={styles.boxText}>of ₩1,905,740</Text>
          </View>
        </View>
      </Animated.View>
      <Animated.View style={[styles.card, styles.back, flipToBackStyle]}>
        <View style={STYLES.ALIGN_CENTER}>
          <AnimatedCircularProgress
            style={{transform: [{rotateY: '180deg'}]}}
            size={250}
            rotation={265}
            arcSweepAngle={190}
            width={15}
            fill={30}
            tintColor="lightgreen"
            backgroundColor="black"
          />
          <View style={styles.boxWrapper}>
            <Text style={styles.boxText}>You have 29.86%</Text>
            <Text style={styles.boxBold}>₩690,989</Text>
            <Text style={styles.boxText}>of ₩1,905,740</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
};

const DayItem = ({item, selectedDay, onPress}) => {
  const {dayName, date, isToday} = item;

  const day = React.useMemo(() => dayjs(date).format('DD'), [date]);
  const month = React.useMemo(() => dayjs(date).format('MMM'), [date]);

  const isSelected = React.useMemo(() => selectedDay?.date === date, [selectedDay, date]);

  return (
    <TouchableOpacity
      style={[styles.dayItem, styles.smallDayItem, isSelected && styles.selectedDayItem]}
      onPress={onPress}>
      <View style={STYLES.ALIGN_CENTER}>
        <Text style={[styles.day, isSelected && styles.selectedText]}>{day}</Text>
      </View>
    </TouchableOpacity>
  );
};

const CurrentBudgetScreen = () => {
  // hooks
  const currentSession = useRecoilValue(sessionAtom);
  const navigation = useNavigation();

  const {start_at, end_at} = currentSession;

  const startAt = React.useMemo(() => dayjs(start_at).format('YYYY-MM-DD'), [start_at]);
  const endAt = React.useMemo(() => dayjs(end_at).format('YYYY-MM-DD'), [end_at]);

  const tripDays = React.useMemo(() => {
    const dates = [];
    let currentDate = dayjs(startAt);

    while (currentDate.isBefore(endAt) || currentDate.isSame(endAt)) {
      dates.push({
        dayName: currentDate.format('ddd'),
        date: currentDate.format('YYYY-MM-DD'),
        isToday: currentDate.isSame(dayjs(), 'day'),
      });
      currentDate = currentDate.add(1, 'day');
    }
    return dates;
  }, [startAt, endAt]);

  // states
  const [budget, setBudget] = React.useState(0);
  const [spent, setSpent] = React.useState(0);
  const [selectedDay, setSelectedDay] = React.useState();
  const [expenditures, setExpenditures] = React.useState([
    {
      id: 1,
      name: 'test',
      amount: 10000,
    },
  ]);

  const [open, setOpen] = React.useState(false);

  const spentPercent = React.useMemo(() => (spent / budget) * 100, [spent, budget]);
  const remaining = React.useMemo(() => budget - spent, [budget, spent]);
  const remainingPercent = React.useMemo(() => (remaining / budget) * 100, [remaining, budget]);

  // functions
  const onStateChange = ({open}) => setOpen(open);

  const onPressAddExpenditure = () => {
    navigation.navigate('AddExpenditure', {
      date: selectedDay?.date,
    });
  };

  return (
    <View style={styles.container}>
      <Card />
      <View style={[STYLES.FLEX_ROW, STYLES.FLEX(1), STYLES.MARGIN_TOP(10)]}>
        <View style={[STYLES.WIDTH(60)]}>
          <TouchableOpacity
            style={[
              styles.dayItem,
              styles.smallDayItem,
              selectedDay === 'A' && styles.selectedDayItem,
            ]}
            onPress={() => setSelectedDay('A')}>
            <Text style={[styles.day, selectedDay === 'A' && styles.selectedText]}>A</Text>
          </TouchableOpacity>
          <View style={STYLES.PADDING_VERTICAL(5)} />
          <TouchableOpacity
            style={[
              styles.dayItem,
              styles.smallDayItem,
              selectedDay === 'P' && styles.selectedDayItem,
            ]}
            onPress={() => setSelectedDay('P')}>
            <Text style={[styles.day, selectedDay === 'P' && styles.selectedText]}>P</Text>
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
          data={expenditures}
          renderItem={({item}) => (
            <List.Item
              title={item?.name}
              description={item?.amount}
              left={props => <List.Icon {...props} icon="folder" />}
              backgroundColor="#f2f2f2"
            />
          )}
          ItemSeparatorComponent={<View style={STYLES.PADDING_VERTICAL(5)} />}
          ListEmptyComponent={<Text>Empty</Text>}
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
    padding: 30,
    backgroundColor: '#1E222B',
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
  month: {
    fontSize: 12,
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
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
});
