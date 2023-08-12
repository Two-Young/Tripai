import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
  ScrollView,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import Header from '../component/atoms/Header';
import {SearchBar, ListItem, Button} from '@rneui/themed';
import {useNavigation} from '@react-navigation/native';
import defaultStyle from '../styles/styles';
import {locateCountries} from '../services/api';
import {useRecoilState} from 'recoil';
import countriesAtom from '../recoil/countries/countries';

const AddTravelScreen = () => {
  // state
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
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
  useEffect(() => {
    if (countries === null) {
      getCountries();
    }
  }, [countries]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={styles.container}>
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <Header />
        <View style={styles.container}>
          <Text>Choose all the countries you want to add to your trip</Text>
          <SearchBar placeholder="Search the country" value={search} onChangeText={setSearch} />
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
            <SelectedCountryCard
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
  const isSelected = React.useMemo(() => selected.includes(item.country_code), [selected, item]);
  return (
    <ListItem bottomDivider chevron>
      <MemoizedFlags item={item} />
      <MemoizedCountry item={item} />
      <ListItem.CheckBox
        checked={isSelected}
        onPress={() => {
          if (isSelected) {
            setSelected(selected.filter(code => code !== item.country_code));
          } else {
            setSelected([...selected, item.country_code]);
          }
        }}
      />
    </ListItem>
  );
};

const MemoizedCountry = React.memo(function MemoizedCountry({item}) {
  return (
    <ListItem.Content>
      <ListItem.Title>{item.common_name}</ListItem.Title>
    </ListItem.Content>
  );
});

const MemoizedFlags = React.memo(function MemoizedFlags({item}) {
  return <Image style={styles.flag} source={{uri: item?.png}} />;
});

const SelectedCountryCard = ({countries, selected, setSelected, onPress}) => {
  return (
    <View style={styles.countryCard}>
      <Text>{`Selected Countries : ${selected.length}`}</Text>
      <ScrollView showsHorizontalScrollIndicator={false} horizontal style={{paddingVertical: 5}}>
        {selected.map(code => {
          const country = countries.find(country => country.country_code === code);
          return (
            <Image
              key={code}
              style={[styles.flag, {marginHorizontal: 5}]}
              source={{uri: country?.png}}
            />
          );
        })}
      </ScrollView>
      <Button
        title="Next"
        onPress={onPress}
        buttonStyle={defaultStyle.button}
        titleStyle={defaultStyle.buttonContent}
      />
    </View>
  );
};

export default AddTravelScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flag: {
    width: 45,
    height: 30,
    objectFit: 'contain',
    borderWidth: 1,
    borderColor: '#808080',
    borderRadius: 5,
  },
  countryCard: {
    borderTopWidth: 1,
    borderTopColor: '#808080',
    backgroundColor: '#fff',
    padding: 12,
  },
});
