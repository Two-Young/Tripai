import {ImageBackground, StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {PropTypes} from 'prop-types';

const GOOGLE_API_KEY = 'AIzaSyDfvktC6dAf0oARSwkLrTcVwe1Vi3GEz58';

const PlaceImageCard = ({name, photo_reference}) => {
  const [imageData, setImageData] = React.useState(null);

  const getPhoto = async () => {
    try {
      // const res = await locatePlacePhoto(photo_reference, 400);
      setImageData(
        `https://maps.googleapis.com/maps/api/place/photo?photo_reference=${photo_reference}&maxwidth=400&key=${GOOGLE_API_KEY}`,
      );
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
        uri: imageData,
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
