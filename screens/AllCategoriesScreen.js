import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/integrations/supabase/client';
import SkeletonLoader from '../src/components/SkeletonLoader';
import AnimatedListItem from '../src/components/AnimatedListItem';
import { logger } from '../src/utils/logger';

const AllCategoriesScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const layoutConfig = useMemo(() => {
    const isLargePhone = width >= 414;
    const columns = 2;
    const gutter = isLargePhone ? 18 : 14;
    const rowSpacing = isLargePhone ? 4 : 2;
    const maxCardWidth = isLargePhone ? 180 : 160;
    const safeWidth = Math.max(width, 320);
    const maxContentWidth = Math.min(safeWidth - 32, 420);
    const totalGutter = Math.max(columns - 1, 0) * gutter;
    const cardWidth = Math.min(maxCardWidth, (maxContentWidth - totalGutter) / columns);
    const gridWidth = cardWidth * columns + totalGutter;
    const iconSize = Math.min(90, Math.max(60, cardWidth * 0.5));

    return {
      columns,
      gutter,
      rowSpacing,
      cardWidth,
      gridWidth,
      iconSize,
    };
  }, [width]);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setCategories(data);
    } catch (error) {
      logger.error('Error fetching all categories', error, { context: 'AllCategoriesScreen' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const columnWrapperDynamicStyle = useMemo(
    () => ({
      width: layoutConfig.gridWidth,
      alignSelf: 'center',
      justifyContent:
        categories.length >= layoutConfig.columns ? 'space-between' : 'center',
    }),
    [layoutConfig, categories.length]
  );

  const listContentDynamicStyle = useMemo(
    () => ({
      alignItems: 'center',
      paddingVertical: layoutConfig.rowSpacing / 2,
    }),
    [layoutConfig]
  );

  const renderCategoryItem = ({ item, index }) => {
    const handlePress = () => {
      // Special navigation for the "Combos" category
      if (item.name === 'Комбо' || item.name === 'Выгодные комбо') {
        navigation.navigate('AllCombos');
      } else {
        navigation.navigate('Category', { category: item });
      }
    };

    const categoryItemStyle = [
      styles.categoryItem,
      {
        width: layoutConfig.cardWidth,
        marginBottom: layoutConfig.rowSpacing,
      },
    ];
    const categoryIconStyle = [
      styles.categoryIcon,
      {
        width: layoutConfig.iconSize,
        height: layoutConfig.iconSize,
        borderRadius: layoutConfig.iconSize / 2,
      },
    ];
    const categoryImageStyle = [
      styles.categoryImage,
      {
        width: layoutConfig.iconSize,
        height: layoutConfig.iconSize,
        borderRadius: layoutConfig.iconSize / 2,
      },
    ];

    return (
      <AnimatedListItem index={index}>
        <TouchableOpacity
          style={categoryItemStyle}
          onPress={handlePress}
        >
          <View style={categoryIconStyle}>
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                placeholder={{ uri: 'https://via.placeholder.com/120' }}
                style={categoryImageStyle}
                transition={300}
              />
            ) : (
              <Text style={styles.categoryEmoji}>{item.icon || '💐'}</Text>
            )}
          </View>
          <Text style={styles.categoryName}>{item.name}</Text>
        </TouchableOpacity>
      </AnimatedListItem>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <SkeletonLoader width={70} height={70} borderRadius={35} style={{ marginBottom: 8 }} />
          <View style={{ width: 24 }} />
        </View>
        <FlatList
          data={Array.from({ length: layoutConfig.columns * 3 })}
          renderItem={() => (
            <View
              style={[
                styles.categoryItemSkeleton,
                {
                  width: layoutConfig.cardWidth,
                  marginBottom: layoutConfig.rowSpacing,
                },
              ]}
            >
              <SkeletonLoader
                width={layoutConfig.iconSize}
                height={layoutConfig.iconSize}
                borderRadius={layoutConfig.iconSize / 2}
                style={{ marginBottom: 8 }}
              />
              <SkeletonLoader width={layoutConfig.cardWidth * 0.6} height={12} borderRadius={4} />
            </View>
          )}
          keyExtractor={(_, index) => `skeleton-${index}`}
          numColumns={layoutConfig.columns}
          columnWrapperStyle={[
            styles.categoryRow,
            {
              width: layoutConfig.gridWidth,
              alignSelf: 'center',
              justifyContent: 'space-between',
            },
          ]}
          contentContainerStyle={[
            styles.listContent,
            {
              alignItems: 'center',
              paddingVertical: layoutConfig.rowSpacing / 2,
            },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Все категории</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id.toString()}
        numColumns={layoutConfig.columns}
        columnWrapperStyle={[styles.categoryRow, columnWrapperDynamicStyle]}
        contentContainerStyle={[
          styles.listContent,
          listContentDynamicStyle,
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={80} color="#999" />
            <Text style={styles.emptyText}>Категории не найдены.</Text>
          </View>
        }
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: { 
    paddingVertical: 10,
  },
  categoryRow: {
    paddingVertical: 6,
  },
  categoryItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  categoryIcon: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryImage: {
    resizeMode: 'cover',
  },
  categoryEmoji: {
    fontSize: 35,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: '100%',
  },
  categoryItemSkeleton: {
    alignItems: 'center',
    paddingVertical: 15,
    minHeight: 125,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
  },
});

export default AllCategoriesScreen;
