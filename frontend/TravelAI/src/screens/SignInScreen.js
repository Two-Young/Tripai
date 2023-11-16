import React, {useMemo} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {StackActions, useNavigation} from '@react-navigation/native';
import colors from '../theme/colors';
import SocialButton from '../component/atoms/SocialButton';
import {
  socialFacebookSignIn,
  socialGoogleSignIn,
  socialKakaoSignin,
  socialNaverSignIn,
} from '../services/social';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useRecoilState} from 'recoil';
import userAtom from '../recoil/user/user';
import {STYLES} from '../styles/Stylesheets';
import {mainLogo} from '../assets/images';
import {
  socialFacebookIcon,
  socialGoogleIcon,
  socialKakaoIcon,
  socialNaverIcon,
} from '../assets/images';
import {Fonts} from '../theme';
import reactotron from 'reactotron-react-native';

function SignInScreen(props) {
  // states
  const [user, setUser] = useRecoilState(userAtom);

  // hooks
  const navigation = useNavigation();

  // functions

  const storeUserData = async value => {
    try {
      reactotron.log('storeUserData', value);
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem('user', jsonValue);
      setUser(value);
      navigation.dispatch(StackActions.replace('Main'));
    } catch (e) {
      reactotron.error(e);
      // saving error
    }
  };

  const socialObjs = useMemo(
    () => [
      {
        type: 'Google',
        source: socialGoogleIcon,
        onPress: () => socialGoogleSignIn().then(storeUserData),
      },
      {
        type: 'Facebook',
        source: socialFacebookIcon,
        onPress: () => socialFacebookSignIn().then(storeUserData),
      },
      {
        type: 'Naver',
        source: socialNaverIcon,
        onPress: () => socialNaverSignIn().then(storeUserData),
      },
      {
        type: 'Kakao',
        source: socialKakaoIcon,
        onPress: () => socialKakaoSignin().then(storeUserData),
      },
    ],
    [],
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.safearea}>
      <View style={styles.container}>
        <View style={[STYLES.FLEX(1), STYLES.SPACE_BETWEEN]}>
          <View style={STYLES.FLEX(1)} />
          <Image source={mainLogo} style={styles.mainLogo} />
          <View style={[STYLES.FLEX(1), STYLES.JUSTIFY_CENTER]}>
            <Text style={styles.subTitle}>{'AI-based\ntravel platform'}</Text>
          </View>
        </View>
        <View style={STYLES.FLEX_ROW_ALIGN_CENTER}>
          <View style={styles.line} />
          <Text style={styles.connectText}>connect with</Text>
          <View style={styles.line} />
        </View>
        <View
          style={[
            STYLES.FLEX_ROW_ALIGN_CENTER,
            STYLES.SPACE_AROUND,
            STYLES.WIDTH_100,
            STYLES.MARGIN_TOP(30),
          ]}>
          {socialObjs.map((socialObj, index) => (
            <SocialButton key={socialObj.type + index} {...socialObj} />
          ))}
        </View>
        <View style={[STYLES.FLEX_ROW, STYLES.FLEX_END]}>
          <Text style={[styles.signUpText, STYLES.MARGIN_TOP(30)]}>Use your social account.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  mainLogo: {
    width: 180,
    height: 93,
    resizeMode: 'contain',
  },
  subTitle: {
    ...Fonts.Bold(22),
    textAlign: 'center',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2D6D6',
  },
  connectText: {
    marginHorizontal: 12,
    ...Fonts.Regular(16),
  },
  socialBox: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  signUpText: {
    ...Fonts.Regular(14),
  },
});

export default SignInScreen;
