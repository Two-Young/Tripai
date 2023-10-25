import {FlatList, StyleSheet, Text, View} from 'react-native';
import React from 'react';

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

  return (
    <View>
      <FlatList data={settlements} keyExtractor={item => item.id} />
    </View>
  );
};

export default SettlementScreen;

const styles = StyleSheet.create({});
