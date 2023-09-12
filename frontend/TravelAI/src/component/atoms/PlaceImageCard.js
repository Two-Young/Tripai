import {ImageBackground, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {PropTypes} from 'prop-types';
import {locatePlacePhoto} from '../../services/api';
import {arrayBufferToBase64} from '../../utils/utils';

const PlaceImageCard = ({name, photo_reference}) => {
  const [imageData, setImageData] = React.useState(null);

  const getPhoto = async () => {
    try {
      const res = await locatePlacePhoto(photo_reference, 400);
      setImageData(arrayBufferToBase64(res));
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    getPhoto();
  }, []);

  return (
    <ImageBackground
      source={{
        uri: `data:image/jpeg;base64,${imageData}`,
      }}
      style={{
        width: 156,
        height: 135,
        padding: 10,
        resizeMode: 'cover',
        justifyContent: 'flex-end',
      }}>
      <View style={styles.overlay} />
      <Text style={{color: 'white', fontSize: 20}}>{name}</Text>
    </ImageBackground>
  );
};

PropTypes.PlaceImageCard = {
  name: PropTypes.string.isRequired,
  photo_reference: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});

export default PlaceImageCard;
