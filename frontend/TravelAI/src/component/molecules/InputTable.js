import {StyleSheet, Text, View, FlatList, TextInput, TouchableOpacity, Alert} from 'react-native';
import React from 'react';
import {FAB, IconButton} from 'react-native-paper';
import colors from '../../theme/colors';
import {STYLES} from '../../styles/Stylesheets';
import {Icon} from '@rneui/themed';
import reactotron from 'reactotron-react-native';

const defaultRow = {
  name: '',
  price: '',
  member: '',
};

const DeleteButtonCell = ({onDelete}) => {
  const onPressDelete = () => {
    Alert.alert('Delete', 'Are you sure to delete this row?', [
      {
        text: 'Cancel',
        onPress: () => {},
      },
      {
        text: 'Delete',
        onPress: onDelete,
      },
    ]);
  };

  return (
    <View style={[styles.tableCell, STYLES.WIDTH(30)]}>
      <TouchableOpacity onPress={onPressDelete}>
        <Icon name="remove-circle-outline" type="ionicon" color="red" size={15} />
      </TouchableOpacity>
    </View>
  );
};

const NameCell = ({item, setData}) => {
  return (
    <View style={[styles.tableCell, STYLES.FLEX(3)]}>
      <TextInput
        style={styles.input}
        value={item?.name}
        onChangeText={text => {
          setData(prev => {
            const newData = [...prev];
            newData[item.index].name = text;
            return newData;
          });
        }}
      />
    </View>
  );
};

const PriceCell = ({item, setData}) => {
  return (
    <View style={[styles.tableCell, styles.priceCellWrapper, STYLES.FLEX(2)]}>
      <TextInput
        style={[styles.input, STYLES.FLEX(1)]}
        textAlign="right"
        keyboardType="numeric"
        value={item?.price}
        onChangeText={text => {
          setData(prev => {
            const newData = [...prev];
            newData[item.index].price = text;
            return newData;
          });
        }}
      />
      <Text>KRW</Text>
    </View>
  );
};

const MemberCell = ({item}) => {
  return (
    <View style={[styles.tableCell, styles.lastCell, STYLES.FLEX(1)]}>
      <TextInput style={styles.input} />
    </View>
  );
};

const TableRow = ({item, setData}) => {
  const {id} = React.useMemo(() => item.item, [item]);

  const onDelete = React.useCallback(() => {
    setData(prev => prev.filter(row => row.id !== id));
  }, [item?.id]);

  return (
    <View style={styles.tableRow}>
      <DeleteButtonCell onDelete={onDelete} />
      <NameCell item={item} setData={setData} />
      <PriceCell item={item} setData={setData} />
      <MemberCell item={item} />
    </View>
  );
};

const InputTable = ({data, setData}) => {
  const onPressAddRow = () => {
    setData([...data, {id: 'id' + Math.random().toString(16).slice(2), ...defaultRow}]);
  };

  return (
    <FlatList
      data={data}
      renderItem={item => <TableRow item={item} setData={setData} />}
      keyExtractor={item => item.id}
      ListFooterComponent={
        <View style={[styles.lastRow, STYLES.PADDING(10)]}>
          <FAB style={styles.fab} icon="plus" color={colors.white} onPress={onPressAddRow} />
        </View>
      }
    />
  );
};

export default InputTable;

const styles = StyleSheet.create({
  input: {
    padding: 0,
  },
  tableCell: {
    justifyContent: 'center',
    padding: 5,
    borderRightWidth: 1,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  lastRow: {
    borderTopWidth: 1,
  },
  priceCellWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  fab: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
});
