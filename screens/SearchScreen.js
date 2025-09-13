import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../src/integrations/supabase/client';
import ProductCard from '../src/components/ProductCard';
import { Ionicons } from '@expo/vector-icons';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]); // Новое состояние для предложений
  const [searchHistory, setSearchHistory] = useState([]); // Новое состояние для истории поиска
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Загрузка истории поиска из локального хранилища при монтировании
    const loadSearchHistory = async () => {
      // В реальном приложении здесь будет логика загрузки из AsyncStorage или подобного
      // Для примера, используем заглушку
      setSearchHistory(['Цветы', 'Букеты', 'Розы']);
    };
    loadSearchHistory();
  }, []);
 
  useEffect(() => {
    if (searchQuery.length > 0) {
      const timer = setTimeout(() => {
        fetchSuggestions(); // Вызов функции для получения предложений
      }, 300); // Debounce time for suggestions
      return () => clearTimeout(timer);
    } else {
      setSuggestions([]); // Очистка предложений, если запрос пуст
      setResults([]); // Очистка результатов, если запрос пуст
    }
  }, [searchQuery]);

  const fetchSuggestions = async () => {
    if (searchQuery.length < 2) { // Начинаем предлагать после 2 символов
      setSuggestions([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('name') // Только название для предложений
      .ilike('name', `%${searchQuery}%`)
      .limit(5); // Ограничить количество предложений
    
    if (!error) {
      setSuggestions(data.map(item => item.name));
    }
    setLoading(false);
  };
 
  const performSearch = async (query = searchQuery) => {
    if (query.length < 3) { // Выполняем полный поиск после 3 символов
      setResults([]);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setSuggestions([]); // Очищаем предложения при выполнении полного поиска

    // Добавление запроса в историю поиска
    if (!searchHistory.includes(query)) {
      setSearchHistory(prevHistory => [query, ...prevHistory.slice(0, 4)]); // Сохраняем до 5 последних запросов
      // В реальном приложении здесь будет логика сохранения в локальное хранилище
    }

    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, name_en), product_variants(*)')
      .ilike('name', `%${query}%`);
    
    if (!error) {
      setResults(data);
    }
    setLoading(false);
  };

  const handleSuggestionPress = (suggestion) => {
    setSearchQuery(suggestion);
    performSearch(suggestion);
  };

  const handleHistoryPress = (historyItem) => {
    setSearchQuery(historyItem);
    performSearch(historyItem);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    // В реальном приложении здесь будет логика очистки из локального хранилища
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
          onSubmitEditing={() => performSearch()} // Выполнять поиск по нажатию Enter
        />
      </View>

      {loading ? (
        <ActivityIndicator style={{marginTop: 50}} size="large" color="#FF69B4" />
      ) : (
        <>
          {searchQuery.length > 0 && suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={suggestions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSuggestionPress(item)}>
                    <Ionicons name="search-outline" size={18} color="#666" style={styles.suggestionIcon} />
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {searchQuery.length === 0 && searchHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Недавние запросы</Text>
                <TouchableOpacity onPress={clearSearchHistory}>
                  <Text style={styles.clearHistoryText}>Очистить</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={searchHistory}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.historyItem} onPress={() => handleHistoryPress(item)}>
                    <Ionicons name="time-outline" size={18} color="#666" style={styles.historyIcon} />
                    <Text style={styles.historyText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {searchQuery.length > 0 && results.length > 0 && (
            <FlatList
              data={results}
              renderItem={({ item }) => <ProductCard product={item} navigation={navigation} />}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{justifyContent: 'space-between'}}
              contentContainerStyle={{padding: 20}}
            />
          )}

          {searchQuery.length > 0 && !loading && results.length === 0 && suggestions.length === 0 && (
            <Text style={styles.emptyText}>Ничего не найдено</Text>
          )}

          {searchQuery.length === 0 && searchHistory.length === 0 && !loading && (
            <Text style={styles.emptyText}>Начните вводить, чтобы найти товары.</Text>
          )}
        </>
      )}
    </SafeAreaView>
  );
};
 
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  searchInput: { flex: 1, fontSize: 18, marginLeft: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    maxHeight: 200, // Ограничение высоты для предложений
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderColor: '#f5f5f5',
  },
  suggestionIcon: {
    marginRight: 10,
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  historyContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  clearHistoryText: {
    fontSize: 14,
    color: '#FF69B4',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#f5f5f5',
  },
  historyIcon: {
    marginRight: 10,
  },
  historyText: {
    fontSize: 16,
    color: '#333',
  },
});
 
export default SearchScreen;