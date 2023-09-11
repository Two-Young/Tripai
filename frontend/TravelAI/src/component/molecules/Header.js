import {StyleSheet, Image, TouchableOpacity} from 'react-native';
import React from 'react';
import defaultStyle from '../../styles/styles';
import colors from '../../theme/colors';
import {backIcon} from '../../assets/images';
import {Header} from '@rneui/themed';
import {STYLES} from '../../styles/Stylesheets';

const CustomHeader = ({title}) => {
  console.log(title);
  return (
    <Header
      backgroundColor={colors.primary}
      barStyle="light-content"
      containerStyle={[
        STYLES.PADDING_HORIZONTAL(20),
        STYLES.HEIGHT(64),
        STYLES.FLEX_ROW_ALIGN_CENTER,
      ]}
      leftComponent={
        <TouchableOpacity>
          <Image source={backIcon} style={styles.icon} />
        </TouchableOpacity>
      }
      centerComponent={{text: title, style: defaultStyle.heading}}
      rightComponent={{
        icon: 'menu',
        color: colors.white,
      }}
    />
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  icon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
});
