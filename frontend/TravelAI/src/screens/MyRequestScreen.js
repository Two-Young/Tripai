import {StyleSheet, Text, View, FlatList} from 'react-native';
import React from 'react';
import SafeArea from '../component/molecules/SafeArea';
import defaultStyle from './../styles/styles';
import {useNavigation} from '@react-navigation/native';
import {
  cancelSessionJoinRequest,
  confirmSessionInvitation,
  getSessionInvitationRequests,
  getSessionJoinWaitings,
  joinSession,
} from '../services/api';
import {IconButton, List, TextInput} from 'react-native-paper';
import reactotron from 'reactotron-react-native';

const MyRequestScreen = () => {
  // hooks
  const navigation = useNavigation();
  // states
  const [sessionCode, setSessionCode] = React.useState('');
  const [request, setRequest] = React.useState([]);
  const [invited, setInvited] = React.useState([]);

  // functions
  const fetchRequest = async () => {
    try {
      const res = await getSessionJoinWaitings();
      setRequest(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvited = async () => {
    try {
      const res = await getSessionInvitationRequests();
      setInvited(res);
    } catch (err) {
      console.error(err);
    }
  };

  const onCancelRequest = async sessionID => {
    try {
      await cancelSessionJoinRequest(sessionID);
      fetchRequest();
    } catch (err) {
      console.error(err);
    }
  };

  const onConfirmInvitation = async (sessionID, accept) => {
    try {
      await confirmSessionInvitation(sessionID, accept);
      fetchInvited();
    } catch (err) {
      console.error(err);
    }
  };

  const onRequestSessionJoin = async () => {
    try {
      await joinSession(sessionCode);
      setSessionCode('');
      fetchRequest();
    } catch (err) {
      console.error(err);
    }
  };

  // effects
  React.useEffect(() => {
    fetchRequest();
    fetchInvited();
  }, []);

  return (
    <SafeArea>
      <View style={defaultStyle.container}>
        <Text>Session Code</Text>
        <TextInput
          value={sessionCode}
          onChangeText={setSessionCode}
          onSubmitEditing={sessionCode.length > 0 ? onRequestSessionJoin : undefined}
        />
        <Text>Request</Text>
        <FlatList
          style={{flex: 1}}
          data={request}
          renderItem={({item}) => (
            <List.Item
              title={item.session_name}
              description={item.session_code}
              right={props => (
                <IconButton icon="close" onPress={() => onCancelRequest(item?.session_id)} />
              )}
            />
          )}
        />
        <Text>Invited</Text>
        <FlatList
          style={{flex: 1}}
          data={invited}
          renderItem={({item}) => (
            <List.Item
              title={item.session_name}
              description={item.session_code}
              right={props => (
                <View style={{flexDirection: 'row'}}>
                  <IconButton
                    icon="check"
                    onPress={() => onConfirmInvitation(item?.session_id, true)}
                  />
                  <IconButton
                    icon="close"
                    onPress={() => onConfirmInvitation(item?.session_id, false)}
                  />
                </View>
              )}
            />
          )}
        />
      </View>
    </SafeArea>
  );
};

export default MyRequestScreen;

const styles = StyleSheet.create({});
