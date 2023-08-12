import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import SignInScreen from '../screens/SignInScreen';
import TabNavigator from './TabNavigator';
import AddPlaceScreen from '../screens/AddPlaceScreen';
import MainScreen from '../screens/MainScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddTravelScreen from '../screens/AddTravelScreen';
import AddDateScreen from '../screens/AddDateScreen';
import AddCustomPlaceScreen from '../screens/AddCustomPlaceScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import {useRecoilState} from 'recoil';
import userAtom from '../recoil/user/user';
import Reactotron from 'reactotron-react-native';
import AddScheduleScreen from '../screens/AddScheduleScreen';

const Stack = createStackNavigator();

const RootNavigator = () => {
  // states
  const [initializing, setInitializing] = React.useState(true);
  const [user, setUser] = useRecoilState(userAtom);

  // functions
  const getUser = async () => {
    try {
      const result = await AsyncStorage.getItem('user');
      if (result) {
        const user_parsed = JSON.parse(result);
        // Reactotron.log('user_parsed', user_parsed);
        setUser(user_parsed);
      }
    } catch (e) {
      // error reading value
      console.error(e);
    }
  };

  // effects
  React.useEffect(() => {
    getUser().finally(() => {
      setInitializing(false);
    });
  }, []);

  // rendering
  if (initializing) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
      }}>
      {!user && (
        <Stack.Group>
          <Stack.Screen name="SignIn" component={SignInScreen} />
        </Stack.Group>
      )}
      <Stack.Group>
        <Stack.Screen name="Main" component={MainScreen} />
        <Stack.Screen name="Tab" component={TabNavigator} />
      </Stack.Group>
      <Stack.Group
        screenOptions={{
          ...TransitionPresets.BottomSheetAndroid,
        }}>
        <Stack.Screen name="AddPlace" component={AddPlaceScreen} />
        <Stack.Screen name="AddSchedule" component={AddScheduleScreen} />
      </Stack.Group>
      <Stack.Group />
      <Stack.Group>
        <Stack.Screen name="AddAddress" component={AddAddressScreen} />
        <Stack.Screen name="AddCustomPlace" component={AddCustomPlaceScreen} />
        <Stack.Screen name="AddTravel" component={AddTravelScreen} />
        <Stack.Screen name="AddDate" component={AddDateScreen} />
      </Stack.Group>
      {/* OnBoard */}
      {/* Tab */}
    </Stack.Navigator>
  );
};

export {RootNavigator};
