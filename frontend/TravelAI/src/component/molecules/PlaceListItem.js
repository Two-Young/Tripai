import {StyleSheet, Linking} from 'react-native';
import React from 'react';
import {Button, Image, ListItem} from '@rneui/themed';
import {API_URL_PROD, deleteLocation, locatePlacePhoto} from '../../services/api';
import {arrayBufferToBase64, showErrorToast} from '../../utils/utils';
import {STYLES} from '../../styles/Stylesheets';
import colors from '../../theme/colors';
import defaultPlace from '../../assets/images/default-place.png';

const PlaceListItem = props => {
  const {item, onPress, setArr} = props;
  const {photo_reference} = item;

  const [imageData, setImageData] = React.useState(null);

  const getPhoto = async () => {
    try {
      const res = await locatePlacePhoto(photo_reference, 400);
      setImageData(`data:image/jpeg;base64,${arrayBufferToBase64(res)}`);
    } catch (err) {
      console.error(err);
    }
  };

  const onPressInfo = async reset => {
    try {
      await Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`,
      );
    } catch (error) {
      showErrorToast(error);
    } finally {
      reset();
    }
  };

  const onPressDelete = async reset => {
    try {
      await deleteLocation(item.location_id);
      setArr(prev => prev.filter(place => place.location_id !== item.location_id));
    } catch (err) {
      showErrorToast(err);
    } finally {
      reset();
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
    <ListItem.Swipeable
      bottomDivider
      onPress={onPress ? () => onPress(item) : null}
      leftContent={reset => (
        <Button
          title="Info"
          onPress={() => onPressInfo(reset)}
          onLongPress={reset}
          icon={{name: 'info', color: 'white'}}
          buttonStyle={{minHeight: '100%'}}
        />
      )}
      rightContent={reset => (
        <Button
          title="Delete"
          onPress={() => onPressDelete(reset)}
          onLongPress={reset}
          icon={{name: 'delete', color: 'white'}}
          buttonStyle={{minHeight: '100%', backgroundColor: colors.red}}
        />
      )}>
      <Image source={image} style={[styles.photo, STYLES.MARGIN_LEFT(10)]} />
      <ListItem.Content>
        <ListItem.Title>{item?.name}</ListItem.Title>
        <ListItem.Subtitle>{item?.address}</ListItem.Subtitle>
      </ListItem.Content>
    </ListItem.Swipeable>
  );
};

export default PlaceListItem;

const styles = StyleSheet.create({
  photo: {
    width: 40,
    height: 40,
    resizeMode: 'cover',
  },
});
