import {StyleSheet, View, Image, Text} from 'react-native';
import React from 'react';
import defaultStyle from '../styles/styles';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import {getReceipt, getReceiptImage} from '../services/api';
import {arrayBufferToBase64} from '../utils/utils';

const ReceiptScreen = () => {
  // hooks
  const navigation = useNavigation();
  const route = useRoute();

  // states
  const [loading, setLoading] = React.useState(false);
  const [receipt, setReceipt] = React.useState(null);
  const [receiptImageData, setReceiptImageData] = React.useState(null);

  // functions
  const fetchReceipt = async receipt_id => {
    try {
      const res = await getReceipt(receipt_id);
      setReceipt(res);
      const resImage = await getReceiptImage(receipt_id);
      setReceiptImageData(arrayBufferToBase64(resImage));
    } catch (err) {
      console.error(err);
    }
  };

  console.log(receiptImageData);

  // effects
  React.useEffect(() => {
    if (route.params?.receipt_id) {
      fetchReceipt(route.params?.receipt_id);
    }
  }, [route.params?.receipt_id]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
      <View style={styles.container}>
        <Image
          style={{
            width: 100,
            height: 100,
            backgroundColor: 'red',
          }}
          source={{uri: `data:image/jpeg;base64,${receiptImageData}`}}
        />
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
