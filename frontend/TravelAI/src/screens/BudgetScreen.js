import {StyleSheet, Text, View, FlatList, Pressable} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {Header} from '@rneui/themed';
import colors from '../theme/colors';
import {FAB, List} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useRecoilValue} from 'recoil';
import {getReceipts, getSessionCurrencies} from '../services/api';
import sessionAtom from '../recoil/session/session';

const BudgetScreen = () => {
  // hooks
  const navigation = useNavigation();
  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  // states
  const [receipts, setReceipts] = React.useState([]);
  const [sessionCurrencies, setSessionCurrencies] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [fabState, setFabState] = React.useState({
    open: false,
  });

  // functions
  const fetchReceipts = async () => {
    try {
      const res = await getReceipts(currentSessionID);
      setReceipts(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSessionCurrencies = async () => {
    try {
      const res = await getSessionCurrencies(currentSessionID);
      setSessionCurrencies(res);
    } catch (err) {
      console.error(err);
    }
  };

  const onFabStateChange = ({open}) => setFabState({open});

  const navigateToSplitBill = () => {
    navigation.navigate('SplitBill');
  };

  const navigateToCustomSplit = () => {
    navigation.navigate('CustomSplit');
  };

  const onRefresh = () => {
    try {
      setRefreshing(true);
      fetchReceipts();
    } finally {
      setRefreshing(false);
    }
  };

  // effects
  React.useEffect(() => {
    fetchReceipts();
  }, []);

  React.useEffect(() => {
    if (currentSessionID) {
      fetchSessionCurrencies(currentSessionID);
    }
  }, [currentSessionID]);

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
          centerComponent={{text: 'Budget', style: defaultStyle.heading}}
        />
        <View style={defaultStyle.container}>
          <FlatList
            data={receipts}
            renderItem={({item}) => (
              <List.Item
                title={item?.receipt_id}
                description={item?.name}
                left={props => <List.Icon {...props} icon="folder" />}
                onPress={() =>
                  navigation.navigate('Receipt', {
                    receipt_id: item.receipt_id,
                  })
                }
              />
            )}
            keyExtractor={item => item?.receipt_id}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        </View>
        <FAB.Group
          open={fabState.open}
          icon={fabState.open ? 'close' : 'plus'}
          actions={[
            {icon: 'plus', label: '1/N', onPress: navigateToSplitBill},
            {icon: 'star', label: 'Custom', onPress: navigateToCustomSplit},
          ]}
          onStateChange={onFabStateChange}
          onPress={() => {
            if (fabState.open) {
              // do something if the speed dial is open
            }
          }}
          color="#fff"
          fabStyle={styles.fab}
        />
      </View>
    </SafeAreaView>
  );
};

export default BudgetScreen;

const styles = StyleSheet.create({
  fab: {
    backgroundColor: colors.primary,
  },
});
