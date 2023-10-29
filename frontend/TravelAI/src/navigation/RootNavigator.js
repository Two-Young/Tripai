import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import SignInScreen from '../screens/SignInScreen.js';
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
import ReceiptScreen from '../screens/ReceiptScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FriendsScreen from '../screens/FriendsScreen';
import AddFriendsScreen from '../screens/AddFriendsScreen';
import SessionRequestsScreen from '../screens/SessionRequestsScreen.js';
import ManageParticipantsScreen from '../screens/ManageParticipantsScreen.js';
import AddBudgetScreen from '../screens/AddBudgetScreen.js';
import AddExpenditureScreen from './../screens/AddExpenditureScreen';
import EditReceiptScreen from '../screens/EditReceiptScreen.js';

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
        <Stack.Screen name="MyFriends" component={FriendsScreen} />
        <Stack.Screen name="AddFriends" component={AddFriendsScreen} />
        <Stack.Screen name="SessionRequests" component={SessionRequestsScreen} />
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
        <Stack.Screen name="ManageParticipants" component={ManageParticipantsScreen} />
        <Stack.Screen name="AddAddress" component={AddAddressScreen} />
        <Stack.Screen name="AddCustomPlace" component={AddCustomPlaceScreen} />
        <Stack.Screen name="AddTravel" component={AddTravelScreen} />
        <Stack.Screen name="AddDate" component={AddDateScreen} />
        <Stack.Screen name="EditSchedule" component={EditScheduleScreen} />
        <Stack.Screen name="Receipt" component={ReceiptScreen} />
        <Stack.Screen name="AddBudget" component={AddBudgetScreen} />
        <Stack.Screen name="AddExpenditure" component={AddExpenditureScreen} />
        <Stack.Screen name="EditReceipt" component={EditReceiptScreen} />
      </Stack.Group>
      {/* OnBoard */}
      {/* Tab */}
    </Stack.Navigator>
  );
};

export {RootNavigator};
