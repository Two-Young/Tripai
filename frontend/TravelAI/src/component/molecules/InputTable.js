import {StyleSheet, View, TextInput, TouchableOpacity, Alert, FlatList} from 'react-native';
import React from 'react';
import {Button} from 'react-native-paper';
import {STYLES} from '../../styles/Stylesheets';
import {Icon} from '@rneui/themed';
import colors from '../../theme/colors';

const defaultRow = {
  label: '',
  price: '',
  allocations: [],
};

const DeleteButtonCell = ({onDelete}) => {
  return (
    <View style={[styles.tableCell, STYLES.WIDTH(30)]}>
      <TouchableOpacity onPress={onDelete}>
        <Icon name="remove-circle-outline" type="ionicon" color={colors.black} size={15} />
      </TouchableOpacity>
    </View>
  );
};

const NameCell = ({item, setData}) => {
  const inputRef = React.useRef(null);

  return (
    <View style={[styles.tableCell, STYLES.FLEX(3)]}>
      <TextInput
        ref={inputRef}
        style={[styles.input, styles.name]}
        placeholder="Item Name"
        placeholderTextColor={colors.gray}
        value={item ? item.item.label : ''}
        onChangeText={text => {
          setData(prev => {
            const newData = [...prev];
            newData[item.index].label = text;
            return newData;
          });
        }}
        onFocus={() => {
          inputRef.current.setNativeProps({
            style: {
              ...styles.input,
              ...styles.name,
              backgroundColor: '#00000020',
            },
          });
        }}
        onBlur={() => {
          inputRef.current.setNativeProps({
            style: {
              ...styles.input,
              ...styles.name,
              backgroundColor: 'transparent',
            },
          });
        }}
      />
    </View>
  );
};

const PriceCell = ({item, setData}) => {
  const inputRef = React.useRef(null);

  return (
    <View style={[styles.tableCell, styles.priceCellWrapper, STYLES.FLEX(2)]}>
      <TextInput
        ref={inputRef}
        style={[styles.input, STYLES.FLEX(1)]}
        textAlign="right"
        keyboardType="numeric"
        value={item ? item.item.price : ''}
        placeholder="0"
        placeholderTextColor={colors.gray}
        onChangeText={text => {
          setData(prev => {
            const newData = [...prev];
            newData[item.index].price = text;
            return newData;
          });
        }}
        onEndEditing={() => {
          setData(prev => {
            const newData = [...prev];
            const target = newData[item.index].price;
            console.log(target);
            if (Number(target.replace(/,/g, ''))) {
              newData[item.index].price = Number(target.replace(/,/g, '')).toLocaleString();
            } else {
              newData[item.index].price = '';
            }
            console.log(newData[item.index].price);
            return newData;
          });
        }}
        onFocus={() => {
          inputRef.current.setNativeProps({
            style: {
              ...styles.input,
              ...STYLES.FLEX(1),
              backgroundColor: '#00000020',
            },
          });
        }}
        onBlur={() => {
          inputRef.current.setNativeProps({
            style: {
              ...styles.input,
              ...STYLES.FLEX(1),
              backgroundColor: 'transparent',
            },
          });
        }}
      />
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
    </View>
  );
};

const InputTable = ({data, setData, ListHeaderComponent}) => {
  const onPressAddRow = () => {
    setData([...data, {id: 'id' + Math.random().toString(16).slice(2), ...defaultRow}]);
  };

  return (
    <FlatList
      data={data}
      renderItem={item => <TableRow item={item} setData={setData} />}
      keyExtractor={item => item.id}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        <View style={[styles.lastRow, STYLES.PADDING(10)]}>
          <Button mode="contained" icon="plus" rippleColor={'#00000080'} onPress={onPressAddRow}>
            Add Item
          </Button>
        </View>
      }
    />
  );
};

export default InputTable;

const styles = StyleSheet.create({
  input: {
    padding: 0,
    fontSize: 16,
  },
  tableCell: {
    justifyContent: 'center',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
  },
  priceCellWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  name: {
    color: '#5473A1',
  },
});
