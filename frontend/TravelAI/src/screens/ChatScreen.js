import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import SafeArea from '../component/molecules/SafeArea';
import CustomHeader from '../component/molecules/CustomHeader';
import defaultStyle from '../styles/styles';

const ChatScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeArea>
      <CustomHeader title={'AI CHAT'} />
      <View style={defaultStyle.container}>
        <Text>CHAT SCREEN</Text>
      </View>
    </SafeArea>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({});
