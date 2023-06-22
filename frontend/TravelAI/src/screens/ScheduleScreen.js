import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import MapView, {PROVIDER_GOOGLE, Marker, Polyline} from 'react-native-maps';

const ScheduleScreen = () => {
  return (
    <View style={{flex: 1}}>
      <Text>MainScreen</Text>
      <View style={styles.container}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}>
          <Marker
            coordinate={{
              latitude: 37.78825,
              longitude: -122.4324,
            }}
            title={'title'}
          />
          <Marker
            coordinate={{
              latitude: 37.78825,
              longitude: -122.46,
            }}
            title={'title2'}
          />
          <Polyline
            coordinates={[
              {
                latitude: 37.78825,
                longitude: -122.4324,
              },
              {
                latitude: 37.78825,
                longitude: -122.46,
              },
            ]}
            strokeColor="#000" // fallback for when `strokeColors` is not supported by the map-provider
            strokeColors={['#7F0000']}
            strokeWidth={6}
          />
        </MapView>
      </View>
    </View>
  );
};

export default ScheduleScreen;

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    height: 400,
    width: 400,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
