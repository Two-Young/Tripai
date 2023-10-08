import {StyleSheet} from 'react-native';
import React from 'react';
import Modal from 'react-native-modal';
import {ActivityIndicator} from 'react-native-paper';
import colors from '../../theme/colors';

const LoadingModal = ({isVisible}) => {
  return (
    <Modal isVisible={isVisible}>
      <ActivityIndicator animating size={70} color={'#2D8EFF'} />
    </Modal>
  );
};

export default LoadingModal;
