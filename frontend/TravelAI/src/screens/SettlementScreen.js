import {FlatList, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import colors from '../theme/colors';
import {FAB} from 'react-native-paper';

const SettlementScreen = () => {
  // state
  const [settlements, setSettlements] = React.useState([]);
  const [refreshing, setRefreshing] = React.useState(false);

  // TODO: fetch settlements from API
  const fetchSettlements = async () => {
    setSettlements([
      {
        id: '1',
        user: 'John Doe',
        profile: 'https://picsum.photos/200/300',
        amount: 100,
      },
    ]);
  };

  React.useEffect(() => {
    fetchSettlements();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList data={settlements} keyExtractor={item => item.id} />
      <FAB style={styles.fab} icon="plus" color={colors.white} />
    </View>
  );
};

export default SettlementScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
  },
});
