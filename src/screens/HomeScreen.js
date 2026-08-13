import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

// Mock Data matching the UI
const CATEGORIES = [
  { id: '1', name: 'Steak', emoji: '🥩' },
  { id: '2', name: 'Desserts', emoji: '🍰' },
  { id: '3', name: 'Breakfast', emoji: '🍳' },
  { id: '4', name: 'Fast Food', emoji: '🍔' },
  { id: '5', name: 'Sea Food', emoji: '🍣' },
];

const RESTAURANTS = [
  { 
    id: '1', 
    name: 'H & H Bagels', 
    rating: '4.8', 
    reviews: '1,299+', 
    image: 'https://images.unsplash.com/photo-1585325701165-351af916e581?auto=format&fit=crop&w=500&q=60' 
  },
  { 
    id: '2', 
    name: 'Nara Sushi', 
    rating: '4.9', 
    reviews: '850+', 
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=500&q=60' 
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconCircle}>
            <Ionicons name="menu" size={24} color="#000" />
          </TouchableOpacity>
          
          <View style={styles.locationContainer}>
            <Text style={styles.locationLabel}>Location</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color="#FF3B30" />
              <Text style={styles.locationText}>172 Grand St, NY</Text>
              <Ionicons name="chevron-down" size={16} color="#000" />
            </View>
          </View>
          
          <TouchableOpacity style={styles.iconCircle}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Address Alert Banner */}
        <View style={styles.alertBanner}>
          <View style={styles.alertIconBg}>
             <MaterialCommunityIcons name="map-marker-question-outline" size={20} color="#007AFF" />
          </View>
          <Text style={styles.alertText}>Is this the right address? It looks a little far from you.</Text>
          <TouchableOpacity>
            <Ionicons name="close-circle" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search Food, groceries, drink, etc." 
            placeholderTextColor="#888"
          />
          <TouchableOpacity>
            <Ionicons name="options-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Categories (Horizontal) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
          {CATEGORIES.map((item) => (
            <View key={item.id} style={styles.categoryItem}>
              <View style={styles.categoryIconCircle}>
                <Text style={styles.emojiText}>{item.emoji}</Text>
              </View>
              <Text style={styles.categoryName}>{item.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>20% off Levain</Text>
            <Text style={styles.promoSub}>When you order $20+ Automatically applied.</Text>
            <TouchableOpacity style={styles.promoButton}>
              <Text style={styles.promoButtonText}>Order now</Text>
            </TouchableOpacity>
          </View>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=300&q=60' }} 
            style={styles.promoImage} 
          />
        </View>

        {/* Popular Restaurants Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Lokal Restaurants</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.restaurantScroll}>
          {RESTAURANTS.map((restaurant) => (
            <TouchableOpacity key={restaurant.id} style={styles.restaurantCard}>
              <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
              <View style={styles.restaurantInfo}>
                <Text style={styles.restaurantName}>{restaurant.name}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color="#FFB800" />
                  <Text style={styles.ratingText}>
                    {restaurant.rating} <Text style={styles.reviewText}>({restaurant.reviews} ratings)</Text>
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContainer: {
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF', // Light blue-ish background
    marginHorizontal: 20,
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  alertIconBg: {
    backgroundColor: '#E0F0FF',
    padding: 6,
    borderRadius: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  categoriesContainer: {
    paddingLeft: 20,
    marginTop: 25,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emojiText: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  promoBanner: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoContent: {
    flex: 1,
    paddingRight: 15,
  },
  promoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 6,
  },
  promoSub: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
    lineHeight: 18,
  },
  promoButton: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  promoImage: {
    width: 90,
    height: 90,
    borderRadius: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  seeAllText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  restaurantScroll: {
    paddingLeft: 20,
    paddingBottom: 40,
  },
  restaurantCard: {
    width: 260,
    marginRight: 15,
  },
  restaurantImage: {
    width: '100%',
    height: 150,
    borderRadius: 16,
    marginBottom: 10,
  },
  restaurantInfo: {
    paddingHorizontal: 4,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
  },
  reviewText: {
    fontWeight: '400',
    color: '#888',
  },
});