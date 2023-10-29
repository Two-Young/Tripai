import {StyleSheet, View, Keyboard, Pressable, Image} from 'react-native';
import React from 'react';
import {Avatar, Button, IconButton, List, Switch, Text, TextInput} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useRecoilState, useRecoilValue} from 'recoil';
import userAtom from '../recoil/user/user';
import {launchImageLibrary} from 'react-native-image-picker';
import {getProfile, updateProfile} from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STYLES} from '../styles/Stylesheets';
import SafeArea from './../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import MainButton from '../component/atoms/MainButton';
import LoadingModal from '../component/atoms/LoadingModal';
import SelectDropdown from 'react-native-select-dropdown';
import currenciesAtom from '../recoil/currencies/currencies';
import _ from 'lodash';
import countriesAtom from '../recoil/countries/countries';
import {Icon} from '@rneui/themed';
import reactotron from 'reactotron-react-native';
import DismissKeyboard from '../component/molecules/DismissKeyboard';
import colors from '../theme/colors';

const ProfileScreen = () => {
  // hooks
  const navigation = useNavigation();
  const currencies = useRecoilValue(currenciesAtom);
  const countries = useRecoilValue(countriesAtom);

  // states
  const [user, setUser] = useRecoilState(userAtom);
  const userInfo = React.useMemo(() => user?.user_info, [user]);

  const [profileImage, setProfileImage] = React.useState(userInfo?.profile_image);
  const [username, setUsername] = React.useState(userInfo?.username);
  const [nicknameSearch, setNicknameSearch] = React.useState(userInfo?.allow_nickname_search);
  const [defaultCurrencyCode, setDefaultCurrencyCode] = React.useState(
    userInfo?.default_currency_code,
  );

  const [fetching, setFetching] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  // memos (computed values)
  const isEditing = React.useMemo(() => {
    return (
      profileImage !== userInfo?.profile_image ||
      username !== userInfo?.username ||
      nicknameSearch !== userInfo?.allow_nickname_search ||
      defaultCurrencyCode !== userInfo?.default_currency_code
    );
  }, [profileImage, username, nicknameSearch, defaultCurrencyCode, userInfo]);

  const isUsernameValid = React.useMemo(() => {
    return username.length > 0;
  }, [username]);

  const isProfileImageChanged = React.useMemo(() => {
    return profileImage !== userInfo?.profile_image;
  }, [profileImage, userInfo?.profile_image]);

  const currencySelectData = React.useMemo(() => {
    return currencies.map(item => {
      const country = countries.find(i => i.country_code === item.country_code);
      return {
        ...item,
        ...country,
      };
    });
  }, [currencies, countries]);

  // functions
  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      const newUser = {...user, user_info: {...user.user_info, ...res}};
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      setProfileImage(res.profile_image);
      setUsername(res.username);
      setNicknameSearch(res.allow_nickname_search);
      setDefaultCurrencyCode(res.default_currency_code);
    } catch (err) {
      console.error(err);
    } finally {
      setFetching(false);
    }
  };

  const onPressProfileImage = async () => {
    try {
      const res = await launchImageLibrary({mediaType: 'photo'});
      if (res.didCancel) {
        return;
      }
      setProfileImage(res.assets[0].uri);
    } catch (err) {
      console.error(err);
    }
  };

  const onToggleSwitch = () => setNicknameSearch(!nicknameSearch);

  const onPressSave = async () => {
    try {
      Keyboard.dismiss();
      setLoading(true);
      const formData = new FormData();
      const imageUriParts = profileImage.split('.');
      const fileExtension = imageUriParts[imageUriParts.length - 1];
      if (isProfileImageChanged) {
        formData.append('profile_image', {
          uri: profileImage,
          name: `profile.${fileExtension}`,
          type: `image/${fileExtension}`,
        });
      }
      formData.append('username', username);
      formData.append('allow_nickname_search', nicknameSearch);
      formData.append('default_currency_code', defaultCurrencyCode);
      await updateProfile(formData);
      const newUser = {
        ...user,
        user_info: {
          ...user.user_info,
          profile_image: profileImage,
          username,
          allow_nickname_search: nicknameSearch,
          default_currency_code: defaultCurrencyCode,
        },
      };
      setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  // effects
  React.useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <DismissKeyboard>
      <SafeArea>
        <LoadingModal isVisible={loading} />
        <CustomHeader title="Profile" rightComponent={<View />} />
        {fetching ? (
          <View style={STYLES.FLEX(1)} />
        ) : (
          <View style={[STYLES.FLEX(1), STYLES.PADDING_HORIZONTAL(20)]}>
            <View style={[STYLES.ALIGN_CENTER, STYLES.PADDING_VERTICAL(40)]}>
              <Pressable onPress={onPressProfileImage}>
                <Avatar.Image
                  size={100}
                  source={{
                    uri: profileImage,
                  }}
                />
                <IconButton mode="contained" icon="camera" size={20} style={styles.cameraIcon} />
              </Pressable>
            </View>
            <TextInput
              mode="outlined"
              label="Username"
              value={username}
              onChangeText={setUsername}
            />
            <View style={styles.rowContainer}>
              <Text style={styles.label}>Allowing Search</Text>
              <Switch value={nicknameSearch} onValueChange={onToggleSwitch} />
            </View>
            <View style={styles.rowContainer}>
              <Text style={styles.label}>Default Currency</Text>
              <SelectDropdown
                data={currencySelectData}
                onSelect={(selectedItem, index) => {
                  setDefaultCurrencyCode(selectedItem.currency_code);
                }}
                defaultValue={currencySelectData.find(
                  item => item.currency_code === defaultCurrencyCode,
                )}
                renderCustomizedButtonChild={(selectedItem, index) => {
                  return (
                    <View style={styles.dropdownBtnChildStyle}>
                      <Image
                        style={styles.dropdownBtnImage}
                        source={{
                          uri:
                            selectedItem?.png ??
                            currencySelectData.find(
                              item => item.currency_code === defaultCurrencyCode,
                            ).png,
                        }}
                      />

                      <Text style={styles.dropdownBtnTxt}>
                        {selectedItem ? selectedItem.currency_code : defaultCurrencyCode}
                      </Text>
                      <Icon
                        name="chevron-down"
                        type="material-community"
                        color={'#444'}
                        size={18}
                      />
                    </View>
                  );
                }}
                buttonStyle={styles.dropdownBtnStyle}
                buttonTextStyle={styles.labelTxt}
                dropdownStyle={styles.dropdownDropdownStyle}
                rowStyle={styles.dropdownRowStyle}
                rowTextStyle={styles.dropdownRowTxt}
                renderCustomizedRowChild={(selectedItem, index) => {
                  return (
                    <View style={styles.dropdownRowChildStyle}>
                      <Image style={styles.dropdownRowImage} source={{uri: selectedItem.png}} />
                      <Text style={styles.dropdownRowTxt}>{selectedItem.currency_code}</Text>
                    </View>
                  );
                }}
                search
                searchPlaceHolder="Search..."
                searchInputStyle={styles.dropdownsearchInputStyleStyle}
                searchPlaceHolderColor={'#F8F8F8'}
                renderSearchInputLeftIcon={() => (
                  <Icon name="magnify" type="material-community" size={20} />
                )}
              />
            </View>
          </View>
        )}
        <View style={[STYLES.PADDING_VERTICAL(10), STYLES.PADDING_HORIZONTAL(20)]}>
          <MainButton text="Save" onPress={onPressSave} disabled={!isEditing || !isUsernameValid} />
        </View>
      </SafeArea>
    </DismissKeyboard>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    transform: [{translateX: 10}, {translateY: 10}],
  },
  rowContainer: {
    ...STYLES.FLEX_ROW_ALIGN_CENTER,
    ...STYLES.SPACE_BETWEEN,
    ...STYLES.MARGIN_TOP(20),
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.black,
  },
  labelTxt: {
    fontSize: 16,
    color: colors.black,
  },
  dropdownBtnStyle: {
    width: 150,
    height: 50,
    backgroundColor: '#FFF',
    paddingHorizontal: 0,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#444',
  },
  dropdownBtnChildStyle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  dropdownBtnImage: {
    width: 45,
    height: 30,
    resizeMode: 'cover',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#808080',
  },
  dropdownBtnTxt: {
    color: colors.black,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
  dropdownDropdownStyle: {backgroundColor: 'slategray'},
  dropdownRowStyle: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#444',
    height: 50,
  },
  dropdownRowChildStyle: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  dropdownRowImage: {
    width: 45,
    height: 30,
    resizeMode: 'cover',
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#808080',
  },
  dropdownRowTxt: {
    color: colors.black,
    textAlign: 'center',
    fontSize: 14,
    marginHorizontal: 12,
  },
  dropdownsearchInputStyleStyle: {
    backgroundColor: 'slategray',
    borderBottomWidth: 1,
    borderBottomColor: '#FFF',
  },
});
