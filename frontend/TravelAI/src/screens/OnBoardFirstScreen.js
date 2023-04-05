import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {View, Text, StyleSheet} from 'react-native';
import Button from '../component/atoms/Button';
import {useNavigation} from '@react-navigation/native';

function OnBoardFirstScreen(props) {
  const navigation = useNavigation();
  const onPressButton = () => {
    navigation.navigate('OnBoardSecond');
  };

  return (
    <View style={styles.container}>
      <Text>OnBoardFirstScreen</Text>
      <Button onPress={onPressButton} title={'Next'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
});

export default OnBoardFirstScreen;
