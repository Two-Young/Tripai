import {Text, TextInput, TouchableOpacity, View, Image, Platform} from 'react-native';
import React from 'react';
import {BottomSheetTextInput, BottomSheetView} from '@gorhom/bottom-sheet';
import {Tooltip} from '@rneui/themed';
import Fraction from 'fraction.js';
import infoIcon from '../../assets/images/information-circle-sharp.png';
import {STYLES} from '../../styles/Stylesheets';
import colors from '../../theme/colors';
import {expenditureStyles as styles} from '../../screens/AddExpenditureScreen';

const FlatListRenderItem = ({data}) => {
  const {
    item,
    distribution,
    setDistribution,
    members,
    detail,
    setDetail,
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

  const [tooltipVisible, setTooltipVisible] = React.useState(false);

  return (
    <TouchableOpacity
      style={[styles.individualWrapper, detail.length > 0 && styles.individualWrapperClickable]}
      disabled={detail.length === 0}
      onPress={onPressItem}>
      <BottomSheetView style={[STYLES.FLEX_ROW_ALIGN_CENTER, STYLES.FLEX(1)]}>
        {detail.length > 0 && (
          <Tooltip
            width={200}
            height={60}
            backgroundColor={colors.primary}
            visible={tooltipVisible}
            onOpen={() => setTooltipVisible(true)}
            onClose={() => setTooltipVisible(false)}
            popover={
              <Text
                style={{
                  color: colors.white,
                  fontSize: 12,
                }}>
                Press the row to edit the items that the user occupied
              </Text>
            }>
            <View style={[STYLES.PADDING(5), STYLES.MARGIN_LEFT(0), STYLES.MARGIN_RIGHT(5)]}>
              <Image source={infoIcon} style={[styles.infoIcon]} />
            </View>
          </Tooltip>
        )}
        <Text style={[styles.bottomSheetText, styles.individualText]}>{userName}</Text>
      </BottomSheetView>
      {Platform.OS === 'android' ? (
        <TextInput
          ref={inputRef}
          style={[styles.bottomSheetText, styles.individualInput, styles.individualText]}
          placeholder="0"
          placeholderTextColor={colors.white}
          textAlign="right"
          keyboardType="numeric"
          editable={detail.length === 0}
          value={item.item?.amount?.string}
          onChangeText={text => {
            const newData = [...distribution];
            newData[item.index].amount.string = text;
            var f1 = new Fraction(Number(text.replace(/,/g, '')));
            newData[item.index].amount.num = f1.n;
            newData[item.index].amount.denom = f1.d;
            setDistribution(newData);
            if (detail) {
              setDetail(prev => {
                return prev.map(el => ({
                  ...el,
                  allocations: [],
                }));
              });
            }
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
      ) : (
        <BottomSheetTextInput
          ref={inputRef}
          style={[styles.bottomSheetText, styles.individualInput, styles.individualText]}
          placeholder="0"
          placeholderTextColor={colors.white}
          textAlign="right"
          keyboardType="numeric"
          editable={detail.length === 0}
          value={item.item?.amount?.string}
          onChangeText={text => {
            const newData = [...distribution];
            newData[item.index].amount.string = text;
            var f1 = new Fraction(Number(text.replace(/,/g, '')));
            newData[item.index].amount.num = f1.n;
            newData[item.index].amount.denom = f1.d;
            setDistribution(newData);
            if (detail) {
              setDetail(prev => {
                return prev.map(el => ({
                  ...el,
                  allocations: [],
                }));
              });
            }
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
      )}
    </TouchableOpacity>
  );
};

export default FlatListRenderItem;
