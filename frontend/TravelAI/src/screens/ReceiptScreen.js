import {StyleSheet, View, Text, ImageBackground, Dimensions, TouchableOpacity} from 'react-native';
import React from 'react';
import defaultStyle from '../styles/styles';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {getReceipt, getReceiptImage} from '../services/api';
import {arrayBufferToBase64, showErrorToast} from '../utils/utils';

const ReceiptScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();

  // states
  const [loading, setLoading] = React.useState(false);
  const [receipt, setReceipt] = React.useState(null);
  const [receiptImageData, setReceiptImageData] = React.useState(null);

  const [pair, setPair] = React.useState({
    item: '',
    price: '',
  });

  const [selected, setSelected] = React.useState([]);

  const ratio = React.useMemo(() => {
    if (!receipt) {
      return 1;
    }
    const {width, height} = receipt?.resolution || {width: 1, height: 1};
    const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

    return Math.min(screenWidth / width, screenHeight / height);
  }, [receipt]);

  const imageStyle = React.useMemo(() => {
    const {width, height} = receipt?.resolution || {width: 0, height: 0};
    return {
      width: width * ratio,
      height: height * ratio,
    };
  }, [receipt]);

  // functions
  const fetchReceipt = async receipt_id => {
    try {
      const res = await getReceipt(receipt_id);
      setReceipt(res);
      const resImage = await getReceiptImage(receipt_id);
      setReceiptImageData(arrayBufferToBase64(resImage));
    } catch (err) {
      showErrorToast(err);
    }
  };

  const itemDisabled = item => {
    return (
      selected.some(p => p.item === item?.box_id || p.price === item?.box_id) ||
      pair.item === item?.box_id
    );
  };

  // effects
  React.useEffect(() => {
    if (route.params?.receipt_id) {
      fetchReceipt(route.params?.receipt_id);
    }
  }, [route.params?.receipt_id]);

  return (
    <SafeAreaView edges={['bottom']} style={defaultStyle.container}>
      <View style={styles.container}>
        <ImageBackground
          style={{
            ...imageStyle,
          }}
          source={{uri: `data:image/jpeg;base64,${receiptImageData}`}}>
          {receipt?.item_boxes?.map((item, index) => {
            const boxStyle = {
              position: 'absolute',
              left: item?.boundary?.left * ratio,
              top: item?.boundary?.top * ratio,
              width: item?.boundary?.width * ratio,
              height: item?.boundary?.height * ratio,
              borderWidth: 1,
              borderColor: itemDisabled(item) ? 'blue' : 'red',
            };
            return (
              <TouchableOpacity
                onPress={() => {
                  if (pair.item === '') {
                    setPair({...pair, item: item?.box_id});
                  } else if (pair.price === '') {
                    setSelected([...selected, {...pair, price: item?.box_id}]);
                    setPair({item: '', price: ''});
                  }
                }}
                key={index}
                style={boxStyle}
                disabled={itemDisabled(item)}
              />
            );
          })}
        </ImageBackground>
        <View>
          <Text>Table</Text>
          {selected.map(pair => {
            return (
              <View key={pair?.item}>
                <Text>{pair?.item}</Text>
                <Text>{pair?.price}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ReceiptScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
