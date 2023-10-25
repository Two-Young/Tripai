import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ImageBackground,
  FlatList,
} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import CustomInput from '../component/molecules/CustomInput';
import colors from '../theme/colors';
import {Picker} from '@react-native-picker/picker';
import BottomSheet from '@gorhom/bottom-sheet';
import {STYLES} from '../styles/Stylesheets';
import {getSessionMembers} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import dayjs from 'dayjs';

const FlatListRenderItem = ({data}) => {
  const {item, participants, setParticipants} = data;
  return (
    <View style={styles.individualWrapper}>
      <Text style={[styles.bottomSheetText, styles.individualText]}>{item.item?.username}</Text>
      <TextInput
        style={[styles.bottomSheetText, styles.individualInput, styles.individualText]}
        placeholder="0"
        placeholderTextColor={colors.white}
        textAlign="right"
        keyboardType="numeric"
        value={item.item?.amount}
        onChangeText={text => {
          const newData = [...participants];
          newData[item.index].amount = text;
          setParticipants(newData);
        }}
        onEndEditing={() => {
          const newData = [...participants];
          const target = newData[item.index].amount;
          if (Number(target.replace(/,/g, ''))) {
            newData[item.index].amount = Number(target.replace(/,/g, '')).toLocaleString();
          } else {
            newData[item.index].amount = '';
          }
          setParticipants(newData);
        }}
      />
    </View>
  );
};

const ExpenditureBottomSheet = ({data}) => {
  const {total, setTotal, participants, setParticipants} = data;

  // ref
  const bottomSheetRef = React.useRef(null);
  const totalInputRef = React.useRef(null);

  // variables
  const snapPoints = React.useMemo(() => [65, '50%'], []);

  // callbacks
  const handleSheetChanges = React.useCallback(index => {
    console.log('handleSheetChanges', index);
  }, []);

  const handleEndEditing = () => {
    if (Number(total.replace(/,/g, ''))) {
      setTotal(Number(total.replace(/,/g, '')).toLocaleString());
    } else {
      setTotal('');
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backgroundStyle={styles.bottomSheet}
      handleIndicatorStyle={styles.bottomSheetIndicator}>
      <View style={STYLES.FLEX(1)}>
        <View style={styles.totalWrapper}>
          <Text style={[styles.bottomSheetText, styles.totalText]}>Total</Text>
          <View style={[STYLES.FLEX_ROW, STYLES.FLEX_END]}>
            <Text style={[styles.bottomSheetText, styles.totalText]}>KRW</Text>
            <TextInput
              ref={totalInputRef}
              style={[styles.bottomSheetText, styles.totalInput]}
              value={total}
              placeholder="0"
              placeholderTextColor={colors.white}
              onChangeText={text => setTotal(text)}
              onEndEditing={handleEndEditing}
              textAlign="right"
              keyboardType="numeric"
              onFocus={() => {
                totalInputRef.current.setNativeProps({
                  style: {...styles.totalInput, backgroundColor: '#00000020'},
                });
              }}
              onBlur={() => {
                totalInputRef.current.setNativeProps({
                  style: {...styles.totalInput, backgroundColor: 'transparent'},
                });
              }}
            />
          </View>
        </View>
        <View style={(STYLES.FLEX(1), STYLES.MARGIN_TOP(20))}>
          <FlatList
            contentContainerStyle={styles.bottomSheetFlatList}
            data={participants}
            keyExtractor={item => item.user_id}
            renderItem={item => (
              <FlatListRenderItem
                data={{
                  item: item,
                  participants: participants,
                  setParticipants: setParticipants,
                }}
              />
            )}
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const AddExpenditureScreen = () => {
  // hooks
  const navigation = useNavigation();

  // states
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('food');
  const [time, setTime] = React.useState(dayjs().format('YYYY-MM-DD HH:mm'));
  const [detail, setDetail] = React.useState([]);
  const [total, setTotal] = React.useState('0');
  const [participants, setParticipants] = React.useState([]);
  const [receipt, setReceipt] = React.useState(null);

  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  // functions
  const fetchParticipants = async () => {
    try {
      const res = await getSessionMembers(currentSessionID);
      setParticipants(res.map(el => ({...el, amount: ''})));
    } catch (e) {
      console.error(e);
    }
  };

  const onPressUploadReceipt = async () => {
    try {
      const result = await launchImageLibrary({mediaType: 'photo'});
      if (result.didCancel) {
        return;
      }
      if (result.errorCode) {
        return;
      }
      if (result.errorMessage) {
        return;
      }
      setReceipt(result.assets ? result.assets[0].uri : null);
    } catch (error) {
      throw error;
    }
  };

  const onPressEditReceipt = () => {};

  // effects
  React.useEffect(() => {
    if (currentSessionID) {
      fetchParticipants();
    }
  }, [currentSessionID]);

  return (
    <SafeArea>
      <CustomHeader title="Add Expenditure" rightComponent={<View />} />
      <View style={styles.container}>
        <Picker selectedValue={category} onValueChange={itemValue => setCategory(itemValue)}>
          <Picker.Item label="Food" value="food" />
          <Picker.Item label="Transportation" value="transportation" />
          <Picker.Item label="Shopping" value="shopping" />
          <Picker.Item label="Etc" value="etc" />
        </Picker>
        <CustomInput label={'Name'} value={name} setValue={setName} />
        <CustomInput
          label={'Date'}
          value={time}
          setValue={value => {
            setTime(
              dayjs(time)
                .set('hour', dayjs(value).hour())
                .set('minute', dayjs(value).minute())
                .format('YYYY-MM-DD HH:mm'),
            );
          }}
          type="date"
        />
        <Text style={[styles.label, STYLES.MARGIN_BOTTOM(5), STYLES.MARGIN_TOP(15)]}>Receipt</Text>
        {receipt ? (
          <TouchableOpacity
            style={[styles.receiptButton, {backgroundColor: 'transparent'}]}
            onPress={onPressEditReceipt}>
            <ImageBackground
              style={styles.receiptBackground}
              source={receipt ? {uri: receipt} : null}>
              <View style={styles.overlay} />
              <Text style={styles.receiptText}>Edit Receipt</Text>
            </ImageBackground>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.receiptButton}>
            <Text style={styles.receiptText} onPress={onPressUploadReceipt}>
              Upload Receipt
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <ExpenditureBottomSheet
        data={{
          total: total,
          setTotal: setTotal,
          participants: participants,
          setParticipants: setParticipants,
        }}
      />
    </SafeArea>
  );
};

export default AddExpenditureScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomSheet: {
    backgroundColor: colors.primary,
    color: colors.white,
  },
  bottomSheetIndicator: {
    backgroundColor: colors.white,
  },
  totalWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
  },
  bottomSheetFlatList: {
    paddingHorizontal: 10,
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
  individualWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  individualText: {
    fontSize: 14,
    flex: 1,
  },
  individualInput: {
    margin: 0,
    padding: 0,
    fontSize: 14,
  },
  receiptButton: {
    width: '100%',
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptText: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.white,
  },
  receiptBackground: {
    ...StyleSheet.absoluteFillObject,
    objectFit: 'cover',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
  },
});
