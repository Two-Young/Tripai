import {React} from 'react';
import {View, Image, StyleSheet} from 'react-native';

const MemoizedFlags = React.memo(function MemoizedFlags({item}) {
  return (
    <View style={styles.flagWrapper}>
      <Image style={styles.flag} source={{uri: item?.png}} />
    </View>
  );
});

const styles = StyleSheet.create({
  flagWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    width: 45,
    height: 30,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 5,
  },
});

export default MemoizedFlags;
