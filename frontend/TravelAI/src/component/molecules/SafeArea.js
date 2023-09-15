import {StatusBar, StyleSheet, View} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Colors} from '../../theme';

const SafeArea = ({top, bottom, children}) => {
  const styles = StyleSheet.create({
    top: {
      backgroundColor: Colors.main_color,
      ...(top?.style && top.style),
    },
    bottom: {
      flex: 1,
      backgroundColor: Colors.main_background_color,
      ...(bottom?.style && bottom.style),
    },
  });

  return (
    <>
      <SafeAreaView edges={['top']} style={styles.top}>
        <StatusBar
          barStyle={top?.barStyle ?? 'light-content'}
          translucent={true}
          backgroundColor={'transparent'}
        />
      </SafeAreaView>
      {bottom?.inactive ? (
        <View style={styles.bottom}>{children}</View>
      ) : (
        <SafeAreaView edges={['bottom']} style={styles.bottom}>
          {children}
        </SafeAreaView>
      )}
    </>
  );
};

export default SafeArea;
