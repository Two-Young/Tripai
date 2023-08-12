import React from 'react';
import {FlatList} from 'react-native';
import SearchResultItemList from '../molecules/SearchResultItemList';
import SearchResultFooterItem from '../molecules/SearchResultFooterItem';
import {PropTypes} from 'prop-types';

const SearchResultFlatList = ({isZeroResult, searchResult, onPressListItem, onPressFooterItem}) => {
  return (
    <FlatList
      style={{flex: 1}}
      data={isZeroResult ? [] : searchResult}
      renderItem={({item}) => (
        <SearchResultItemList item={item} onPress={() => onPressListItem(item)} />
      )}
      ListFooterComponent={
        searchResult.length > 0 && <SearchResultFooterItem onPress={onPressFooterItem} />
      }
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
