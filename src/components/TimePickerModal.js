import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../config/theme';

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

  const renderTimeSlot = ({ item }) => (
    <TouchableOpacity style={styles.timeSlotButton} onPress={() => onSelectTime(item)}>
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
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Выберите время доставки</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={timeSlots}
            renderItem={renderTimeSlot}
            keyExtractor={(item) => item}
            numColumns={3}
            contentContainerStyle={styles.timeSlotsContainer}
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
    padding: 20,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  timeSlotsContainer: {
    justifyContent: 'space-between',
  },
  timeSlotButton: {
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 5,
    flex: 1,
    alignItems: 'center',
  },
  timeSlotText: {
    fontSize: 16,
    color: colors.text,
  },
});

export default TimePickerModal;