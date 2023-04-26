import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {View, Text, Image, StyleSheet} from 'react-native';
import colors from '../theme/colors';
import Button from '../component/atoms/Button';
import {StackActions, useNavigation} from '@react-navigation/native';

function OnBoardThirdScreen(props) {
  const navigation = useNavigation();
  const onPressButton = () => {
    navigation.dispatch(
      StackActions.replace('Auth', {
        screen: 'SignIn',
      }),
    );
  };

  return (
    <SafeAreaView style={styles.safearea}>
      <Image
        style={styles.onBoardImage}
        source={{
          uri: 'https://i.pinimg.com/564x/d4/e2/b9/d4e2b99bbd236575aea5c6f6d0f2aeab.jpg',
        }}
      />
      <View style={styles.container}>
        <Button title="Next" onPress={onPressButton} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safearea: {
    backgroundColor: colors.white,
    flex: 1,
  },
  onBoardImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  container: {
    padding: 20,
  },
});

export default OnBoardThirdScreen;
