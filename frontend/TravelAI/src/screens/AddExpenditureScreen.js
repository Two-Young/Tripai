import {StyleSheet, Text, TextInput, TouchableOpacity, View, ImageBackground} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import CustomInput from '../component/molecules/CustomInput';
import colors from '../theme/colors';
import {Picker} from '@react-native-picker/picker';
import BottomSheet, {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import {STYLES} from '../styles/Stylesheets';
import {getSessionMembers} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation} from '@react-navigation/native';
import dayjs from 'dayjs';
import {Icon} from '@rneui/themed';
import Checkbox from '../component/atoms/Checkbox';
import SelectDropdown from 'react-native-select-dropdown';
import Modal from 'react-native-modal';
import userAtom from '../recoil/user/user';
import reactotron from 'reactotron-react-native';
import {Searchbar} from 'react-native-paper';
import {FlatList} from 'react-native';

const FlatListRenderItem = ({data}) => {
  const {item, participants, setParticipants, receipt, setIsFirstSectionVisible, setSelectedUser} =
    data;

  const inputRef = React.useRef(null);

  const onPressItem = React.useCallback(() => {
    setSelectedUser(item.item?.user_id);
    setIsFirstSectionVisible(false);
  }, [data]);

  return (
    <TouchableOpacity style={styles.individualWrapper} disabled={!receipt} onPress={onPressItem}>
      <View style={[STYLES.FLEX_ROW_ALIGN_CENTER, STYLES.FLEX(1)]}>
        {/* <TouchableOpacity style={styles.minusButton}>
          <Icon name="remove" size={12} color={colors.white} />
        </TouchableOpacity> */}
        <Text style={[styles.bottomSheetText, styles.individualText]}>{item.item?.username}</Text>
      </View>
      <TextInput
        ref={inputRef}
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
        onFocus={() => {
          inputRef.current.setNativeProps({
            style: {
              ...styles.bottomSheetText,
              ...styles.individualInput,
              ...styles.individualText,
              backgroundColor: '#00000020',
            },
          });
        }}
        onBlur={() => {
          inputRef.current.setNativeProps({
            style: {
              ...styles.bottomSheetText,
              ...styles.individualInput,
              ...styles.individualText,
              backgroundColor: 'transparent',
            },
          });
        }}
      />
    </TouchableOpacity>
  );
};

const FirstSection = ({data}) => {
  const {
    total,
    setTotal,
    participants,
    setParticipants,
    receipt,
    setIsModalVisible,
    paid,
    setPaid,
    setIsFirstSectionVisible,
    setSelectedUser,
    detail,
  } = data;

  const paidRef = React.useRef(null);

  // effects
  React.useEffect(() => {
    if (!participants.includes(paid)) {
      // 지출자가 지출 멤버가 아니면 초기화
      paidRef.current.reset();
      setPaid(null);
    }
  }, [participants]);

  const onPressDistribute = () => {
    if (detail.length === 0) {
      if (participants.length % 2 === 0 || participants.length % 5 === 0) {
        const newData = [...participants];
        const amount = Number(total.replace(/,/g, '')) / participants.length;
        newData.forEach(el => {
          el.amount = amount.toLocaleString();
        });
        setParticipants(newData);
      } else {
        const rest = Number(total.replace(/,/g, '')) % participants.length;
        const newData = [...participants];
        const amount = (Number(total.replace(/,/g, '')) - rest) / participants.length;
        newData.forEach(el => {
          el.amount = amount.toLocaleString();
        });
        newData[0].amount = (amount + rest).toLocaleString();
        setParticipants(newData);
      }
    } else {
      // TODO:: detail에서 참여자가 있는 항목에 대해서 가격 분배
    }
  };

  return (
    <View style={styles.bottomSheetHideSection}>
      <View style={styles.quickButtonWrap}>
        <TouchableOpacity
          style={[styles.distributeButton, STYLES.MARGIN_RIGHT(5)]}
          onPress={() => setIsModalVisible(true)}>
          <Icon
            name="format-list-bulleted"
            type="material-community"
            size={12}
            color={colors.white}
          />
          <Text style={styles.distributeText}>Edit Participants</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.distributeButton} onPress={onPressDistribute}>
          <Icon
            name="format-list-bulleted"
            type="material-community"
            size={12}
            color={colors.white}
          />
          <Text style={styles.distributeText}>Distribute</Text>
        </TouchableOpacity>
      </View>
      <BottomSheetFlatList
        contentContainerStyle={styles.bottomSheetFlatList}
        data={participants}
        keyExtractor={item => item.user_id}
        renderItem={item => (
          <FlatListRenderItem
            data={{
              item: item,
              participants: participants,
              setParticipants: setParticipants,
              receipt: receipt,
              setIsFirstSectionVisible: setIsFirstSectionVisible,
              setSelectedUser: setSelectedUser,
            }}
          />
        )}
      />
      <SelectDropdown
        ref={paidRef}
        data={participants.map(el => el.username)}
        onSelect={(selectedItem, index) => {
          setPaid(participants[index].user_id);
        }}
        defaultButtonText="Select who paid"
        buttonStyle={styles.dropdown2BtnStyle}
        buttonTextStyle={[styles.dropdown2BtnTxtStyle]}
        buttonTextAfterSelection={(selectedItem, index) => {
          return selectedItem + ' Payed';
        }}
        dropdownStyle={styles.dropdown1DropdownStyle}
        rowStyle={styles.dropdown1RowStyle}
        rowTextStyle={styles.dropdown2RowTxtStyle}
      />
    </View>
  );
};

const SecondSectionFlatListRenderItem = ({data}) => {
  const {selectedUser, item, setParticipants, receipt, detail, setDetail} = data;

  const checked = React.useMemo(() => {
    return item.participants.includes(selectedUser);
  }, [data]);

  const onChecked = () => {
    if (checked) {
      const newData = [...detail];
      const index = newData.findIndex(el => el.name === item.name);
      if (index !== -1) {
        const participantIndex = newData[index].participants.findIndex(el => el === selectedUser);
        if (participantIndex !== -1) {
          newData[index].participants.splice(participantIndex, 1);
          setDetail(newData);
        }
      }
    } else {
      const newData = [...detail];
      const index = newData.findIndex(el => el.name === item.name);
      if (index !== -1) {
        newData[index].participants.push(selectedUser);
        setDetail(newData);
      }
    }
  };

  return (
    <View style={[STYLES.FLEX_ROW, STYLES.SPACE_BETWEEN, STYLES.PADDING_VERTICAL(5)]}>
      <Text
        style={[
          styles.bottomSheetText,
          styles.individualText,
          {
            color: '#B5CAE8',
          },
        ]}>
        {item.name}
      </Text>
      <View style={[STYLES.FLEX_ROW_ALIGN_CENTER]}>
        <Text style={[styles.bottomSheetText, styles.individualText, STYLES.MARGIN_RIGHT(10)]}>
          {item.price}
        </Text>
        <Checkbox checked={checked} onPressCheckbox={onChecked} mode={'white'} />
      </View>
    </View>
  );
};

const SecondSection = ({data}) => {
  const {
    user,
    participants,
    detail,
    setDetail,
    selectedUser,
    setSelectedUser,
    setIsFirstSectionVisible,
  } = data;

  const selectDropdownValue = React.useMemo(() => {
    const index = participants.findIndex(el => el.user_id === selectedUser);
    return participants[index].username;
  }, [selectedUser]);

  const selectedUserTotal = React.useMemo(() => {
    return detail
      .reduce((acc, cur) => {
        if (cur.participants.includes(selectedUser)) {
          if (cur.participants.length % 2 === 0 || cur.participants.length % 5 === 0) {
            return acc + Number(cur.price.replace(/,/g, '')) / cur.participants.length;
          } else {
            const rest = Number(cur.price.replace(/,/g, '')) % cur.participants.length;
            return (
              acc +
              (Number(cur.price.replace(/,/g, '')) - rest) / cur.participants.length +
              (participants[0].user_id === selectedUser ? rest : 0)
            );
          }
        } else {
          return acc;
        }
      }, 0)
      .toLocaleString();
  }, [data]);

  return (
    <View style={styles.bottomSheetHideSection}>
      <View style={styles.secondSectionHeader}>
        <TouchableOpacity
          onPress={() => {
            setIsFirstSectionVisible(true);
          }}>
          <Icon name="arrow-left" type="material-community" color={colors.white} />
        </TouchableOpacity>
        <SelectDropdown
          data={participants.map(el => el.username)}
          defaultValue={selectDropdownValue}
          onSelect={(selectedItem, index) => {
            setSelectedUser(participants[index].user_id);
          }}
          buttonStyle={styles.dropdown3BtnStyle}
          buttonTextStyle={[styles.dropdown3BtnTxtStyle]}
          renderCustomizedButtonChild={(selectedItem, index) => {
            return (
              <View
                style={[STYLES.FLEX_ROW, STYLES.SPACE_BETWEEN, STYLES.FLEX_CENTER, STYLES.FLEX(1)]}>
                <Icon
                  name="account-multiple"
                  type="material-community"
                  color={'#5179B5'}
                  size={16}
                  style={STYLES.MARGIN_RIGHT(5)}
                />
                <Text style={styles.dropdown3BtnTxtStyle}>{selectedItem}</Text>
              </View>
            );
          }}
          renderDropdownIcon={isOpen => {
            return (
              <Icon
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                type="material-community"
                color={'#5179B5'}
              />
            );
          }}
          dropdownIconPosition="right"
          dropdownStyle={styles.dropdown1DropdownStyle}
          rowStyle={styles.dropdown3RowStyle}
          rowTextStyle={styles.dropdown3RowTxtStyle}
        />
      </View>
      <View>
        <View style={[STYLES.FLEX_ROW, STYLES.SPACE_BETWEEN, STYLES.PADDING_VERTICAL(5)]}>
          <Text style={[styles.bottomSheetText, styles.individualText]}>TOTAL</Text>
          <Text style={[styles.bottomSheetText, styles.individualText, styles.userTotalTxt]}>
            {selectedUserTotal}
          </Text>
        </View>
      </View>
      <BottomSheetFlatList
        data={detail}
        keyExtractor={item => item.name}
        renderItem={({item}) => <SecondSectionFlatListRenderItem data={{...data, item}} />}
      />
      <Text style={styles.infoTxt}>select items that you occupied.</Text>
    </View>
  );
};

const ExpenditureBottomSheet = ({data}) => {
  const [isFirstSectionVisible, setIsFirstSectionVisible] = React.useState(true);
  const [selectedUser, setSelectedUser] = React.useState(null); // 선택한 멤버

  const {
    total,
    setTotal,
    participants,
    setParticipants,
    detail,
    setDetail,
    receipt,
    setIsModalVisible,
    paid,
    setPaid,
  } = data;

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
        <View style={styles.bottomSheetHide}>
          {isFirstSectionVisible ? (
            <FirstSection
              data={{
                ...data,
                setIsFirstSectionVisible: setIsFirstSectionVisible,
                setSelectedUser: setSelectedUser,
              }}
            />
          ) : (
            <SecondSection
              data={{
                ...data,
                setIsFirstSectionVisible: setIsFirstSectionVisible,
                selectedUser: selectedUser,
                setSelectedUser: setSelectedUser,
              }}
            />
          )}
        </View>
      </View>
    </BottomSheet>
  );
};

const ManageParticipantsModal = ({data}) => {
  const {isVisible, setIsVisible, participants, setParticipants, members} = data;

  const [search, setSearch] = React.useState('');

  const filteredMembers = React.useMemo(() => {
    return members.filter(el => el.username.includes(search));
  }, [members, search]);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={() => {
        setIsVisible(false);
      }}>
      <View style={styles.container}>
        <Text>Manage Participants</Text>
        <Searchbar value={search} onChangeText={setSearch} placeholder="Search" />
        <FlatList
          data={filteredMembers}
          keyExtractor={item => item.user_id}
          renderItem={({item}) => (
            <View style={[STYLES.FLEX_ROW, STYLES.SPACE_BETWEEN, STYLES.PADDING_VERTICAL(5)]}>
              <Text>{item.username}</Text>
              <Checkbox
                checked={participants.map(el => el.user_id).includes(item.user_id)}
                onPressCheckbox={() => {
                  const newData = [...participants];
                  if (participants.map(el => el.user_id).includes(item.user_id)) {
                    const index = newData.findIndex(el => el.user_id === item.user_id);
                    if (index !== -1) {
                      newData.splice(index, 1);
                      setParticipants(newData);
                    }
                  } else {
                    newData.push(item);
                    setParticipants(newData);
                  }
                }}
              />
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

const AddExpenditureScreen = () => {
  // hooks
  const navigation = useNavigation();
  const user = useRecoilValue(userAtom);

  // states
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [time, setTime] = React.useState(dayjs().format('YYYY-MM-DD HH:mm'));
  const [total, setTotal] = React.useState('');

  const [members, setMembers] = React.useState([]); // 현재 세션 멤버

  const [participants, setParticipants] = React.useState([
    {
      user_id: user?.user_info?.user_id,
      username: user?.user_info?.username,
      amount: '',
    },
  ]); // 지출 멤버, 기본은 자기 자신

  const [paid, setPaid] = React.useState(user?.user_info?.user_id); // 지출자, 기본은 자기 자신

  const [receipt, setReceipt] = React.useState(null);
  const [detail, setDetail] = React.useState([
    {
      name: 'Cola 2.0L',
      price: '6,350',
      participants: [],
    },
    {
      name: 'Organic Salad',
      price: '23,000',
      participants: [],
    },
  ]);

  const [isBottomSheetOpen, setIsBottomSheetOpen] = React.useState(true);
  const [isModalVisible, setIsModalVisible] = React.useState(false);

  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  // functions
  const fetchParticipants = async () => {
    try {
      const res = await getSessionMembers(currentSessionID);
      setMembers(res);
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

  const onPressEditReceipt = () => {
    navigation.navigate('EditReceipt', {
      receipt: receipt,
    });
  };

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
        <Text style={[styles.label, STYLES.MARGIN_BOTTOM(5), STYLES.MARGIN_TOP(15)]}>Category</Text>
        <SelectDropdown
          data={['meal', 'lodgement', 'transportation', 'shopping', 'activity', 'etc']}
          onSelect={(selectedItem, index) => {
            setCategory(selectedItem);
          }}
          defaultButtonText="Select Category"
          buttonStyle={styles.dropdown1BtnStyle}
          buttonTextStyle={styles.dropdown1BtnTxtStyle}
          renderDropdownIcon={isOpen => {
            return (
              <Icon
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                type="material-community"
                color={colors.black}
              />
            );
          }}
          dropdownIconPosition="right"
          dropdownStyle={styles.dropdown1DropdownStyle}
          rowStyle={styles.dropdown1RowStyle}
          rowTextStyle={styles.dropdown1RowTxtStyle}
        />
        <CustomInput
          label={'Name'}
          value={name}
          setValue={setName}
          onFocus={() => setIsBottomSheetOpen(false)}
          onBlur={() => setIsBottomSheetOpen(true)}
        />
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
          <TouchableOpacity style={styles.receiptButton} onPress={onPressUploadReceipt}>
            <Text style={styles.receiptText}>Upload Receipt</Text>
          </TouchableOpacity>
        )}
      </View>
      {isBottomSheetOpen && (
        <ExpenditureBottomSheet
          data={{
            total: total,
            setTotal: setTotal,
            participants: participants,
            setParticipants: setParticipants,
            detail: detail,
            setDetail: setDetail,
            receipt: receipt,
            setIsModalVisible: setIsModalVisible,
            paid: paid,
            setPaid: setPaid,
          }}
        />
      )}
      <ManageParticipantsModal
        data={{
          isVisible: isModalVisible,
          setIsVisible: setIsModalVisible,
          participants: participants,
          setParticipants: setParticipants,
          members: members,
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
    width: 39,
    height: 3,
  },
  bottomSheetHide: {
    flexDirection: 'row',
    flex: 1,
    width: '100%',
    backgroundColor: '#1D3E71',
    color: colors.white,
    marginTop: 10,
  },
  bottomSheetHideSection: {
    flex: 1,
    padding: 15,
  },
  totalWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
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
  individualWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  individualText: {
    fontSize: 14,
  },
  individualInput: {
    margin: 0,
    paddingVertical: 0,
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
  minusButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  distributeButton: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: '#376BB9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  distributeText: {
    marginLeft: 5,
    fontSize: 12,
    color: colors.white,
  },
  secondSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  quickButtonWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 5,
  },
  userTotalTxt: {
    fontSize: 14,
    color: colors.white,
    fontWeight: 'bold',
  },
  infoTxt: {
    fontSize: 12,
    color: colors.white,
    textAlign: 'center',
    marginTop: 5,
  },
  dropdown1BtnStyle: {
    width: '100%',
    backgroundColor: '#76768012',
    borderRadius: 5,
    padding: 8,
  },
  dropdown1BtnTxtStyle: {
    fontSize: 17,
    color: colors.black,
    textAlign: 'left',
  },
  dropdown1DropdownStyle: {backgroundColor: '#EFEFEF'},
  dropdown1RowStyle: {backgroundColor: '#EFEFEF', borderBottomColor: '#C5C5C5'},
  dropdown1RowTxtStyle: {color: colors.black, textAlign: 'left'},
  divider: {width: 12},
  dropdown2BtnStyle: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 5,
    padding: 8,
  },
  dropdown2BtnTxtStyle: {
    fontSize: 17,
    color: colors.white,
    textAlign: 'center',
  },
  dropdown2RowTxtStyle: {
    fontSize: 17,
    color: colors.black,
    textAlign: 'center',
  },
  dropdown3BtnStyle: {
    backgroundColor: '#00000021',
    borderRadius: 20,
    height: 30,
    width: 150,
  },
  dropdown3BtnTxtStyle: {
    fontSize: 14,
    color: '#5179B5',
    textAlign: 'center',
  },
  dropdown3RowStyle: {
    backgroundColor: '#EFEFEF',
    borderBottomColor: '#C5C5C5',
    height: 30,
  },
  dropdown3RowTxtStyle: {
    fontSize: 14,
    color: colors.black,
    textAlign: 'center',
  },
});
