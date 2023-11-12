import {FlatList, StyleSheet, Text, View, Image} from 'react-native';
import React, {useCallback} from 'react';
import colors from '../theme/colors';
import {Medium} from '../theme/fonts';
import {requestAlert} from '../utils/utils';
import {IconButton, Tooltip} from 'react-native-paper';
import {STYLES} from '../styles/Stylesheets';
import SettlementSummary from '../component/molecules/SettlementSummary';
import infoIcon from '../assets/images/information-circle-sharp.png';
import closeIcon from '../assets/images/close-icon.png';
import {Regular} from '../theme/fonts';
import {completeSettlement, getSettlement, getSessionMembers} from '../services/api';
import {showErrorToast} from '../utils/utils';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {socket} from '../services/socket';
import {formatWithCommas} from '../utils/number';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

const SettlementScreen = () => {
  const currentSession = useRecoilValue(sessionAtom);

  const navigation = useNavigation();

  // state
  const [sessionUsers, setSessionUsers] = React.useState([]);
  const [settlement, setSettlement] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(true);

  // TODO: fetch settlements from API

  const fetchSessionUsers = React.useCallback(async () => {
    try {
      const res = await getSessionMembers(currentSession.session_id);
      setSessionUsers(res);
    } catch (err) {
      console.error(err);
    }
  }, [currentSession]);

  const fetchSettlements = async () => {
    try {
      const data = await getSettlement(currentSession.session_id);
      setSettlement(data);
    } catch (err) {
      showErrorToast(err);
    }
  };

  const confirmReceive = async item => {
    try {
      const {target_user_id, amount, currency_code} = item;
      await completeSettlement(currentSession.session_id, target_user_id, amount, currency_code);
      fetchSettlements();
    } catch (err) {
      showErrorToast(err);
    }
  };

  const renderItem = useCallback(
    ({item}) => {
      const getTypeColor = type => {
        if (type) {
          return '#FF8181';
        }
        return colors.primary;
      };

      const targetUsername =
        sessionUsers?.find(user => user.user_id === item.target_user_id)?.username ??
        '(deleted user)';

      return (
        <View
          style={[STYLES.FLEX_ROW_ALIGN_CENTER, STYLES.SPACE_BETWEEN, STYLES.MARGIN_VERTICAL(2)]}>
          <View style={[STYLES.FLEX_ROW_ALIGN_CENTER]}>
            <View style={[styles.settlementType, {backgroundColor: getTypeColor(item.owed)}]}>
              <Text style={[styles.settlementTypeText]}>{item.owed ? 'DEPT' : 'RECV'}</Text>
            </View>
            <Text style={[STYLES.MARGIN_LEFT(8), styles.username]}>{targetUsername}</Text>
          </View>
          <View style={[STYLES.FLEX_ROW_ALIGN_CENTER]}>
            <Text style={[styles.amountText]}>
              {formatWithCommas(item?.amount)} {item.currency_code}
            </Text>
            {!item.owed && (
              <IconButton
                icon={closeIcon}
                iconColor={colors.gray}
                size={12}
                style={{margin: 0, padding: 0}}
                onPress={() => {
                  requestAlert(
                    'Confirm receive',
                    `Are you sure to confirm budget settlement from ${targetUsername}?`,
                    () => confirmReceive(item),
                  );
                }}
              />
            )}
          </View>
        </View>
      );
    },
    [sessionUsers],
  );

  // effects
  React.useEffect(() => {
    if (refreshing) {
      Promise.all([fetchSessionUsers(), fetchSettlements()]).finally(() => {
        setRefreshing(false);
      });
    }
  }, [refreshing]);

  React.useEffect(() => {
    if (currentSession?.session_id) {
      Promise.all([fetchSessionUsers(), fetchSettlements()]);
    }
  }, [currentSession]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([fetchSessionUsers(), fetchSettlements()]);
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (socket && socket.connected) {
        console.log('Settlement screen :: socket on');
        socket.on('settlement/changed', fetchSettlements);
        socket.on('budget/created', fetchSettlements);
      }
    }, []),
  );

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      if (socket) {
        console.log('Settlement screen :: socket off');
        socket.off('budget/created', fetchSettlements);
        socket.off('settlement/changed', fetchSettlements);
      }
    });

    return () => unsubscribe();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={
          <View>
            <SettlementSummary
              title="Total Session Usage"
              settlements={Object.keys(settlement?.session_usage ?? {})?.map(key => ({
                category: key,
                amount: settlement.session_usage[key],
              }))}
              total={settlement?.session_usage?.total_budget}
            />
            <View style={[STYLES.HEIGHT(20)]} />
            <SettlementSummary
              title="My Usage"
              settlements={Object.keys(settlement?.my_usage ?? {})?.map(key => ({
                category: key,
                amount: settlement.my_usage[key],
              }))}
              total={settlement?.my_usage?.total_budget}
            />
            <View style={[STYLES.HEIGHT(20)]} />
            <Tooltip title={'tooltip'}>
              <View style={[STYLES.FLEX_ROW_ALIGN_CENTER, STYLES.MARGIN_BOTTOM(10)]}>
                <Text style={[styles.titleText]}>My Settlement</Text>
                <Image source={infoIcon} style={[styles.infoIcon]} />
              </View>
            </Tooltip>
          </View>
        }
        contentContainerStyle={[STYLES.PADDING_HORIZONTAL(20), STYLES.PADDING_VERTICAL(10)]}
        data={settlement.settlements}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={() => setRefreshing(true)}
      />
    </View>
  );
};

export default SettlementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  titleText: {
    ...Medium(16),
    color: colors.gray,
  },
  infoIcon: {
    width: 12,
    height: 12,
    marginLeft: 4,
  },
  settlementType: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    borderRadius: 4,
  },
  settlementTypeText: {
    ...Regular(10),
    color: colors.white,
  },
  username: {
    ...Regular(12),
  },
  amountText: {
    ...Regular(12),
  },
});
