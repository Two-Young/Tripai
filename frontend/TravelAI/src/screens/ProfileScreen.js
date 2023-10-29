import {StyleSheet, View, Keyboard, Pressable} from 'react-native';
import React from 'react';
import {Avatar, IconButton, Switch, Text, TextInput} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useRecoilState} from 'recoil';
import userAtom from '../recoil/user/user';
import {launchImageLibrary} from 'react-native-image-picker';
import {getProfile, updateProfile} from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STYLES} from '../styles/Stylesheets';
import SafeArea from './../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import MainButton from '../component/atoms/MainButton';
import LoadingModal from '../component/atoms/LoadingModal';

const ProfileScreen = () => {
  // hooks
  const navigation = useNavigation();

  // states
  const [user, setUser] = useRecoilState(userAtom);
  const userInfo = React.useMemo(() => user?.user_info, [user]);

  const [profileImage, setProfileImage] = React.useState(userInfo?.profile_image);
  const [username, setUsername] = React.useState(userInfo?.username);
  const [nicknameSearch, setNicknameSearch] = React.useState(userInfo?.allow_nickname_search);

  const [loading, setLoading] = React.useState(false);

  // memos (computed values)
  const isEditing = React.useMemo(() => {
    return (
      profileImage !== userInfo?.profile_image ||
      username !== userInfo?.username ||
      nicknameSearch !== userInfo?.allow_nickname_search
    );
  }, [profileImage, username, nicknameSearch, userInfo]);

  const isUsernameValid = React.useMemo(() => {
    return username.length > 0;
  }, [username]);

  const isProfileImageChanged = React.useMemo(() => {
    return profileImage !== userInfo?.profile_image;
  }, [profileImage, userInfo?.profile_image]);

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
    } catch (err) {
      console.error(err);
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
      await updateProfile(formData);
      const newUser = {
        ...user,
        user_info: {
          ...user.user_info,
          profile_image: profileImage,
          username,
          switchOn: nicknameSearch,
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
    <Pressable style={[STYLES.FLEX(1)]} onPress={Keyboard.dismiss} accessible={false}>
      <SafeArea>
        <LoadingModal isVisible={loading} />
        <CustomHeader title="Profile" rightComponent={<View />} />
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
          <TextInput mode="outlined" label="Username" value={username} onChangeText={setUsername} />
          <View style={styles.allowSearchContainer}>
            <Text>Allowing Search</Text>
            <Switch value={nicknameSearch} onValueChange={onToggleSwitch} />
          </View>
        </View>
        <View style={[STYLES.PADDING(20)]}>
          <MainButton text="Save" onPress={onPressSave} disabled={!isEditing || !isUsernameValid} />
        </View>
      </SafeArea>
    </Pressable>
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
  allowSearchContainer: {
    ...STYLES.FLEX_ROW_ALIGN_CENTER,
    ...STYLES.SPACE_BETWEEN,
    ...STYLES.MARGIN_TOP(20),
  },
});
