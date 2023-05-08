import React, {useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Pressable,
  Alert,
} from 'react-native';
import Button from '../component/atoms/Button';
import {StackActions, useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {LoginManager, AccessToken} from 'react-native-fbsdk-next';
import CustomTextInput from '../component/atoms/CustomTextInput';
import colors from '../theme/colors';
import SocialButton from '../component/atoms/SocialButton';
import {authFacebookSign, authGoogleSign} from '../services/api';

GoogleSignin.configure({
  webClientId: '24378092542-l46d9sch9rgn6d2th6hj880q3841o3ml.apps.googleusercontent.com',
});

async function onGoogleButtonPress() {
  // Check if your device supports Google Play
  await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
  // Get the users ID token
  const {idToken} = await GoogleSignin.signIn();

  // Create a Google credential with the token
  const sign_result = await authGoogleSign(idToken);
  console.log(sign_result);
  // const googleCredential = auth.GoogleAuthProvider.credential(idToken);

  // Sign-in the user with the credential
  // return auth().signInWithCredential(googleCredential);
}

async function onFacebookButtonPress() {
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
  console.log(sign_result);

  // Create a Firebase credential with the AccessToken
  //const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);

  // Sign-in the user with the credential
  // return auth().signInWithCredential(facebookCredential);
}

function SignInScreen(props) {
  const navigation = useNavigation();
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(false);
  const [user, setUser] = useState();

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    if (user) {
      navigation.dispatch(StackActions.replace('Tab', {screen: 'Home', params: {user: user}}));
    }
  }, [user, navigation]);

  const onPressSignIn = () => {
    Alert.alert('email is not registered');
  };

  const onPressForgotPassword = () => {};

  const onPressSignUp = () => {
    navigation.navigate('SignUp');
  };

  if (initializing) return null;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safearea}>
      <Pressable style={{flex: 1}} onPress={() => Keyboard.dismiss()}>
        <View style={styles.container}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Sign in now</Text>
            <Text>Please sign in to continue our app</Text>
          </View>
          <View style={styles.signInForm}>
            <CustomTextInput />
            <CustomTextInput secureTextEntry />
            <View style={{width: '100%', alignItems: 'flex-end'}}>
              <Text
                style={[styles.linkableText, {textAlign: 'right'}]}
                onPress={onPressForgotPassword}>
                Forget Password?
              </Text>
            </View>
          </View>
          <View style={styles.signInBox}>
            <Button title="Sign In" onPress={onPressSignIn} />
            <Text style={{marginTop: 40, marginBottom: 20}}>
              Don't have an account?{' '}
              <Text style={styles.linkableText} onPress={onPressSignUp}>
                Sign up
              </Text>
            </Text>
            <Text>Or Connect</Text>
            <View style={styles.socialBox}>
              <SocialButton
                source={{
                  uri: 'https://marcas-logos.net/wp-content/uploads/2020/01/Facebook-Novo-Logo.jpg',
                }}
                onPress={() =>
                  onFacebookButtonPress().then(() => console.log('Signed in with Facebook!'))
                }
              />
              <SocialButton
                source={{
                  uri: 'https://s4827.pcdn.co/wp-content/uploads/2018/04/Google-logo-2015-G-icon.png',
                }}
                onPress={() =>
                  onGoogleButtonPress().then(() => console.log('Signed in with Google!'))
                }
              />
              <SocialButton
                source={{
                  uri: 'https://s4827.pcdn.co/wp-content/uploads/2018/04/Google-logo-2015-G-icon.png',
                }}
                onPress={() =>
                  onGoogleButtonPress().then(() => console.log('Signed in with Google!'))
                }
              />
              <SocialButton
                source={{
                  uri: 'https://s4827.pcdn.co/wp-content/uploads/2018/04/Google-logo-2015-G-icon.png',
                }}
                onPress={() =>
                  onGoogleButtonPress().then(() => console.log('Signed in with Google!'))
                }
              />
            </View>
          </View>
        </View>
      </Pressable>
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
    paddingTop: 84,
    paddingBottom: 50,
  },
  titleBox: {
    height: 66,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: '#1B1E2B',
    fontSize: 26,
    fontWeight: 'bold',
  },
  signInForm: {
    width: '100%',
    height: 168,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  signInBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialBox: {
    marginTop: 40,
    flexDirection: 'row',
  },
  linkableText: {
    color: colors.primary,
  },
});

export default SignInScreen;
