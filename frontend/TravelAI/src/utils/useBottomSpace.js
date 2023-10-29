import {getStatusBarHeight} from 'react-native-status-bar-height';
import DeviceInfo from 'react-native-device-info';
import {useMemo} from 'react';

const IPHONE_14_PRO = 'iPhone 14 Pro';
const IPHONE_14_PRO_MAX = 'iPhone 14 Pro Max';
const IPHONE_14_PRO_STATUS_BAR_HEIGHT = 59;

export default function useBottomSpace() {
  const statusBarHeight = useMemo(() => {
    const model = DeviceInfo.getModel();
    if (model === IPHONE_14_PRO || model === IPHONE_14_PRO_MAX) {
      return IPHONE_14_PRO_STATUS_BAR_HEIGHT;
    } else {
      return getStatusBarHeight();
    }
  }, []);

  return statusBarHeight;
}
