import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import colors from '../../theme/colors';
import {STYLES} from '../../styles/Stylesheets';
import {IconButton} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import MenuDrawer from '../organisms/MenuDrawer';
import {Fonts} from '../../theme';

const CustomHeader = ({backgroundColor, leftComponent, title, rightComponent}) => {
  const navigation = useNavigation();

  const [menuVisible, setMenuVisible] = React.useState(false); // menu visible 여부

  const openMenu = () => {
    setMenuVisible(true);
  };

  return (
    <>
      <MenuDrawer visible={menuVisible} setVisible={setMenuVisible} />
      <View
        style={[
          STYLES.PADDING_HORIZONTAL(20),
          STYLES.HEIGHT(64),
          STYLES.FLEX_ROW_ALIGN_CENTER,
          STYLES.SPACE_BETWEEN,
          {backgroundColor: backgroundColor ?? colors.primary},
        ]}>
        <View style={styles.sideComponentStyle}>
          {leftComponent ?? (
            <IconButton
              icon={'arrow-left'}
              iconColor="white"
              onPress={() => {}}
              style={styles.iconButton}
            />
          )}
        </View>
        <Text style={styles.titleText}>{title}</Text>
        <View style={styles.sideComponentStyle}>
          {rightComponent ?? (
            <IconButton
              icon={'menu'}
              iconColor="white"
              onPress={openMenu}
              style={styles.iconButton}
            />
          )}
        </View>
      </View>
    </>
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  sideComponentStyle: {
    width: 30,
    height: 30,
  },
  iconButton: {
    width: 30,
    height: 30,
    margin: 0,
    borderRadius: 0,
  },
  titleText: {
    ...Fonts.Bold(24),
    color: colors.white,
  },
});
