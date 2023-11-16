import {Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import {Icon} from '@rneui/themed';
import SelectDropdown from 'react-native-select-dropdown';
import {AvoidSoftInputView} from 'react-native-avoid-softinput';
import {expenditureStyles as styles} from '../../screens/AddExpenditureScreen';
import Fraction from 'fraction.js';
import colors from '../../theme/colors';
import {STYLES} from '../../styles/Stylesheets';
import SecondSectionFlatListRenderItem from './SecondSectionFlatListRenderItem';

const SecondSection = ({data}) => {
  const {
    user,
    members,
    distribution,
    setDistribution,
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
          var f1 = new Fraction(Number(cur.price.replace(/,/g, '')));
          f1 = f1.div(cur.allocations.length);
          return acc.add(f1);
        } else {
          return acc;
        }
      }, new Fraction(0))
      .toLocaleString();
  }, [data]);

  //
  React.useEffect(() => {
    setDistribution(prev => {
      return prev.map(d => {
        const total = detail.reduce((acc, cur) => {
          if (cur.allocations.includes(d.user_id)) {
            var f1 = new Fraction(Number(cur.price.replace(/,/g, '')));
            f1 = f1.div(cur.allocations.length);
            return acc.add(f1);
          } else {
            return acc;
          }
        }, new Fraction(0));
        var f = new Fraction(total);
        return {
          ...d,
          amount: {
            num: f.n,
            denom: f.d,
            string: Number(f.n / f.d).toLocaleString(),
          },
        };
      });
    });
  }, [detail]);

  // React.useEffect(() => {
  //   setDistribution(prev => {
  //     const target = prev.find(el => el.user_id === selectedUser);
  //     if (target) {
  //       var f1 = new Fraction(Number(selectedUserTotal.replace(/,/g, '')));
  //       return prev.map(el => {
  //         if (el.user_id === selectedUser) {
  //           return {
  //             ...el,
  //             amount: {
  //               num: f1.n,
  //               denom: f1.d,
  //               string: selectedUserTotal,
  //             },
  //           };
  //         } else {
  //           return el;
  //         }
  //       });
  //     } else {
  //       return prev;
  //     }
  //   });
  // }, [selectedUser, selectedUserTotal]);

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
      <AvoidSoftInputView style={STYLES.FLEX(1)}>
        <BottomSheetFlatList
          data={detail.filter(el => el.label.length > 0 && el.price.length > 0)}
          keyExtractor={item => item.id}
          renderItem={({item}) => <SecondSectionFlatListRenderItem data={{...data, item}} />}
        />
      </AvoidSoftInputView>
      <Text style={styles.infoTxt}>select items that you occupied.</Text>
    </View>
  );
};

export default SecondSection;
