import {getStatusBarHeight} from 'react-native-status-bar-height';
import DeviceInfo from 'react-native-device-info';
import {useMemo} from 'react';

const DINAMIC_ISLAND_BOTTOM_HEIGHT = 59;

export default function useBottomSpace() {
  const statusBarHeight = useMemo(() => {
    const model = DeviceInfo.getModel();
    switch (model) {
      case 'iPhone 14 Pro':
      case 'iPhone 14 Pro Max':
      case 'iPhone 15':
      case 'iPhone 15 Plus':
      case 'iPhone 15 Pro':
      case 'iPhone 15 Pro Max':
        return DINAMIC_ISLAND_BOTTOM_HEIGHT;
      default:
        return getStatusBarHeight();
    }
  }, []);

  return statusBarHeight;
}
