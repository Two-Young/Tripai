import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {View, Text, Image, StyleSheet} from 'react-native';
import colors from '../theme/colors';
import Button from '../component/atoms/Button';
import {useNavigation} from '@react-navigation/native';

function OnBoardSecondScreen(props) {
  const navigation = useNavigation();
  const onPressButton = () => {
    navigation.navigate('OnBoardThird');
  };

  return (
    <SafeAreaView style={styles.safearea}>
      <Image
        style={styles.onBoardImage}
        source={{
          uri: 'https://i.pinimg.com/564x/47/c4/90/47c490ee66c0de6afbc7cf3b4c2c374e.jpg',
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

export default OnBoardSecondScreen;
