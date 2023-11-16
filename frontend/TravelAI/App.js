import React from 'react';
import {LogBox} from 'react-native';
// import SplashScreen from 'react-native-splash-screen';
import {NavigationContainer} from '@react-navigation/native';
import {RootNavigator, navigationRef} from './src/navigation/RootNavigator';
import {RecoilRoot} from 'recoil';
import {MD3LightTheme as DefaultTheme, PaperProvider} from 'react-native-paper';
import {AxiosInterceptor} from './src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from './src/theme/colors';
import {SocketManager} from './src/services/socket';
import Toast from 'react-native-toast-message';
import {toastConfig} from './src/utils/utils';

LogBox.ignoreLogs(['Warning: ...']); // Ignore log notification by message
LogBox.ignoreAllLogs(); //Ignore all log notifications

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
  },
};

const App = () => {
  /*
  	useEffect(() => {
    SplashScreen.hide();
  	}, []);
  */

  return (
    <>
      <RecoilRoot>
        <PaperProvider theme={theme}>
          <AxiosInterceptor />
          <SocketManager />
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
          </NavigationContainer>
        </PaperProvider>
      </RecoilRoot>
      <Toast config={toastConfig} visibilityTime={2500} />
    </>
  );
};

export default App;
