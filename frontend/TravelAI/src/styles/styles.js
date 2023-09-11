import {StyleSheet} from 'react-native';
import colors from '../theme/colors';
import fonts from '../theme/fonts';

const defaultStyle = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  heading: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default defaultStyle;
