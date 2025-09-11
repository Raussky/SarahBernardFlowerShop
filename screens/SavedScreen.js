import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../App';

const { width } = Dimensions.get('window');

const SavedScreen = ({ navigation }) => {
  const { saved, toggleSaved, addToCart } = useContext(CartContext);
  const [activeTab, setActiveTab] = React.useState('All');

  const tabs = ['All', 'Bouquets', 'Flowers', 'Indoor'];

  const renderSavedItem = ({ item }) => (
    <View style={styles.savedItem}>
      <Image source={{ uri: item.image || 'https://via.placeholder.com/200/FFB6C1/FFFFFF?text=Flower' }} style={styles.itemImage} />
      <TouchableOpacity 
        style={styles.heartIcon}
        onPress={() => toggleSaved(item)}
      >
        <Ionicons name="heart" size={20} color="#FF69B4" />
      </TouchableOpacity>
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemCategory}>{item.description || '2018 - White'}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.itemPrice}>₸{item.price?.toLocaleString() || '145.99'}</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => {
              addToCart(item);
              alert('Добавлено в корзину');
            }}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Demo saved items if empty
  const demoItems = [
    {
      id: 101,
      name: 'Red Velvet Bouquet',
      price: 19500,
      description: "Men's Fashion",
      image: 'https://via.placeholder.com/200/FF69B4/FFFFFF?text=Velvet'
    },
    {
      id: 102,
      name: 'Red & White Royal B...',
      price: 14599,
      description: '2018 - White',
      image: 'https://via.placeholder.com/200/FFB6C1/FFFFFF?text=Royal'
    },
    {
      id: 103,
      name: 'Red Velvet Bouquet',
      price: 19500,
      description: "Men's Fashion",
      image: 'https://via.placeholder.com/200/FF69B4/FFFFFF?text=Velvet'
    },
    {
      id: 104,
      name: 'Red & White Royal B...',
      price: 14599,
      description: '2018 - White',
      image: 'https://via.placeholder.com/200/FFB6C1/FFFFFF?text=Royal'
    },
  ];

  const displayItems = saved.length > 0 ? saved : demoItems;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved</Text>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Saved Items Grid */}
      <FlatList
        data={displayItems}
        renderItem={renderSavedItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
    maxHeight: 50,
  },
  tab: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  activeTab: {
    backgroundColor: '#FF69B4',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  savedItem: {
    width: (width - 50) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  itemImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  heartIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 3,
  },
  itemCategory: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#1e3a8a',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SavedScreen;
