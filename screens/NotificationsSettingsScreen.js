import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

const NotificationsSettingsScreen = ({ navigation }) => {
  const [statusUpdates, setStatusUpdates] = useState(true);
  const [promotions, setPromotions] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Уведомления</Text>
        <View style={{width: 24}} />
      </View>
      <View style={styles.content}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Статус заказа</Text>
          <Switch
            value={statusUpdates}
            onValueChange={setStatusUpdates}
            trackColor={{ false: "#767577", true: "#FFC0CB" }}
            thumbColor={statusUpdates ? "#FF69B4" : "#f4f3f4"}
          />
        </View>
        <Text style={styles.settingDescription}>
          Получать уведомления об изменении статуса ваших заказов.
        </Text>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Акции и скидки</Text>
          <Switch
            value={promotions}
            onValueChange={setPromotions}
            trackColor={{ false: "#767577", true: "#FFC0CB" }}
            thumbColor={promotions ? "#FF69B4" : "#f4f3f4"}
          />
        </View>
        <Text style={styles.settingDescription}>
          Получать уведомления о новых акциях и специальных предложениях.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  content: { padding: 20 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 10 },
  settingLabel: { fontSize: 16 },
  settingDescription: { fontSize: 14, color: '#666', marginTop: 5, marginBottom: 20, paddingHorizontal: 15 },
});

export default NotificationsSettingsScreen;