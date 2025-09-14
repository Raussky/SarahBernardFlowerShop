import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import ProductCard from './ProductCard';
import { FONTS } from '../config/theme';

// A versatile component to render different kinds of product lists
const ProductSection = ({
  title,
  products,
  navigation,
  type = 'product', // 'product' or 'combo'
  layout = 'grid', // 'grid' or 'carousel'
}) => {
  
  const renderItem = ({ item }) => {
    if (type === 'combo') {
      return (
        <TouchableOpacity style={styles.comboCard} onPress={() => navigation.navigate('Combo', { comboId: item.id })}>
          <Image source={{ uri: item.image || 'https://placehold.co/600x400' }} style={styles.comboImage} />
          <Text style={styles.comboName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.comboPrice}>₸{item.price.toLocaleString()}</Text>
        </TouchableOpacity>
      );
    }
    return <ProductCard product={item} navigation={navigation} />;
  };

  if (!products || products.length === 0) {
    // Render nothing if there are no products, HomeScreen will show a message
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={item => `${type}-${item.id}`}
        horizontal={layout === 'carousel'}
        numColumns={layout === 'grid' ? 2 : 1}
        scrollEnabled={layout === 'carousel'} // Disable scroll for grids inside ScrollView
        columnWrapperStyle={layout === 'grid' ? styles.productRow : null}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        showsHorizontalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontFamily: FONTS.bold, marginHorizontal: 20, marginBottom: 15 },
  productRow: { justifyContent: 'space-between' },
  // Combo card styles are duplicated from HomeScreen, can be centralized later
  comboCard: { width: 160, backgroundColor: '#fff', borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, overflow: 'hidden' },
  comboImage: { width: '100%', height: 100 },
  comboName: { fontSize: 14, fontWeight: '600', paddingHorizontal: 10, paddingTop: 8 },
  comboPrice: { fontSize: 14, fontWeight: 'bold', color: '#333', paddingHorizontal: 10, paddingBottom: 10, paddingTop: 4 },
});

export default ProductSection;