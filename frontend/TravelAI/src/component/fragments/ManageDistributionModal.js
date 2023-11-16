import {Text, View} from 'react-native';
import React from 'react';
import {STYLES} from '../../styles/Stylesheets';
import Modal from 'react-native-modal';
import {FlatList} from 'react-native';
import {Searchbar} from 'react-native-paper';
import {expenditureStyles as styles} from '../../screens/AddExpenditureScreen';
import Checkbox from '../atoms/Checkbox';

const ManageDistributionModal = ({data}) => {
  const {isVisible, setIsVisible, distribution, setDistribution, members} = data;

  const [search, setSearch] = React.useState('');

  const filteredMembers = React.useMemo(() => {
    return members.filter(el => el.username.includes(search));
  }, [members, search]);

  const allChecked = React.useMemo(() => {
    return members.length === distribution.length;
  }, [data]);

  const onPressAllChecked = React.useCallback(() => {
    if (allChecked) {
      setDistribution([]);
    } else {
      setDistribution(
        members.map(el => ({
          user_id: el.user_id,
          amount: {
            num: 0,
            denom: 0,
            string: '',
          },
        })),
      );
    }
  }, [data]);

  React.useEffect(() => {
    if (!isVisible) {
      setSearch('');
    }
  }, [isVisible]);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={() => {
        setIsVisible(false);
      }}>
      <View style={[styles.modal]}>
        <Text style={styles.modalTitle}>Manage Distribution Members</Text>
        <Searchbar value={search} onChangeText={setSearch} placeholder="Search" />
        {members.length > 0 && (
          <View
            style={[
              STYLES.FLEX_ROW_ALIGN_CENTER,
              {justifyContent: 'flex-end'},
              STYLES.PADDING_VERTICAL(5),
              STYLES.MARGIN_TOP(10),
            ]}>
            <Text style={[STYLES.MARGIN_RIGHT(5), styles.modalText]}>Include All</Text>
            <Checkbox checked={allChecked} onPressCheckbox={onPressAllChecked} />
          </View>
        )}
        <FlatList
          data={filteredMembers}
          keyExtractor={item => item.user_id}
          style={STYLES.MARGIN_TOP(10)}
          renderItem={({item}) => (
            <View style={[STYLES.FLEX_ROW, STYLES.SPACE_BETWEEN, STYLES.PADDING_VERTICAL(5)]}>
              <Text style={styles.modalText}>{item.username}</Text>
              <Checkbox
                checked={distribution.map(el => el.user_id).includes(item.user_id)}
                onPressCheckbox={() => {
                  const newData = [...distribution];
                  if (distribution.map(el => el.user_id).includes(item.user_id)) {
                    const index = newData.findIndex(el => el.user_id === item.user_id);
                    if (index !== -1) {
                      newData.splice(index, 1);
                      setDistribution(newData);
                    }
                  } else {
                    newData.push({
                      user_id: item.user_id,
                      amount: {
                        num: 0,
                        denom: 0,
                        string: '',
                      },
                    });
                    setDistribution(newData);
                  }
                }}
              />
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

export default ManageDistributionModal;
