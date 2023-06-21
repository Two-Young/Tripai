import React, {useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {View, Image, StyleSheet} from 'react-native';
import Button from '../component/atoms/Button';
import {useNavigation} from '@react-navigation/native';
import colors from '../theme/colors';

function OnBoardFirstScreen(props) {
  const navigation = useNavigation();
  const onPressButton = () => {
    navigation.navigate('OnBoardSecond');
  };

  return (
    <SafeAreaView style={styles.safearea}>
      <Image
        style={styles.onBoardImage}
        source={{
          uri: 'https://i.pinimg.com/originals/4a/ed/3e/4aed3ebe924270e9fefebc5267cbca30.jpg',
        }}
      />
      <View style={styles.container}>
        <Button title="Get Started" onPress={onPressButton} />
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

export default OnBoardFirstScreen;
