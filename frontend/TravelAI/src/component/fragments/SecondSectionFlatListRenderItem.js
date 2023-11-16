import {Text, View} from 'react-native';
import React from 'react';
import {expenditureStyles as styles} from '../../screens/AddExpenditureScreen';
import {STYLES} from '../../styles/Stylesheets';
import Checkbox from '../atoms/Checkbox';

const SecondSectionFlatListRenderItem = ({data}) => {
  const {selectedUser, item, detail, setDetail} = data;

  const checked = React.useMemo(() => {
    return item.allocations.includes(selectedUser);
  }, [data]);

  const onChecked = () => {
    if (checked) {
      const newData = [...detail];
      const index = newData.findIndex(el => el.id === item.id);
      if (index !== -1) {
        const participantIndex = newData[index].allocations.findIndex(el => el === selectedUser);
        if (participantIndex !== -1) {
          newData[index].allocations.splice(participantIndex, 1);
          setDetail(newData);
        }
      }
    } else {
      const newData = [...detail];
      const index = newData.findIndex(el => el.id === item.id);
      if (index !== -1) {
        newData[index].allocations.push(selectedUser);
        setDetail(newData);
      }
    }
  };

  return (
    <View style={[STYLES.FLEX_ROW, STYLES.SPACE_BETWEEN, STYLES.PADDING_VERTICAL(5)]}>
      <Text
        style={[
          styles.bottomSheetText,
          styles.individualText,
          {
            color: '#B5CAE8',
          },
        ]}>
        {item.label}
      </Text>
      <View style={[STYLES.FLEX_ROW_ALIGN_CENTER]}>
        <Text style={[styles.bottomSheetText, styles.individualText, STYLES.MARGIN_RIGHT(10)]}>
          {item.price}
        </Text>
        <Checkbox checked={checked} onPressCheckbox={onChecked} mode={'white'} />
      </View>
    </View>
  );
};

export default SecondSectionFlatListRenderItem;
