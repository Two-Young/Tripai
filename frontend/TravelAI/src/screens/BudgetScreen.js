import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import defaultStyle from '../styles/styles';
import {Header} from '@rneui/themed';
import colors from '../theme/colors';
import {FAB} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';

const BudgetScreen = () => {
  // hooks
  const navigation = useNavigation();

  // states
  const [fabState, setFabState] = React.useState({
    open: false,
  });

  const onFabStateChange = ({open}) => setFabState({open});

  const navigateToSplitBill = () => {
    navigation.navigate('SplitBill');
  };

  const navigateToCustomSplit = () => {
    navigation.navigate('CustomSplit');
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
      <View style={defaultStyle.container}>
        <Header
          backgroundColor="#fff"
          barStyle="dark-content"
          rightComponent={{
            icon: 'menu',
            color: colors.black,
          }}
          centerComponent={{text: 'Budget', style: defaultStyle.heading}}
        />
        <FAB.Group
          open={fabState.open}
          icon={fabState.open ? 'close' : 'plus'}
          actions={[
            {icon: 'plus', label: '1/N', onPress: navigateToSplitBill},
            {icon: 'star', label: 'Custom', onPress: navigateToCustomSplit},
          ]}
          onStateChange={onFabStateChange}
          onPress={() => {
            if (fabState.open) {
              // do something if the speed dial is open
            }
          }}
          color="#fff"
          fabStyle={styles.fab}
        />
      </View>
    </SafeAreaView>
  );
};

export default BudgetScreen;

const styles = StyleSheet.create({
  fab: {
    backgroundColor: colors.primary,
  },
});
