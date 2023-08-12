import React from 'react';
const {ListItem, Icon} = require('@rneui/base');
import {PropTypes} from 'prop-types';

const SearchResultFooterItem = props => {
  const {onPress} = props;
  return (
    <ListItem bottomDivider onPress={onPress}>
      <ListItem.Content>
        <ListItem.Title>Add Custom Place</ListItem.Title>
        <ListItem.Subtitle>Enter the address manually</ListItem.Subtitle>
      </ListItem.Content>
      <Icon name="add" />
    </ListItem>
  );
};

SearchResultFooterItem.propTypes = {
  onPress: PropTypes.func,
};

export default SearchResultFooterItem;
