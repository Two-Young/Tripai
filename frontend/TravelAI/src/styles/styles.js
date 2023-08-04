import {StyleSheet} from 'react-native';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const defaultStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  buttonContent: {
    textAlign: 'center',
    color: colors.white,
    fontSize: fonts.size.font8,
  },
  heading: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default defaultStyle;
