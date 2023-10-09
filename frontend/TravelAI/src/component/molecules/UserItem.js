import React from 'react';
import {View} from 'react-native';
import {Avatar, List} from 'react-native-paper';
import {STYLES} from '../../styles/Stylesheets';

const UserItem = props => {
  const {user, rightComponent} = props;
  const {username, profile_image} = user;

  return (
    <List.Item
      title={username}
      style={[STYLES.PADDING_RIGHT(0)]}
      left={() => <Avatar.Image size={48} source={{uri: profile_image}} />}
      right={() => {
        if (rightComponent) {
          return rightComponent(user);
        }
        return <View />;
      }}
    />
  );
};

export default UserItem;
