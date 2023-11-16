import {Text, TextInput, Keyboard} from 'react-native';
import React from 'react';
import BottomSheet, {BottomSheetTextInput, BottomSheetView} from '@gorhom/bottom-sheet';
import {Icon} from '@rneui/themed';
import SelectDropdown from 'react-native-select-dropdown';
import FirstSection from './FirstSection';
import SecondSection from './SecondSection';
import {expenditureStyles as styles} from '../../screens/AddExpenditureScreen';
import {Platform} from 'react-native';
import DismissKeyboard from '../molecules/DismissKeyboard';
import {STYLES} from '../../styles/Stylesheets';
import colors from '../../theme/colors';

const ExpenditureBottomSheet = ({data}) => {
  const [isFirstSectionVisible, setIsFirstSectionVisible] = React.useState(true);
  const [selectedUser, setSelectedUser] = React.useState(null); // 선택한 멤버

  const {total, setTotal, detail, currencyCode, setCurrencyCode, currencySelectData} = data;

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

  const [snapIndex, setSnapIndex] = React.useState(0);

  // if keyboard dismiss, bottom sheet to default
  React.useEffect(() => {
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      if (snapIndex === 1) {
        bottomSheetRef?.current?.snapToIndex(1);
      }
    });
    return () => {
      keyboardDidHideListener.remove();
    };
  }, [snapIndex]);

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={index => {
        setSnapIndex(index);
      }}
      backgroundStyle={styles.bottomSheet}
      handleIndicatorStyle={styles.bottomSheetIndicator}>
      <BottomSheetView style={STYLES.FLEX(1)}>
        <DismissKeyboard>
          <BottomSheetView style={styles.totalWrapper}>
            <Text style={[styles.bottomSheetText, styles.totalText]}>Total</Text>
            <BottomSheetView style={[STYLES.FLEX_ROW, STYLES.FLEX_END]}>
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
              {Platform.OS === 'android' ? (
                <TextInput
                  ref={totalInputRef}
                  style={[styles.bottomSheetText, styles.totalInput]}
                  value={total}
                  editable={detail.length === 0}
                  placeholder="0"
                  placeholderTextColor={'#FFFFFF'}
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
              ) : (
                <BottomSheetTextInput
                  ref={totalInputRef}
                  style={[styles.bottomSheetText, styles.totalInput]}
                  value={total}
                  editable={detail.length === 0}
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
              )}
            </BottomSheetView>
          </BottomSheetView>
        </DismissKeyboard>
        <BottomSheetView style={styles.bottomSheetHide}>
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
        </BottomSheetView>
      </BottomSheetView>
    </BottomSheet>
  );
};

export default ExpenditureBottomSheet;
