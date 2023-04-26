import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import Button from '../component/atoms/Button';
import auth from '@react-native-firebase/auth';
import {StackActions, useNavigation, useRoute} from '@react-navigation/native';

const HomeScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {user} = route.params || {};

  return (
    <View style={styles.container}>
      <Text>HomeScreen</Text>
      <Text>{user.email}</Text>
      <Button
        title="Sign Out"
        onPress={() => {
          auth()
            .signOut()
            .then(() => {
              console.log('User signed out!');
              navigation.dispatch(StackActions.replace('Auth', {screen: 'SignIn'}));
            });
        }}
      />
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
