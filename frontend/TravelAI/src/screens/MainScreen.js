import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import Button from '../component/atoms/Button';
import {StackActions, useNavigation, useRoute} from '@react-navigation/native';

export default function MainScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const {user} = route.params || {};

  return (
    <View style={styles.container}>
      <Text>MainScreen</Text>
      <Text>{JSON.stringify(user)}</Text>
      <Button
        title={'Next'}
        onPress={() => {
          navigation.navigate('Tab', {screen: 'Home'});
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});
