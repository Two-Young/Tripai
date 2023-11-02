import {showErrorToast} from '../utils/utils';

const {GoogleSignin} = require('@react-native-google-signin/google-signin');
const {authGoogleSign, authFacebookSign, authNaverSign, authKakaoSign} = require('./api');
const {LoginManager, AccessToken} = require('react-native-fbsdk-next');
const {default: NaverLogin} = require('@react-native-seoul/naver-login');
const {login} = require('@react-native-seoul/kakao-login');

GoogleSignin.configure({
  webClientId: '567003577983-an1ml4gbv1buqf19as8rcinum3oultqa.apps.googleusercontent.com',
  offlineAccess: true, // if you want to access Google API on behalf of the user FROM YOUR SERVER
  forceCodeForRefreshToken: true, // [Android] related to `serverAuthCode`, read the docs link below *.
  iosClientId: '567003577983-mk46jh9jh9dvqcfg0tqnqa2t0hk6pvvm.apps.googleusercontent.com', // [iOS] optional, if you want to specify the client ID of type iOS (otherwise, it is taken from GoogleService-Info.plist)
});

const consumerKey = 'yslLLko5U73xJ8HfWEPP';
const consumerSecret = '8dZZfr0tOR';
const appName = 'TravelAI';
const serviceUrlScheme = 'com.twoyoung.travelai';

export async function socialGoogleSignIn() {
  try {
    // Check if your device supports Google Play
    await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
    // Get the users ID token
    const {idToken} = await GoogleSignin.signIn();

    // Create a Google credential with the token
    const sign_result = await authGoogleSign(idToken);
    return sign_result;
  } catch (e) {
    showErrorToast(e);
  }
}

export async function socialFacebookSignIn() {
  try {
    // Attempt login with permissions
    const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

    if (result.isCancelled) {
      throw 'User cancelled the login process';
    }

    // Once signed in, get the users AccesToken
    const data = await AccessToken.getCurrentAccessToken();

    if (!data) {
      throw 'Something went wrong obtaining access token';
    }

    const sign_result = await authFacebookSign(data.accessToken);
    return sign_result;
  } catch (e) {
    showErrorToast(e);
  }
}

export const socialNaverSignIn = async () => {
  try {
    const {failureResponse, successResponse} = await NaverLogin.login({
      appName,
      consumerKey,
      consumerSecret,
      serviceUrlScheme,
    });
    if (successResponse) {
      const sign_result = await authNaverSign(successResponse.accessToken);
      return sign_result;
    } else {
      throw failureResponse;
    }
  } catch (e) {
    showErrorToast(e);
  }
};

export const socialKakaoSignin = async () => {
  try {
    const token = await login();
    const {idToken, accessToken} = token;
    const res = await authKakaoSign(accessToken);
    return res;
  } catch (e) {
    showErrorToast(e);
  }
};
