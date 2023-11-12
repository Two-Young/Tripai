import React from 'react';
import {FlatList} from 'react-native';
import SearchResultItemList from '../molecules/SearchResultItemList';
import {PropTypes} from 'prop-types';
import {STYLES} from '../../styles/Stylesheets';

const SearchResultFlatList = ({isZeroResult, searchResult, onPressListItem}) => {
  return (
    <FlatList
      style={STYLES.FLEX(1)}
      data={isZeroResult ? [] : searchResult}
      renderItem={({item}) => (
        <SearchResultItemList item={item} onPress={() => onPressListItem(item)} />
      )}
    />
  );
};

PropTypes.SearchResultFlatList = {
  isZeroResult: PropTypes.bool.isRequired,
  searchResult: PropTypes.array.isRequired,
  onPressListItem: PropTypes.func.isRequired,
  onPressFooterItem: PropTypes.func.isRequired,
};

export default SearchResultFlatList;
