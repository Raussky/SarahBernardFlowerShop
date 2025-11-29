import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from './PrimaryButton';
import { FONTS } from '../config/theme';

const VariantSelectorModal = ({ isVisible, onClose, product, onAddToCart }) => {
  const insets = useSafeAreaInsets();
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (product && product.product_variants && product.product_variants.length > 0) {
      return product.product_variants[0];
    }
    return null;
  });

  if (!product || !product.product_variants) {
    return null;
  }

  const handleAddToCart = () => {
    if (selectedVariant) {
      const item = {
        id: product.id,
        name: product.name,
        nameRu: product.name_ru,
        image: product.image,
        size: selectedVariant.size,
        price: selectedVariant.price,
        variantId: selectedVariant.id,
        stock_quantity: selectedVariant.stock_quantity,
      };
      onAddToCart(item);
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPressOut={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Выберите вариант</Text>
              <Text style={styles.productName}>{product.name || product.name_ru}</Text>
            </View>
          </View>

          <FlatList
            data={product.product_variants}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.variantButton,
                  selectedVariant?.id === item.id && styles.selectedVariant,
                  item.stock_quantity <= 0 && styles.disabledVariant,
                ]}
                onPress={() => setSelectedVariant(item)}
                disabled={item.stock_quantity <= 0}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.variantText,
                  selectedVariant?.id === item.id && styles.selectedVariantText
                ]}>
                  {item.size} - ₸{item.price.toLocaleString()}
                </Text>
                {item.stock_quantity <= 0 && <Text style={styles.outOfStockText}>Нет в наличии</Text>}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.variantListContent}
            showsVerticalScrollIndicator={false}
            style={styles.variantList}
          />

          <View style={[styles.modalFooter, { paddingBottom: Math.max(insets.bottom + 30, 30) }]}>
            <PrimaryButton
              title="Добавить в корзину"
              onPress={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock_quantity <= 0}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 5,
  },
  productName: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#666',
  },
  variantList: {
    maxHeight: '100%',
  },
  variantListContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  variantButton: {
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedVariant: {
    borderColor: '#FF69B4',
    backgroundColor: '#FFE4E1',
  },
  disabledVariant: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  variantText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
  },
  selectedVariantText: {
    color: '#FF69B4',
  },
  outOfStockText: {
    fontSize: 12,
    color: '#D32F2F',
    fontFamily: FONTS.regular,
  },
});

export default VariantSelectorModal;