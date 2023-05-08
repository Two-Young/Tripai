import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import SplashScreen from 'react-native-splash-screen';
import RootNavigator from './src/navigation/RootNavigator';
import {RecoilRoot} from 'recoil';

function App() {
  useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <RecoilRoot>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </RecoilRoot>
  );
}

export default App;
