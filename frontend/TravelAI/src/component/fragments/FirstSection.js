import {Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import {BottomSheetFlatList} from '@gorhom/bottom-sheet';
import {Icon} from '@rneui/themed';
import Fraction from 'fraction.js';
import DismissKeyboard from '../molecules/DismissKeyboard';
import {expenditureStyles as styles} from '../../screens/AddExpenditureScreen';
import {STYLES} from '../../styles/Stylesheets';
import colors from '../../theme/colors';
import FlatListRenderItem from './FirstListRenderItem';

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
    setDetail,
    members,
  } = data;

  const onPressDistribute = () => {
    const totalAmount = Number(total.replace(/,/g, ''));
    const totalParticipants = distribution.length;

    var f1 = new Fraction(totalAmount);
    f1 = f1.div(totalParticipants);
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
    if (detail.length > 0) {
      setDetail(prev => {
        return prev.map(el => ({
          ...el,
          allocations: distribution.map(dt => dt.user_id),
        }));
      });
    }
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
      <DismissKeyboard>
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
      </DismissKeyboard>
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
              setDetail: setDetail,
              setIsFirstSectionVisible: setIsFirstSectionVisible,
              setSelectedUser: setSelectedUser,
              members: members,
            }}
          />
        )}
        ItemSeparatorComponent={() => <View style={{height: 5}} />}
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

export default FirstSection;
