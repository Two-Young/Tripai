import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import colors from '../../theme/colors';
import {STYLES} from '../../styles/Stylesheets';
import {IconButton} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import MenuDrawer from '../organisms/MenuDrawer';
import {Fonts} from '../../theme';

export const CUSTOM_HEADER_THEME = {
  WHITE: {
    background: colors.white,
    content: colors.black,
  },
  PRIMARY: {
    background: colors.primary,
    content: colors.white,
  },
};

const CustomHeader = ({
  title,
  rightComponent,
  theme = CUSTOM_HEADER_THEME.PRIMARY,
  useBack = true,
  useMenu = true,
}) => {
  const navigation = useNavigation();

  const [menuVisible, setMenuVisible] = React.useState(false); // menu visible 여부
  const [clickDisabled, setClickDisabled] = React.useState(false); // 뒤로가기 버튼 클릭 여부
  const openMenu = () => {
    setMenuVisible(true);
  };

  const handleGoBack = () => {
    if (!clickDisabled) {
      setClickDisabled(true);
      navigation.goBack();
      setTimeout(() => {
        setClickDisabled(false);
      }, 1000);
    }
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
          {backgroundColor: theme.background},
        ]}>
        <View style={styles.sideComponentStyle}>
          {useBack && (
            <IconButton
              icon={'arrow-left'}
              iconColor={theme.content}
              disabled={clickDisabled}
              onPress={handleGoBack}
              style={styles.iconButton}
            />
          )}
        </View>
        <Text style={[styles.titleText, {color: theme.content}]}>{title}</Text>
        <View style={styles.sideComponentStyle}>
          {!rightComponent && useMenu && (
            <IconButton
              icon={'menu'}
              iconColor="white"
              onPress={openMenu}
              style={styles.iconButton}
            />
          )}
          {Boolean(rightComponent) && rightComponent}
        </View>
      </View>
    </>
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  sideComponentStyle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
