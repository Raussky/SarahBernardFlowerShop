import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';

const { width } = Dimensions.get('window');
const BUTTON_MARGIN = 8;
const CONTAINER_PADDING = 20;
const NUM_COLUMNS = 3;
const BUTTON_WIDTH = (width - CONTAINER_PADDING * 2 - BUTTON_MARGIN * (NUM_COLUMNS - 1) * 2) / NUM_COLUMNS;

const generateTimeSlots = (intervalMinutes = 30) => {
  const slots = [];
  for (let hour = 9; hour < 22; hour++) { // From 9 AM to 9 PM
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const TimePickerModal = ({ isVisible, onClose, onSelectTime }) => {
  const timeSlots = generateTimeSlots();
  const insets = useSafeAreaInsets();

  const renderTimeSlot = ({ item }) => (
    <TouchableOpacity
      style={styles.timeSlotButton}
      onPress={() => onSelectTime(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.timeSlotText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { paddingBottom: Math.max(insets.bottom + 30, 30) }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Выберите время доставки</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={timeSlots}
            renderItem={renderTimeSlot}
            keyExtractor={(item) => item}
            numColumns={NUM_COLUMNS}
            contentContainerStyle={styles.timeSlotsContainer}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};
 
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: CONTAINER_PADDING,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  timeSlotsContainer: {
    paddingBottom: 10,
  },
  timeSlotButton: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    margin: BUTTON_MARGIN,
    width: BUTTON_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
});

export default TimePickerModal;