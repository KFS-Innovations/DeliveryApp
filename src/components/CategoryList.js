import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, CATEGORIES, CATEGORY_ITEM_WIDTH } from '../components/theme';

export default function CategoryList({ selectedCategory, onSelectCategory }) {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={styles.categoryScroll}
      pagingEnabled={true}
      decelerationRate="fast"
      snapToAlignment="start"
    >
      {CATEGORIES.map((cat) => {
        const isActive = selectedCategory === cat.name;
        
        return (
          <TouchableOpacity 
            key={cat.id} 
            style={styles.categoryItem}
            onPress={() => onSelectCategory(cat.name)} // Update the state in HomeScreen
            activeOpacity={0.8}
          >
            <View style={[
              styles.categorySquircle,
              { backgroundColor: isActive ? COLORS.catActiveBg : COLORS.catInactiveBg }
            ]}>
              <Text style={styles.categoryEmoji}>{cat.icon}</Text>
            </View>
            <Text style={[
              styles.categoryName,
              { color: isActive ? COLORS.catActiveBg : COLORS.textDark }
            ]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoryScroll: { marginBottom: 30, overflow: 'visible' },
  categoryItem: { width: CATEGORY_ITEM_WIDTH, alignItems: 'center', justifyContent: 'center' },
  categorySquircle: { width: 60, height: 60, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 1 },
  categoryEmoji: { fontSize: 28 },
  categoryName: { fontSize: 13, fontWeight: '700' },
});