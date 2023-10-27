import {StyleSheet, Text, View, FlatList, Image, TouchableWithoutFeedback} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {useRecoilState} from 'recoil';
import {IconButton, Searchbar} from 'react-native-paper';
import countriesAtom from '../recoil/countries/countries';
import {locateCountries} from '../services/api';
import colors from '../theme/colors';
import CountryListItem from '../component/molecules/CountryListItem';
import {Light} from '../theme/fonts';
import {searchIcon} from '../assets/images';
import {arrowRight} from '../assets/images';
import MainButton from '../component/atoms/MainButton';
import CustomHeader, {CUSTOM_HEADER_THEME} from '../component/molecules/CustomHeader';
import SafeArea from '../component/molecules/SafeArea';
import {STYLES} from '../styles/Stylesheets';
import DismissKeyboard from '../component/molecules/DismissKeyboard';

const AddTravelScreen = () => {
  // state
  const [selected, setSelected] = React.useState([]);
  const [search, setSearch] = React.useState('');
  const [countries, setCountries] = useRecoilState(countriesAtom);

  // hook
  const navigation = useNavigation();

  // ref
  const inputRef = React.useRef(null);

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
    <SafeArea top={{style: {backgroundColor: colors.white}, barStyle: 'dark-content'}}>
      <DismissKeyboard>
        <View style={STYLES.FLEX(1)}>
          <CustomHeader title="Choose the countries" theme={CUSTOM_HEADER_THEME.WHITE} />
          <View style={[STYLES.FLEX(1)]}>
            <Text style={styles.description}>
              {'Choose all the countries you want to\nadd to your trip'}
            </Text>
            <View style={styles.searchbarWrapper}>
              <Searchbar
                ref={inputRef}
                icon={searchIcon}
                placeholder="Search the country"
                placeholderTextColor={'gray'}
                value={search}
                onChangeText={setSearch}
                style={{
                  borderRadius: 8,
                  backgroundColor: '#F5F4F6',
                }}
              />
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
        </View>
      </DismissKeyboard>
    </SafeArea>
  );
};

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
      <Text style={styles.selectedCountryText}>
        {'Selected Countries : '}
        <Text style={{color: 'gray'}}>{selected.length}</Text>
      </Text>
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
      <MainButton text={'Next / Choose the Date'} onPress={onPress} />
    </View>
  );
};

const RenderSeparator = () => (
  <View style={styles.seperator}>
    <Image style={styles.seperatorArrow} source={arrowRight} />
  </View>
);

export default AddTravelScreen;

const styles = StyleSheet.create({
  description: {
    ...Light(15),
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
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 5,
  },
  selectedCountrySection: {
    height: 160,
    backgroundColor: colors.white,
    borderTopColor: '#808080',
    borderTopWidth: 1,
    padding: 10,
  },
  selectedCountryContentContainer: {
    alignItems: 'center',
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
    display: 'flex',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  seperatorArrow: {
    width: 24,
    height: 24,
  },
  nextBtn: {
    marginTop: 10,
    borderRadius: 5,
  },
  nextBtnContent: {
    height: 50,
  },
});
