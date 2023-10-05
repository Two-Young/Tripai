import React from 'react';
// import SplashScreen from 'react-native-splash-screen';
import {NavigationContainer} from '@react-navigation/native';
import {RootNavigator, navigationRef} from './src/navigation/RootNavigator';
import {RecoilRoot} from 'recoil';
import {MD3LightTheme as DefaultTheme, PaperProvider} from 'react-native-paper';
import {AxiosInterceptor} from './src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from './src/theme/colors';
import {SocketManager} from './src/services/socket';

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

  /*
      React.useEffect(() => {
    AsyncStorage.clear();
  }, []);
  */

  return (
    <RecoilRoot>
      <PaperProvider theme={theme}>
        <AxiosInterceptor />
        <SocketManager />
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </RecoilRoot>
  );
};

export default App;
