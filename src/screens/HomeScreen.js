import React, { useState, useEffect } from 'react'; // <-- IMPORTED HOOKS
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Platform,
  StatusBar,
  ActivityIndicator // <-- IMPORTED LOADER
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// --- NEW COLOR THEME ---
const THEME_COLOR = '#F62440'; 
const BG_COLOR = '#FFFAF3';    
const HIGHLIGHT_LIGHT = '#FFF2DB'; 
const HIGHLIGHT_MED = '#FFE5BF';   

// Mock Data for Categories (We keep this mock data for UI structure)
const ICON_CATEGORIES = [
  { id: '1', name: 'Offers', icon: 'brightness-percent', type: 'material' },
  { id: '2', name: 'New', icon: 'restaurant-outline', type: 'ionicon' },
  { id: '3', name: 'Pick up', icon: 'shopping-outline', type: 'material' },
  { id: '4', name: 'Vouchers', icon: 'ticket-percent-outline', type: 'material' },
];

const FOOD_CATEGORIES = [
  { id: '1', name: 'Biriyani', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXyfFBu0oxFPvZ2YDSpBrMov7w-VPlUgp6IkTl3Ux9rg&s=10' },
  { id: '2', name: 'Burgers', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=150&q=80' },
  { id: '3', name: 'Chicken', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=150&q=80' },
  { id: '4', name: 'Fried Rice', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRvp9Ftc2REe6QuXV6sl7Bk2rk9SrwJMXmCgO_QMwJa4A&s=10' },
  { id: '5', name: 'Sadhya', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYdvwpPD4_xsbtUy3ZlOWm3v9uRlC8jvdHtGWTyVym7ZHFXi8uuMBzLK5b&s=10' },
];

export default function HomeScreen() {
  const navigation = useNavigation();
  
  // --- NEW: STATE FOR BACKEND DATA ---
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If you eventually host this live, it will look like 'https://your-api.onrender.com/api/restaurants'
    const API_URL = 'http://192.168.0.102:5000/api/restaurants'; 

    const fetchRestaurants = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setRestaurants(data);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError("Failed to load restaurants.");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const renderIcon = (item) => {
    if (item.type === 'material') {
      return <MaterialCommunityIcons name={item.icon} size={24} color={THEME_COLOR} />;
    }
    return <Ionicons name={item.icon} size={24} color={THEME_COLOR} />;
  };

  return (
    <View style={styles.root}>
      {/* Static Colored Header Background */}
      <View style={styles.headerBackground}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            
            {/* Location Row */}
            <View style={styles.locationRow}>
              <View>
                <Text style={styles.locationCity}>Dhaka</Text>
                <Text style={styles.locationArea}>Dhaka</Text>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="heart-outline" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="notifications-outline" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput}
                placeholder="Search for restaurants and groceries"
                placeholderTextColor="#888"
              />
            </View>

            {/* Promo Banner Area */}
            <View style={styles.promoContainer}>
              <View style={styles.promoTextContainer}>
                <Text style={styles.promoSub}>First order?</Text>
                <Text style={styles.promoTitle}>Here's 40% off &{'\n'}free delivery!</Text>
              </View>
              <View style={styles.giftIconContainer}>
                <Ionicons name="gift" size={44} color={THEME_COLOR} />
              </View>
            </View>

          </View>
        </SafeAreaView>
      </View>

      {/* Overlapping Body with Cream Background */}
      <View style={styles.bodyContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Icon Categories Row */}
          <View style={styles.iconCategoryRow}>
            {ICON_CATEGORIES.map((item) => (
              <TouchableOpacity key={item.id} style={styles.iconCategoryItem}>
                <View style={styles.iconWrapper}>
                  {renderIcon(item)}
                </View>
                <Text style={styles.iconCategoryText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Food Thumbnail Categories Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foodCategoryScroll}>
            {FOOD_CATEGORIES.map((item) => (
              <TouchableOpacity key={item.id} style={styles.foodCategoryItem}>
                <Image source={{ uri: item.image }} style={styles.foodCategoryImg} />
                <Text style={styles.foodCategoryText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Explore Restaurants (DYNAMIC DATA) */}
          <View style={styles.exploreSection}>
            <Text style={styles.exploreTitle}>Explore restaurants</Text>
            
            {loading ? (
              <ActivityIndicator size="large" color={THEME_COLOR} style={{ marginTop: 20 }} />
            ) : error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : restaurants.length === 0 ? (
              <Text style={styles.errorText}>No restaurants found.</Text>
            ) : (
              restaurants.map((restaurant) => (
                <TouchableOpacity 
                  key={restaurant._id || restaurant.id} // Supports MongoDB _id
                  style={styles.restaurantCard}
                  onPress={() => navigation.navigate('Restaurant', { restaurantId: restaurant._id || restaurant.id })} 
                >
                  
                  <Image source={{ uri: restaurant.image }} style={styles.restaurantImage} />
                  <TouchableOpacity style={styles.favoriteBtn}>
                    <Ionicons name="heart-outline" size={20} color="#FFF" />
                  </TouchableOpacity>

                  <View style={styles.restaurantInfo}>
                    <View style={styles.restaurantHeader}>
                      <Text style={styles.restaurantName}>{restaurant.name}</Text>
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color={THEME_COLOR} />
                        <Text style={styles.ratingText}>{restaurant.rating} <Text style={styles.reviewText}>{restaurant.reviews || ''}</Text></Text>
                      </View>
                    </View>
                    
                    <Text style={styles.restaurantTags}>{restaurant.tags}</Text>
                    
                    <View style={styles.deliveryRow}>
                      <MaterialCommunityIcons name="bike" size={16} color={THEME_COLOR} />
                      <Text style={styles.deliveryText}>{restaurant.delivery}</Text>
                    </View>

                    {/* Promo Tags - Only map if promos exist in DB */}
                    {restaurant.promos && restaurant.promos.length > 0 && (
                      <View style={styles.promoTagsRow}>
                        {restaurant.promos.map((promo, index) => (
                          <View key={index} style={styles.promoTag}>
                            <MaterialCommunityIcons name="brightness-percent" size={12} color={THEME_COLOR} />
                            <Text style={styles.promoTagText}>{promo}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME_COLOR },
  headerBackground: { backgroundColor: THEME_COLOR, paddingBottom: 40 },
  headerContent: { paddingHorizontal: 20 },
  locationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  locationCity: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  locationArea: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  headerIcons: { flexDirection: 'row', gap: 15 },
  iconBtn: { padding: 4 },
  searchContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', marginBottom: 25 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#333' },
  promoContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  promoTextContainer: { flex: 1 },
  promoSub: { fontSize: 14, color: '#FFF', marginBottom: 4 },
  promoTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', lineHeight: 28 },
  giftIconContainer: { width: 70, height: 70, backgroundColor: HIGHLIGHT_LIGHT, borderRadius: 35, justifyContent: 'center', alignItems: 'center' },
  bodyContainer: { flex: 1, backgroundColor: BG_COLOR, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, overflow: 'hidden' },
  scrollContent: { paddingTop: 30, paddingBottom: 40 },
  iconCategoryRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10, marginBottom: 25 },
  iconCategoryItem: { alignItems: 'center' },
  iconWrapper: { width: 50, height: 50, backgroundColor: HIGHLIGHT_LIGHT, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  iconCategoryText: { fontSize: 12, fontWeight: '600', color: '#333' },
  foodCategoryScroll: { paddingLeft: 20, marginBottom: 30 },
  foodCategoryItem: { alignItems: 'center', marginRight: 20 },
  foodCategoryImg: { width: 60, height: 60, borderRadius: 12, marginBottom: 8 },
  foodCategoryText: { fontSize: 12, color: '#555', fontWeight: '500' },
  exploreSection: { paddingHorizontal: 20 },
  exploreTitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 15 },
  errorText: { textAlign: 'center', color: '#888', marginTop: 20 },
  restaurantCard: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  restaurantImage: { width: '100%', height: 160 },
  favoriteBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, padding: 6 },
  restaurantInfo: { padding: 15 },
  restaurantHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  restaurantName: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: 'bold', color: '#333' },
  reviewText: { color: '#888', fontWeight: 'normal' },
  restaurantTags: { fontSize: 12, color: '#666', marginBottom: 10 },
  deliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  deliveryText: { fontSize: 12, color: THEME_COLOR, fontWeight: '600' },
  promoTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  promoTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: HIGHLIGHT_MED, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, gap: 4 },
  promoTagText: { fontSize: 10, color: THEME_COLOR, fontWeight: '700' },
});