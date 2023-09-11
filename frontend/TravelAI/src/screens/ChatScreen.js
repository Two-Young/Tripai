import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Header} from '@rneui/themed';

const ChatScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView edges={['bottom']}>
      <Header
        leftComponent={{
          icon: 'menu',
          onPress: () => navigation.openDrawer(),
        }}
        centerComponent={{text: 'Chat', style: {fontSize: 20}}}
      />
      <View style={styles.container}>
        <Text>ChatScreen</Text>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({});
