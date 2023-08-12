import React from 'react';
import {ListItem} from '@rneui/base';
import {PropTypes} from 'prop-types';

const SearchResultItemList = props => {
  const {item, onPress} = props;
  return (
    <ListItem bottomDivider onPress={onPress}>
      <ListItem.Content>
        <ListItem.Title>{item.description}</ListItem.Title>
      </ListItem.Content>
    </ListItem>
  );
};

SearchResultItemList.propTypes = {
  item: PropTypes.object,
  onPress: PropTypes.func,
};

export default SearchResultItemList;
