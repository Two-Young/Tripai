import {StyleSheet, View, TouchableWithoutFeedback, Keyboard, Pressable} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {Header} from '@rneui/themed';
import {Avatar, Button, IconButton, List, Switch, TextInput} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {useRecoilState} from 'recoil';
import userAtom from '../recoil/user/user';
import colors from '../theme/colors';
import {launchImageLibrary} from 'react-native-image-picker';
import {getProfile, updateProfile} from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
  // hooks
  const navigation = useNavigation();

  // states
  const [user, setUser] = useRecoilState(userAtom);
  const userInfo = React.useMemo(() => user?.user_info, [user]);

  const [profileImage, setProfileImage] = React.useState(userInfo?.profile_image);
  const [username, setUsername] = React.useState(userInfo?.username);
  const [nicknameSearch, setNicknameSearch] = React.useState(userInfo?.allow_nickname_search);

  // memos (computed values)
  const isEditing = React.useMemo(() => {
    return (
      profileImage !== userInfo?.profile_image ||
      username !== userInfo?.username ||
      nicknameSearch !== userInfo?.allow_nickname_search
    );
  }, [profileImage, username, nicknameSearch]);

  const isUsernameValid = React.useMemo(() => {
    return username.length > 0;
  }, [username]);

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
      const formData = new FormData();
      const imageUriParts = profileImage.split('.');
      const fileExtension = imageUriParts[imageUriParts.length - 1];
      formData.append('profile_image', {
        uri: profileImage,
        name: `profile.${fileExtension}`,
        type: `image/${fileExtension}`,
      });
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
      navigation.goBack();
    } catch (err) {
      console.error(err);
    }
  };

  // effects
  React.useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
        <Header
          backgroundColor="#fff"
          barStyle="dark-content"
          leftComponent={
            <IconButton
              mode="contained"
              icon="chevron-left"
              iconColor="#000"
              onPress={() => navigation.goBack()}
            />
          }
          centerComponent={{text: 'Profile', style: defaultStyle.heading}}
        />
        <View style={styles.container}>
          <View style={styles.avatarContainer}>
            <Pressable onPress={onPressProfileImage}>
              <Avatar.Image
                size={100}
                source={{
                  uri: profileImage,
                }}
              />
            </Pressable>
          </View>
          <TextInput mode="outlined" label="Username" value={username} onChangeText={setUsername} />
          <List.Item
            title="Allow Search"
            right={() => <Switch value={nicknameSearch} onValueChange={onToggleSwitch} />}
          />
        </View>
        <Button mode="contained" onPress={onPressSave} disabled={!isEditing || !isUsernameValid}>
          Save
        </Button>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  avatarContainer: {
    alignItems: 'center',
  },
});
