import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';

const ChatScreen = () => {
  return (
    <SafeAreaView edges={['top', 'bottom']}>
      <View>
        <Text>ChatScreen</Text>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({});
