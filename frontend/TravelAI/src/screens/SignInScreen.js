import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {View, Text, StyleSheet, ImageBackground} from 'react-native';
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

function SignInScreen(props) {
  // states
  const [user, setUser] = useRecoilState(userAtom);

  // hooks
  const navigation = useNavigation();

  // functions

  const storeUserData = async value => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem('user', jsonValue);
      setUser(value);
      navigation.dispatch(StackActions.replace('Main'));
    } catch (e) {
      // saving error
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safearea}>
      <ImageBackground
        style={styles.imageBackground}
        source={{
          uri: 'https://i.pinimg.com/564x/7f/6c/95/7f6c9555512ca982521941cba9de20d9.jpg',
        }}>
        <View style={styles.container}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Please log in to securely store your valuable records.</Text>
          </View>
          <View style={styles.socialBox}>
            <SocialButton
              style={{marginBottom: 10}}
              source={{
                uri: 'https://pixlok.com/wp-content/uploads/2021/04/Google-Icon-PNG.jpg',
              }}
              onPress={() => socialGoogleSignIn().then(storeUserData)}
              type="Google"
            />
            <SocialButton
              style={{marginBottom: 10}}
              source={{
                uri: 'https://marcas-logos.net/wp-content/uploads/2020/01/Facebook-Novo-Logo.jpg',
              }}
              onPress={() => socialFacebookSignIn().then(storeUserData)}
              type="Facebook"
            />
            <SocialButton
              style={{marginBottom: 10}}
              source={{
                uri: 'https://clova-phinf.pstatic.net/MjAxODAzMjlfOTIg/MDAxNTIyMjg3MzM3OTAy.WkiZikYhauL1hnpLWmCUBJvKjr6xnkmzP99rZPFXVwgg.mNH66A47eL0Mf8G34mPlwBFKP0nZBf2ZJn5D4Rvs8Vwg.PNG/image.png',
              }}
              onPress={() => socialNaverSignIn().then(storeUserData)}
              type="Naver"
            />
            <SocialButton
              style={{marginBottom: 10}}
              source={{
                uri: 'https://i.pinimg.com/564x/4f/b5/ab/4fb5abad387bab970b9fa4e1fafb7401.jpg',
              }}
              onPress={() => socialKakaoSignin().then(storeUserData)}
              type="Kakao"
            />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  imageBackground: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 84,
    paddingBottom: 50,
  },
  titleBox: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  socialBox: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
});

export default SignInScreen;
