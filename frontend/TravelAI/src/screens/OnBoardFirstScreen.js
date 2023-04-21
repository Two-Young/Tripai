import React, {useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {View, Text, StyleSheet} from 'react-native';
import Button from '../component/atoms/Button';
import {useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {LoginManager, AccessToken} from 'react-native-fbsdk-next';

GoogleSignin.configure({
  webClientId: '24378092542-l46d9sch9rgn6d2th6hj880q3841o3ml.apps.googleusercontent.com',
});

async function onGoogleButtonPress() {
  // Check if your device supports Google Play
  await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
  // Get the users ID token
  const {idToken} = await GoogleSignin.signIn();

  // Create a Google credential with the token
  const googleCredential = auth.GoogleAuthProvider.credential(idToken);

  // Sign-in the user with the credential
  return auth().signInWithCredential(googleCredential);
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

  // Create a Firebase credential with the AccessToken
  const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);

  // Sign-in the user with the credential
  return auth().signInWithCredential(facebookCredential);
}

function OnBoardFirstScreen(props) {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState(true);
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

  const navigation = useNavigation();
  const onPressButton = () => {
    navigation.navigate('OnBoardSecond');
  };

  if (initializing) return null;

  return (
    <SafeAreaView style={styles.safearea}>
      <View style={styles.container}>
        <Text>OnBoardFirstScreen</Text>
        <Button onPress={onPressButton} title={'Next'} />
        {!user ? (
          <>
            <Button
              title="Facebook Sign-In"
              onPress={() =>
                onFacebookButtonPress().then(() => console.log('Signed in with Facebook!'))
              }
            />
            <Button
              title="Google Sign-In"
              onPress={() =>
                onGoogleButtonPress().then(() => console.log('Signed in with Google!'))
              }
            />
          </>
        ) : (
          <>
            <Text>{user.email}</Text>
            <Button
              title="Sign Out"
              onPress={() => {
                auth()
                  .signOut()
                  .then(() => console.log('User signed out!'));
              }}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safearea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});

export default OnBoardFirstScreen;
