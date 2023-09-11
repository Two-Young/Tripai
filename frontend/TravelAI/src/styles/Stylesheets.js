import {StyleSheet} from 'react-native';

export const STYLES = StyleSheet.create({
  RELATIVE: {
    position: 'relative',
  },
  FILL_100: {
    width: '100%',
    height: '100%',
  },
  WIDTH_100: {
    width: '100%',
  },
  FLEX_ROW: {
    display: 'flex',
    flexDirection: 'row',
  },
  FLEX_ROW_ALIGN_CENTER: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  FLEX_COLUMN_ALIGN_CENTER: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  JUSTIFY_CENTER: {
    justifyContent: 'center',
  },
  JUSTIFY_START: {
    justifyContent: 'flex-start',
  },
  ALIGN_CENTER: {
    alignItems: 'center',
  },
  FLEX_END: {
    alignItems: 'flex-end',
  },
  FLEX_CENTER: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  SPACE_BETWEEN: {
    justifyContent: 'space-between',
  },
  SPACE_AROUND: {
    justifyContent: 'space-around',
  },
  SPACE_EVENLY: {
    justifyContent: 'space-evenly',
  },
  MODAL_BACKGROUND: {
    padding: 0,
    margin: 0,
    justifyContent: 'flex-end',
  },
  COMMON_BODY: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  AUTO_HEIGHT_WEB_VIEW: {
    opacity: 0.99,
    minHeight: 1,
  },
  MARGIN_HORIZONTAL: number => ({
    marginHorizontal: number,
  }),
  MARGIN_VERTICAL: number => ({
    marginVertical: number,
  }),
  MARGIN_TOP: number => ({
    marginTop: number,
  }),
  MARGIN_BOTTOM: number => ({
    marginBottom: number,
  }),
  MARGIN_LEFT: number => ({
    marginLeft: number,
  }),
  MARGIN_RIGHT: number => ({
    marginRight: number,
  }),
  PADDING_HORIZONTAL: number => ({
    paddingHorizontal: number,
  }),
  PADDING_VERTICAL: number => ({
    paddingVertical: number,
  }),
  PADDING_TOP: number => ({
    paddingTop: number,
  }),
  PADDING_BOTTOM: number => ({
    paddingBottom: number,
  }),
  PADDING_LEFT: number => ({
    paddingLeft: number,
  }),
  PADDING_RIGHT: number => ({
    paddingRight: number,
  }),
  FLEX: number => ({
    flex: number,
  }),
  HEIGHT: number => ({
    height: number,
  }),
  WIDTH: number => ({
    width: number,
  }),
});
