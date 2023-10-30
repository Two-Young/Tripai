import {StyleSheet, Text, TextInput, TouchableOpacity, View, Image} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader, {CUSTOM_HEADER_THEME} from '../component/molecules/CustomHeader';
import CustomInput from '../component/molecules/CustomInput';
import colors from '../theme/colors';
import BottomSheet, {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import {STYLES} from '../styles/Stylesheets';
import {
  deleteExpenditure,
  getBudget,
  getExpenditure,
  getExpenditureCategories,
  getSessionCurrencies,
  getSessionMembers,
  postExpenditureReceipt,
  putExpenditure,
} from '../services/api';
import {useRecoilValue} from 'recoil';
import sessionAtom from '../recoil/session/session';
import {launchImageLibrary} from 'react-native-image-picker';
import {useNavigation, useFocusEffect, useRoute} from '@react-navigation/native';
import dayjs from 'dayjs';
import {Icon} from '@rneui/themed';
import Checkbox from '../component/atoms/Checkbox';
import SelectDropdown from 'react-native-select-dropdown';
import Modal from 'react-native-modal';
import userAtom from '../recoil/user/user';
import {ActivityIndicator, Searchbar} from 'react-native-paper';
import {FlatList} from 'react-native';
import {AvoidSoftInput, AvoidSoftInputView} from 'react-native-avoid-softinput';
import InputTable from '../component/molecules/InputTable';
import Fraction from 'fraction.js';
import reactotron from 'reactotron-react-native';
import currenciesAtom from '../recoil/currencies/currencies';
import _ from 'lodash';
import {requestAlert} from '../utils/utils';

const FlatListRenderItem = ({data}) => {
  const {
    item,
    distribution,
    setDistribution,
    members,
    detail,
    setIsFirstSectionVisible,
    setSelectedUser,
  } = data;

  const inputRef = React.useRef(null);

  const onPressItem = React.useCallback(() => {
    setSelectedUser(item.item?.user_id);
    setIsFirstSectionVisible(false);
  }, [data]);

  const userName = React.useMemo(() => {
    const index = members.findIndex(el => el.user_id === item.item?.user_id);
    return members[index].username;
  }, [data]);

  return (
    <TouchableOpacity
      style={styles.individualWrapper}
      disabled={detail.length === 0}
      onPress={onPressItem}>
      <View style={[STYLES.FLEX_ROW_ALIGN_CENTER, STYLES.FLEX(1)]}>
        {/* <TouchableOpacity style={styles.minusButton}>
          <Icon name="remove" size={12} color={colors.white} />
        </TouchableOpacity> */}
        <Text style={[styles.bottomSheetText, styles.individualText]}>{userName}</Text>
      </View>
      <TextInput
        ref={inputRef}
        style={[styles.bottomSheetText, styles.individualInput, styles.individualText]}
        placeholder="0"
        placeholderTextColor={colors.white}
        textAlign="right"
        keyboardType="numeric"
        value={item.item?.amount?.string}
        onChangeText={text => {
          const newData = [...distribution];
          newData[item.index].amount.string = text;
          setDistribution(newData);
        }}
        onEndEditing={() => {
          const newData = [...distribution];
          const target = newData[item.index].amount.string;
          if (Number(target.replace(/,/g, ''))) {
            newData[item.index].amount.string = Number(target.replace(/,/g, '')).toLocaleString();
          } else {
            newData[item.index].amount.string = '';
          }
          setDistribution(newData);
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
    distribution,
    setDistribution,
    setIsModalVisible,
    setIsPMVisible,
    paid,
    setPaid,
    setIsFirstSectionVisible,
    setSelectedUser,
    detail,
    members,
  } = data;

  const onPressDistribute = () => {
    const totalAmount = Number(total.replace(/,/g, ''));
    const totalParticipants = distribution.length;

    const f1 = new Fraction(totalAmount, totalParticipants);
    setDistribution(prev => {
      return prev.map(el => ({
        ...el,
        amount: {
          num: f1.n,
          denom: f1.d,
          string: Number(f1.n / f1.d).toLocaleString(),
        },
      }));
    });
  };

  const paidButtonText = React.useMemo(() => {
    if (paid.length === 0) {
      return 'Select Paid Members';
    }
    if (paid.length === members.length) {
      return 'All Members Paid';
    }
    return `${paid.length} Members Paid`;
  }, [data]);

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
          <Text style={styles.distributeText}>Edit Members</Text>
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
        data={distribution}
        keyExtractor={item => item.user_id}
        renderItem={item => (
          <FlatListRenderItem
            data={{
              item: item,
              distribution: distribution,
              setDistribution: setDistribution,
              detail: detail,
              setIsFirstSectionVisible: setIsFirstSectionVisible,
              setSelectedUser: setSelectedUser,
              members: members,
            }}
          />
        )}
      />
      <TouchableOpacity
        style={styles.dropdown2BtnStyle}
        onPress={() => {
          setIsPMVisible(true);
        }}>
        <Text style={styles.dropdown2BtnTxtStyle}>{paidButtonText}</Text>
      </TouchableOpacity>
    </View>
  );
};

const SecondSectionFlatListRenderItem = ({data}) => {
  const {selectedUser, item, detail, setDetail} = data;

  const checked = React.useMemo(() => {
    return item.allocations.includes(selectedUser);
  }, [data]);

  const onChecked = () => {
    if (checked) {
      const newData = [...detail];
      const index = newData.findIndex(el => el.id === item.id);
      if (index !== -1) {
        const participantIndex = newData[index].allocations.findIndex(el => el === selectedUser);
        if (participantIndex !== -1) {
          newData[index].allocations.splice(participantIndex, 1);
          setDetail(newData);
        }
      }
    } else {
      const newData = [...detail];
      const index = newData.findIndex(el => el.id === item.id);
      if (index !== -1) {
        newData[index].allocations.push(selectedUser);
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
        {item.label}
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
    members,
    distribution,
    detail,
    setDetail,
    selectedUser,
    setSelectedUser,
    setIsFirstSectionVisible,
  } = data;

  const selectDropdownValue = React.useMemo(() => {
    const index = members.findIndex(el => el.user_id === selectedUser);
    return members[index].username;
  }, [data]);

  const participants = React.useMemo(() => {
    return distribution.map(el => {
      const index = members.findIndex(member => member.user_id === el.user_id);
      return {
        ...members[index],
        amount: el.amount,
      };
    });
  }, [data]);

  const selectedUserTotal = React.useMemo(() => {
    return detail
      .reduce((acc, cur) => {
        if (cur.allocations.includes(selectedUser)) {
          if (cur.allocations.length % 2 === 0 || cur.allocations.length % 5 === 0) {
            return acc + Number(cur.price.replace(/,/g, '')) / cur.allocations.length;
          } else {
            const rest = Number(cur.price.replace(/,/g, '')) % cur.allocations.length;
            return (
              acc +
              (Number(cur.price.replace(/,/g, '')) - rest) / cur.allocations.length +
              (distribution[0].user_id === selectedUser ? rest : 0)
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
        data={detail.filter(el => el.label.length > 0 && el.price.length > 0)}
        keyExtractor={item => item.id}
        renderItem={({item}) => <SecondSectionFlatListRenderItem data={{...data, item}} />}
      />
      <Text style={styles.infoTxt}>select items that you occupied.</Text>
    </View>
  );
};

const ExpenditureBottomSheet = ({data}) => {
  const [isFirstSectionVisible, setIsFirstSectionVisible] = React.useState(true);
  const [selectedUser, setSelectedUser] = React.useState(null); // 선택한 멤버

  const {total, setTotal, currencyCode, setCurrencyCode, currencySelectData} = data;

  // ref
  const bottomSheetRef = React.useRef(null);
  const totalInputRef = React.useRef(null);

  // variables
  const snapPoints = React.useMemo(() => [63, '50%'], []);

  // callbacks

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
      backgroundStyle={styles.bottomSheet}
      handleIndicatorStyle={styles.bottomSheetIndicator}>
      <View style={STYLES.FLEX(1)}>
        <View style={styles.totalWrapper}>
          <Text style={[styles.bottomSheetText, styles.totalText]}>Total</Text>
          <View style={[STYLES.FLEX_ROW, STYLES.FLEX_END]}>
            <SelectDropdown
              data={currencySelectData}
              onSelect={(selectedItem, index) => {
                setCurrencyCode(selectedItem);
              }}
              defaultValue={currencyCode}
              buttonStyle={styles.dropdownBtnStyle}
              buttonTextStyle={{
                ...styles.bottomSheetText,
                ...styles.totalText,
              }}
              renderDropdownIcon={isOpen => {
                return (
                  <Icon
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    type="material-community"
                    color={colors.white}
                  />
                );
              }}
              dropdownIconPosition="right"
              dropdownStyle={styles.dropdownDropdownStyle}
              rowStyle={styles.dropdownRowStyle}
              rowTextStyle={styles.dropdownRowTxt}
              search
              searchPlaceHolder="Search..."
              searchInputStyle={styles.dropdownsearchInputStyleStyle}
              searchPlaceHolderColor={'#888888'}
              renderSearchInputLeftIcon={() => (
                <Icon name="magnify" type="material-community" size={20} />
              )}
            />
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

const ManageDistributionModal = ({data}) => {
  const {isVisible, setIsVisible, distribution, setDistribution, members} = data;

  const [search, setSearch] = React.useState('');

  const filteredMembers = React.useMemo(() => {
    return members.filter(el => el.username.includes(search));
  }, [members, search]);

  const allChecked = React.useMemo(() => {
    return members.length === distribution.length;
  }, [data]);

  const onPressAllChecked = React.useCallback(() => {
    if (allChecked) {
      setDistribution([]);
    } else {
      setDistribution(
        members.map(el => ({
          user_id: el.user_id,
          amount: {
            num: 0,
            denom: 0,
            string: '',
          },
        })),
      );
    }
  }, [data]);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={() => {
        setIsVisible(false);
      }}>
      <View style={[styles.modal]}>
        <Text style={styles.modalTitle}>Manage Distribution Members</Text>
        <Searchbar value={search} onChangeText={setSearch} placeholder="Search" />
        {members.length > 0 && (
          <View
            style={[
              STYLES.FLEX_ROW_ALIGN_CENTER,
              {
                justifyContent: 'flex-end',
              },
              STYLES.PADDING_VERTICAL(5),
              STYLES.MARGIN_TOP(10),
            ]}>
            <Text style={[STYLES.MARGIN_RIGHT(5), styles.modalText]}>Include All</Text>
            <Checkbox checked={allChecked} onPressCheckbox={onPressAllChecked} />
          </View>
        )}
        <FlatList
          data={filteredMembers}
          keyExtractor={item => item.user_id}
          style={STYLES.MARGIN_TOP(10)}
          renderItem={({item}) => (
            <View style={[STYLES.FLEX_ROW, STYLES.SPACE_BETWEEN, STYLES.PADDING_VERTICAL(5)]}>
              <Text style={styles.modalText}>{item.username}</Text>
              <Checkbox
                checked={distribution.map(el => el.user_id).includes(item.user_id)}
                onPressCheckbox={() => {
                  const newData = [...distribution];
                  if (distribution.map(el => el.user_id).includes(item.user_id)) {
                    const index = newData.findIndex(el => el.user_id === item.user_id);
                    if (index !== -1) {
                      newData.splice(index, 1);
                      setDistribution(newData);
                    }
                  } else {
                    newData.push({
                      user_id: item.user_id,
                      amount: '',
                    });
                    setDistribution(newData);
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

const ManagePaidModal = ({data}) => {
  const {isVisible, setIsVisible, paid, setPaid, members} = data;

  const [search, setSearch] = React.useState('');

  const filteredMembers = React.useMemo(() => {
    return members.filter(el => el.username.includes(search));
  }, [members, search]);

  const allChecked = React.useMemo(() => {
    return members.length === paid.length;
  }, [data]);

  const onPressAllChecked = React.useCallback(() => {
    if (allChecked) {
      setPaid([]);
    } else {
      setPaid(members.map(el => el.user_id));
    }
  }, [data]);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={() => {
        setIsVisible(false);
      }}>
      <View style={[styles.modal]}>
        <Text style={styles.modalTitle}>Manage Paid Members</Text>
        <Searchbar value={search} onChangeText={setSearch} placeholder="Search" />
        {members.length > 0 && (
          <View
            style={[
              STYLES.FLEX_ROW_ALIGN_CENTER,
              {
                justifyContent: 'flex-end',
              },
              STYLES.PADDING_VERTICAL(5),
              STYLES.MARGIN_TOP(10),
            ]}>
            <Text style={[STYLES.MARGIN_RIGHT(5), styles.modalText]}>Include All</Text>
            <Checkbox checked={allChecked} onPressCheckbox={onPressAllChecked} />
          </View>
        )}
        <FlatList
          data={filteredMembers}
          keyExtractor={item => item.user_id}
          style={STYLES.MARGIN_TOP(10)}
          renderItem={({item}) => (
            <View style={[STYLES.FLEX_ROW, STYLES.SPACE_BETWEEN, STYLES.PADDING_VERTICAL(5)]}>
              <Text style={styles.modalText}>{item.username}</Text>
              <Checkbox
                checked={paid.includes(item.user_id)}
                onPressCheckbox={() => {
                  const newData = [...paid];
                  if (paid.includes(item.user_id)) {
                    const index = newData.findIndex(el => el === item.user_id);
                    if (index !== -1) {
                      newData.splice(index, 1);
                      setPaid(newData);
                    }
                  } else {
                    newData.push(item.user_id);
                    setPaid(newData);
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
  const route = useRoute();
  const user = useRecoilValue(userAtom);
  const currencies = useRecoilValue(currenciesAtom);

  const userDefaultCurrency = React.useMemo(() => user?.user_info?.default_currency_code, [user]);

  const [sessionCurrencies, setSessionCurrencies] = React.useState([]); // [currency_code, ...

  const currencySelectData = React.useMemo(() => {
    return _.uniqBy([...sessionCurrencies, ...currencies], 'currency_code').map(
      el => el.currency_code,
    );
  }, [sessionCurrencies, currencies]);

  // states
  const [categories, setCategories] = React.useState([]); // 카테고리 목록

  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [currencyCode, setCurrencyCode] = React.useState(userDefaultCurrency);

  const [time, setTime] = React.useState(dayjs().format('YYYY-MM-DD HH:mm'));
  const [total, setTotal] = React.useState('');

  const [members, setMembers] = React.useState([]); // 현재 세션 멤버
  const [paid, setPaid] = React.useState([]);
  const [items, setItems] = React.useState([]);

  const [distribution, setDistribution] = React.useState([]); // 분배된 금액

  const [isBottomSheetOpen, setIsBottomSheetOpen] = React.useState(true);
  const [isDMVisible, setIsDMVisible] = React.useState(false);
  const [isPMVisible, setIsPMVisible] = React.useState(false);

  const [fetching, setFetching] = React.useState(true);

  const currentSession = useRecoilValue(sessionAtom);
  const currentSessionID = React.useMemo(() => currentSession?.session_id, [currentSession]);

  // functions
  const fetchSessionCurrencies = async () => {
    try {
      const res = await getSessionCurrencies(currentSessionID);
      setSessionCurrencies(
        _.keys(res).map(item => ({
          ...res[item][0],
          country_code: item,
        })),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getExpenditureCategories();
      setCategories(res);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchParticipants = async () => {
    try {
      const res = await getSessionMembers(currentSessionID);
      setMembers(res);
      setDistribution(
        res.map(el => {
          return {
            user_id: el.user_id,
            amount: {
              num: 0,
              denom: 0,
              string: '',
            },
          };
        }),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    await fetchSessionCurrencies();
    await fetchCategories();
    await fetchParticipants();
    if (route.params?.expenditure_id) {
      await fetchExpenditure();
    }
    setFetching(false);
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
      const formData = new FormData();
      formData.append('file', {
        uri: result.assets[0].uri,
        name: result.assets[0].fileName,
        type: result.assets[0].type,
      });

      // const res = await postExpenditureReceipt(formData);
      // setCurrencyCode(res.currency_code);
      // setItems(res.items.map(el => ({...el, id: 'id' + Math.random().toString(16).slice(2)})));

      setItems([
        {
          id: 'id' + Math.random().toString(16).slice(2),
          label: 'Cola 2.0L',
          price: '6,350',
          allocations: [],
        },
        {
          id: 'id' + Math.random().toString(16).slice(2),
          label: 'Organic Salad',
          price: '23,000',
          allocations: [],
        },
      ]);
    } catch (error) {
      throw error;
    }
  };

  const onPressAdd = async () => {
    try {
      const res = await putExpenditure({
        name: name,
        category: category,
        currency_code: currencyCode,
        total_price: Number(total.replace(/,/g, '')),
        payers_id: paid,
        distribution: distribution.map(el => ({
          user_id: el.user_id,
          amount: {
            num: el.amount.num,
            denom: el.amount.denom,
          },
        })),
        items: items,
        payed_at: Date.parse(time + 'Z'),
        session_id: currentSessionID,
      });
      navigation.goBack();
    } catch (error) {
      throw error;
    }
  };

  const addButtonDisabled = React.useMemo(() => {
    if (name.length === 0) {
      return true;
    }
    if (category.length === 0) {
      return true;
    }
    if (total.length === 0 || Number(total.replace(/,/g, '')) <= 0) {
      return true;
    }
    if (
      distribution.length === 0 ||
      distribution.some(
        el => el.amount.string.length === 0 || el.amount.num === 0 || el.amount.denom === 0,
      )
    ) {
      return true;
    }
    if (paid.length === 0) {
      return true;
    }
    return false;
  }, [name, category, total, distribution, paid]);

  // edit
  const [expenditure, setExpenditure] = React.useState(null);

  const fetchExpenditure = async () => {
    const res = await getExpenditure(route.params?.expenditure_id);
    setExpenditure(res);
    setName(res.name);
    setCategory(res.category);
    setCurrencyCode(res.currency_code);
    setTotal(res.total_price.toLocaleString());
    setPaid(res.payers_id);
    setDistribution(
      res.distribution.map(el => ({
        user_id: el.user_id,
        amount: {
          num: el.amount.num,
          denom: el.amount.denom,
          string: (el.amount.num / el.amount.denom).toLocaleString(),
        },
      })),
    );
    if (res?.item) {
      setItems(
        res.item.map(el => ({
          ...el,
          id: 'id' + Math.random().toString(16).slice(2),
        })),
      );
    }
    setTime(dayjs(res.payed_at).format('YYYY-MM-DD HH:mm'));
  };

  const onPressEdit = async () => {};

  const requestDelete = async () => {
    try {
      await deleteExpenditure(route.params?.expenditure_id);
      navigation.goBack();
    } catch (error) {
      throw error;
    }
  };

  const onPressDelete = async () => {
    requestAlert(
      'Delete Expenditure',
      'Are you sure you want to delete this expenditure?',
      requestDelete,
    );
  };

  // effects
  React.useEffect(() => {
    if (currentSessionID && route.params) {
      fetchData();
    }
  }, [currentSessionID, route.params]);

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
    <SafeArea
      top={{style: {backgroundColor: colors.white}, barStyle: 'dark-content'}}
      bottom={{
        style: {
          backgroundColor: colors.primary,
        },
      }}>
      <CustomHeader
        title={route.params?.expenditure_id ? 'Edit Expenditure' : 'Add Expenditure'}
        theme={CUSTOM_HEADER_THEME.WHITE}
        rightComponent={
          <View style={STYLES.FLEX_ROW_ALIGN_CENTER}>
            {route.params?.expenditure_id && (
              <TouchableOpacity
                onPress={onPressDelete}
                disabled={fetching}
                style={STYLES.MARGIN_RIGHT(10)}>
                <Icon
                  name="delete"
                  type="material-community"
                  color={addButtonDisabled || fetching ? '#808080' : colors.red}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={route.params?.expenditure_id ? onPressEdit : onPressAdd}
              disabled={addButtonDisabled || fetching}>
              <Icon
                name="pencil"
                type="material-community"
                color={addButtonDisabled || fetching ? '#808080' : colors.primary}
              />
            </TouchableOpacity>
          </View>
        }
      />
      {fetching ? (
        <View
          style={[
            STYLES.FLEX(1),
            {
              justifyContent: 'center',
              alignItems: 'center',
            },
          ]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.container}>
          <Text style={[styles.label, STYLES.MARGIN_BOTTOM(5), STYLES.MARGIN_TOP(15)]}>
            Category
          </Text>
          <SelectDropdown
            data={categories}
            onSelect={(selectedItem, index) => {
              setCategory(selectedItem);
            }}
            defaultValue={category}
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
          <Text style={[styles.label, STYLES.MARGIN_BOTTOM(5), STYLES.MARGIN_TOP(15)]}>
            Receipt
          </Text>
          {items.length === 0 ? (
            <TouchableOpacity style={styles.receiptButton} onPress={onPressUploadReceipt}>
              <Text style={styles.receiptText}>Upload Receipt</Text>
            </TouchableOpacity>
          ) : (
            <AvoidSoftInputView style={STYLES.FLEX(1)}>
              <View style={STYLES.PADDING_BOTTOM(70)}>
                <InputTable data={items} setData={setItems} />
              </View>
            </AvoidSoftInputView>
          )}
          {isBottomSheetOpen && (
            <ExpenditureBottomSheet
              data={{
                total: total,
                setTotal: setTotal,
                members: members,
                distribution: distribution,
                setDistribution: setDistribution,
                detail: items,
                setDetail: setItems,
                setIsModalVisible: setIsDMVisible,
                setIsPMVisible: setIsPMVisible,
                paid: paid,
                setPaid: setPaid,
                currencyCode: currencyCode,
                setCurrencyCode: setCurrencyCode,
                currencySelectData: currencySelectData,
              }}
            />
          )}
          <ManageDistributionModal
            data={{
              isVisible: isDMVisible,
              setIsVisible: setIsDMVisible,
              distribution: distribution,
              setDistribution: setDistribution,
              members: members,
            }}
          />
          <ManagePaidModal
            data={{
              isVisible: isPMVisible,
              setIsVisible: setIsPMVisible,
              paid: paid,
              setPaid: setPaid,
              members: members,
            }}
          />
        </View>
      )}
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
  modal: {
    width: '100%',
    height: '50%',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 15,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    color: colors.black,
  },
  dropdownBtnStyle: {
    width: 100,
    height: 30,
    backgroundColor: 'transparent',
  },
  dropdownRowStyle: {
    backgroundColor: '#EFEFEF',
    borderBottomColor: '#C5C5C5',
    height: 30,
  },
});
