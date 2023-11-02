import {Dimensions, ImageBackground, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {PropTypes} from 'prop-types';
import {locatePlacePhoto} from '../../services/api';
import {arrayBufferToBase64} from '../../utils/utils';
import defaultPlace from '../../assets/images/default-place.png';

const PlaceImageCard = ({name, photo_reference}) => {
  const [imageData, setImageData] = React.useState(null);

  const getPhoto = async () => {
    try {
      const res = await locatePlacePhoto(photo_reference, 400);
      setImageData(`data:image/jpeg;base64,${arrayBufferToBase64(res)}`);
    } catch (err) {
      console.error(err);
    }
  };

  React.useEffect(() => {
    if (photo_reference) {
      getPhoto();
    }
  }, [photo_reference]);

  const image = React.useMemo(() => {
    if (imageData) {
      return {uri: imageData};
    } else {
      return defaultPlace;
    }
  }, [imageData]);

  return (
    <ImageBackground
      source={image}
      style={{
        width: (Dimensions.get('window').width - 42) / 2,
        aspectRatio: 1.2,
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
