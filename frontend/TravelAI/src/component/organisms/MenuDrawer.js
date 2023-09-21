import {StyleSheet, View, Text, Image} from 'react-native';
import React from 'react';
import {Portal, Drawer, Avatar} from 'react-native-paper';
import colors from '../../theme/colors';
import Modal from 'react-native-modal';
import upperProfile from '../../assets/images/upper_profile.png';
import {navigate} from '../../navigation/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRecoilState} from 'recoil';
import userAtom from '../../recoil/user/user';

const MenuDrawer = props => {
  const {visible, setVisible} = props;

  const [user, setUser] = useRecoilState(userAtom);

  const userName = React.useMemo(() => user?.user_info?.username, [user]);
  const userImage = React.useMemo(() => user?.user_info?.profile_image, [user]);

  const onClose = () => {
    setVisible(false);
  };

  const navigateToProfile = () => {
    onClose();
    navigate('Profile');
  };

  const navigateToDefaultCurrency = () => {
    onClose();
    navigate('DefaultCurrency');
  };

  const navigateToPeople = () => {
    onClose();
    navigate('Friends');
  };

  const logout = () => {
    onClose();
    AsyncStorage.clear();
    setUser(null);
  };

  const navigateToMySessionRequest = () => {
    onClose();
    navigate('MyRequest');
  };

  // effects
  React.useEffect(() => {
    if (user === null) {
      navigate('SignIn');
    }
  }, [user]);

  return (
    <Modal
      style={styles.modal}
      isVisible={visible}
      animationIn="slideInRight"
      animationOut="slideOutRight"
      swipeDirection={['right']}
      onSwipeComplete={onClose}
      onBackdropPress={onClose}>
      <Drawer.Section style={styles.drawer}>
        <View style={styles.profileWrapper}>
          <Image style={styles.profileImg} source={upperProfile} />
          <Avatar.Image
            source={{uri: userImage}}
            size={86}
            style={{backgroundColor: colors.primary}}
          />
          <Text style={styles.userNameText}>{userName}</Text>
        </View>
        <Drawer.Item label="Profile" onPress={navigateToProfile} icon="star" />
        <Drawer.Item label="Default Currency" onPress={navigateToDefaultCurrency} icon="star" />
        <Drawer.Item label="People" onPress={navigateToPeople} icon="star" />
        <Drawer.Item label="My Request" onPress={navigateToMySessionRequest} icon="star" />
        <Drawer.Item label="Logout" onPress={logout} icon="star" />
      </Drawer.Section>
    </Modal>
  );
};

export default MenuDrawer;

const styles = StyleSheet.create({
  modal: {
    margin: 0,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: '80%',
    height: '100%',
    backgroundColor: colors.white,
    paddingTop: 100,
  },
  drawerItem: {
    color: colors.black,
  },
  profileWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  profileImg: {
    width: 93,
    height: 30.45,
    resizeMode: 'contain',
    position: 'absolute',
    top: 0,
  },
  userNameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black,
    marginTop: 10,
    letterSpacing: 0.33,
  },
});
