import {ImageBackground, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import InputTable from '../component/molecules/InputTable';
import colors from '../theme/colors';
import {STYLES} from './../styles/Stylesheets';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import {AvoidSoftInput, AvoidSoftInputView} from 'react-native-avoid-softinput';

const EditReceiptScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();

  // states
  const [data, setData] = React.useState([]);
  const [currency, setCurrency] = React.useState('');
  const [receipt, setReceipt] = React.useState(null);

  // memos
  const total = React.useMemo(() => {
    return data
      .reduce((acc, cur) => {
        return acc + Number(cur.price.replace(/,/g, ''));
      }, 0)
      .toLocaleString();
  }, [data]);

  React.useEffect(() => {
    if (route.params) {
      const {receipt: paramReceipt} = route.params;
      setReceipt(paramReceipt);
    }
  }, [route.params]);

  const onFocusEffect = React.useCallback(() => {
    // This should be run when screen gains focus - enable the module where it's needed
    AvoidSoftInput.setShouldMimicIOSBehavior(true);
    return () => {
      // This should be run when screen loses focus - disable the module where it's not needed, to make a cleanup
      AvoidSoftInput.setShouldMimicIOSBehavior(false);
    };
  }, []);

  useFocusEffect(onFocusEffect); // register callback to focus events

  return (
    <SafeArea>
      <CustomHeader
        title="Edit Receipt"
        rightComponent={
          <View>
            <TouchableOpacity>
              <Text>Save</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <View style={styles.container}>
        {receipt && (
          <ImageBackground source={{uri: receipt}} style={styles.receiptImage} resizeMode="cover">
            <TouchableOpacity style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete Receipt</Text>
            </TouchableOpacity>
          </ImageBackground>
        )}
        <AvoidSoftInputView style={STYLES.FLEX(1)}>
          <InputTable data={data} setData={setData} />
        </AvoidSoftInputView>
      </View>
      <View style={styles.footer}>
        <Text style={[styles.bottomSheetText, styles.totalText]}>Total</Text>
        <View style={[STYLES.FLEX_ROW, STYLES.FLEX_END]}>
          <Text style={[styles.bottomSheetText, styles.totalText]}>KRW</Text>
          <Text style={[styles.bottomSheetText, styles.totalInput]}>{total}</Text>
        </View>
      </View>
    </SafeArea>
  );
};

export default EditReceiptScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  receiptImage: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'flex-end',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingVertical: 5,
    backgroundColor: colors.primary,
    height: 45,
  },
  deleteButton: {
    width: '100%',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7A0000',
    opacity: 0.78,
  },
  deleteButtonText: {
    fontSize: 14,
    color: colors.white,
  },
  bottomSheetFlatList: {
    paddingLeft: 10,
    paddingRight: 5,
  },
  bottomSheetText: {
    color: colors.white,
  },
  totalText: {
    fontSize: 16,
  },
  totalInput: {
    margin: 0,
    marginLeft: 10,
    paddingHorizontal: 5,
    paddingVertical: 0,
    fontSize: 24,
    fontWeight: 'bold',
    borderRadius: 5,
  },
});
