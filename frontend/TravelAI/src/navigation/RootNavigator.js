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
import AddScheduleScreen from '../screens/AddScheduleScreen';
import EditScheduleScreen from '../screens/EditScheduleScreen';
import {createNavigationContainerRef} from '@react-navigation/native';
import SplitBillScreen from '../screens/SplitBillScreen';
import CustomSplitScreen from '../screens/CustomSplitScreen';
import ReceiptScreen from '../screens/ReceiptScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DefaultCurrencyScreen from '../screens/DefaultCurrencyScreen';
import FriendsScreen from '../screens/FriendsScreen';

const Stack = createStackNavigator();

export const navigationRef = createNavigationContainerRef();

export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

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
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="DefaultCurrency" component={DefaultCurrencyScreen} />
        <Stack.Screen name="Friends" component={FriendsScreen} />
      </Stack.Group>
      <Stack.Group
        screenOptions={{
          ...TransitionPresets.BottomSheetAndroid,
        }}>
        <Stack.Screen name="AddPlace" component={AddPlaceScreen} />
        <Stack.Screen name="AddSchedule" component={AddScheduleScreen} />
        <Stack.Screen name="SplitBill" component={SplitBillScreen} />
        <Stack.Screen name="CustomSplit" component={CustomSplitScreen} />
      </Stack.Group>
      <Stack.Group />
      <Stack.Group>
        <Stack.Screen name="AddAddress" component={AddAddressScreen} />
        <Stack.Screen name="AddCustomPlace" component={AddCustomPlaceScreen} />
        <Stack.Screen name="AddTravel" component={AddTravelScreen} />
        <Stack.Screen name="AddDate" component={AddDateScreen} />
        <Stack.Screen name="EditSchedule" component={EditScheduleScreen} />
        <Stack.Screen name="Receipt" component={ReceiptScreen} />
      </Stack.Group>
      {/* OnBoard */}
      {/* Tab */}
    </Stack.Navigator>
  );
};

export {RootNavigator};
