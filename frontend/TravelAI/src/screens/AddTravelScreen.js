import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import React from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useRecoilState} from 'recoil';
import {Header} from '@rneui/themed';
import {IconButton, Searchbar, List, Checkbox, Divider, Button} from 'react-native-paper';
import countriesAtom from '../recoil/countries/countries';
import {locateCountries} from '../services/api';
import defaultStyle from '../styles/styles';
import colors from '../theme/colors';

const AddTravelScreen = () => {
  // state
  const [selected, setSelected] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [countries, setCountries] = useRecoilState(countriesAtom);

  // hook
  const navigation = useNavigation();

  // function
  const getCountries = async () => {
    try {
      const data = await locateCountries();
      const sortedData = [...data].sort((a, b) => a.country_code.localeCompare(b.country_code));
      setCountries(sortedData);
    } catch (err) {
      console.error(err);
    }
  };

  const onPressNext = () => {
    navigation.navigate('AddDate', {countries: selected});
  };

  // effect
  React.useEffect(() => {
    if (countries.length === 0) {
      getCountries();
    }
  }, [countries]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView edges={['top', 'bottom']} style={defaultStyle.container}>
        <Header
          backgroundColor="#fff"
          barStyle="dark-content"
          leftComponent={
            <IconButton
              mode="contained"
              icon="chevron-left"
              iconColor="#000"
              onPress={() => navigation.goBack()}
            />
          }
          centerComponent={{text: 'Choose the countries', style: defaultStyle.heading}}
        />
        <View style={styles.container}>
          <Text style={styles.description}>
            Choose all the countries you want to add to your trip
          </Text>
          <View style={styles.searchbarWrapper}>
            <Searchbar placeholder="Search the country" value={search} onChangeText={setSearch} />
          </View>
          <FlatList
            removeClippedSubviews
            initialNumToRender={20}
            data={countries.filter(country =>
              country.common_name.toLowerCase().includes(search.toLowerCase()),
            )}
            keyExtractor={item => item?.country_code}
            renderItem={({item}) => (
              <CountryListItem item={item} selected={selected} setSelected={setSelected} />
            )}
            disableVirtualization={false}
          />
          {selected.length > 0 && (
            <SelectedCountrySection
              countries={countries}
              selected={selected}
              setSelected={setSelected}
              onPress={onPressNext}
            />
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const CountryListItem = ({item, selected, setSelected}) => {
  const checked = React.useMemo(() => {
    return selected.includes(item.country_code);
  }, [selected, item.country_code]);

  const leftComponent = () => <MemoizedFlags item={item} />;

  const rightComponent = () => (
    <Checkbox
      status={checked ? 'checked' : 'unchecked'}
      onPress={() => {
        if (checked) {
          setSelected(prevState => prevState.filter(code => code !== item.country_code));
        } else {
          setSelected(prevState => [...prevState, item.country_code]);
        }
      }}
    />
  );

  return (
    <React.Fragment>
      <List.Item
        style={styles.countryListItem}
        titleStyle={styles.countryListTitle}
        title={item.common_name}
        left={leftComponent}
        right={rightComponent}
      />
      <Divider />
    </React.Fragment>
  );
};

const MemoizedFlags = React.memo(function MemoizedFlags({item}) {
  return (
    <View style={styles.flagWrapper}>
      <Image style={styles.flag} source={{uri: item?.png}} />
    </View>
  );
});

const MemoizedSelectedFlags = React.memo(function MemoizedSelectedFlags({item, onPressDelete}) {
  return (
    <View>
      <View style={styles.deleteSelectedCountryBtn}>
        <IconButton
          icon="close"
          color="black"
          size={10}
          onPress={() => onPressDelete(item?.country_code)}
        />
      </View>
      <Image style={styles.flag} source={{uri: item?.png}} />
    </View>
  );
});

const SelectedCountrySection = ({countries, selected, setSelected, onPress}) => {
  const onPressDelete = React.useCallback(
    code => {
      setSelected(prevState => prevState.filter(country => country !== code));
    },
    [setSelected],
  );

  return (
    <View style={styles.selectedCountrySection}>
      <Text style={styles.selectedCountryText}>{`Selected Countries : ${selected.length}`}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={selected}
        contentContainerStyle={styles.selectedCountryContentContainer}
        renderItem={({item}) => (
          <MemoizedSelectedFlags
            item={countries.find(country => country.country_code === item)}
            onPressDelete={onPressDelete}
          />
        )}
        ItemSeparatorComponent={<RenderSeparator />}
      />
      <Button
        style={styles.nextBtn}
        contentStyle={styles.nextBtnContent}
        mode="contained"
        onPress={onPress}>
        Next / Choose the Date
      </Button>
    </View>
  );
};

const RenderSeparator = () => <View style={styles.seperator} />;

export default AddTravelScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  description: {
    paddingHorizontal: 80,
    fontSize: 15,
    textAlign: 'center',
    color: '#808080',
  },
  searchbarWrapper: {
    marginTop: 10,
    paddingHorizontal: 31,
    marginBottom: 36,
  },
  flagWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  flag: {
    width: 45,
    height: 30,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 5,
  },
  countryListItem: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countryListTitle: {
    fontSize: 15,
    color: colors.black,
  },
  selectedCountrySection: {
    height: 160,
    backgroundColor: colors.white,
    borderTopColor: '#808080',
    borderTopWidth: 1,
    padding: 10,
  },
  selectedCountryContentContainer: {
    width: '100%',
    paddingVertical: 20,
  },
  selectedCountryText: {
    color: colors.black,
    fontSize: 16,
  },
  deleteSelectedCountryBtn: {
    position: 'absolute',
    top: -7.5,
    right: -7.5,
    zIndex: 1,
    width: 15,
    height: 15,
    borderRadius: 20,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#808080',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seperator: {
    width: 10,
    backgroundColor: 'transparent',
  },
  nextBtn: {
    marginTop: 10,
    borderRadius: 5,
  },
  nextBtnContent: {
    height: 50,
  },
});
