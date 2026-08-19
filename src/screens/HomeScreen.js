import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CATEGORY_ITEM_WIDTH = (width - 30) / 4; 

// --- THEME COLORS ---
const COLORS = {
  primary: '#22C55E',      
  backgroundEnd: '#FDFDFD',   
  surface: '#F8FAFC',      
  textDark: '#111827',     
  textMuted: '#6B7280',    
  cardBg: '#FFFFFF',
  badgeBg: '#FFFFFF',
  heartIcon: '#F3705A',    
  heartBg: '#FFF0ED',      
  starGold: '#FFC107',
  deliveryPromo: '#E3825E', 
  priceBg: '#000000',      
  catActiveBg: '#FF5722',   
  catInactiveBg: '#111827', 
};

// --- STATIC CATEGORIES ---
const CATEGORIES = [
  { id: '1', name: 'Veg', icon: '🥬' },
  { id: '2', name: 'Dairy', icon: '🥛' },
  { id: '3', name: 'Fruits', icon: '🍎' },
  { id: '4', name: 'Coconuts', icon: '🥥' },
  { id: '5', name: 'Spices', icon: '🌶️' },
  { id: '6', name: 'Bread', icon: '🍞' },
  { id: '7', name: 'Drinks', icon: '🧃' },
  { id: '8', name: 'More', icon: '📦' },
];

export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState('1');
  
  // NEW: State for backend data
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // NEW: Fetch data from MongoDB via Node.js
  useEffect(() => {
    const API_URL = 'http://192.168.0.102:5000/api/products'; 

    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data: ", error);
        setIsLoading(false);
      });
  }, []);

  return (
    <LinearGradient 
      colors={['#E6F9EC', COLORS.backgroundEnd]} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#E6F9EC" />
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }} 
                style={styles.profilePic} 
              />
              <View style={styles.addressContainer}>
                <Text style={styles.deliverToText}>Deliver to</Text>
                <TouchableOpacity style={styles.addressSelector}>
                  <Text style={styles.addressText}>Times Square</Text>
                  <Ionicons name="caret-down" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconCircle}>
                <Feather name="bell" size={20} color={COLORS.textDark} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle}>
                <Feather name="shopping-bag" size={20} color={COLORS.textDark} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="What are you craving?"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Top Dark Banner Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Special Offers</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.bannerContainer}>
            <LinearGradient
              colors={['#1F2937', '#0F172A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.darkBannerGradient}
            >
              <View style={styles.darkBannerLeft}>
                <Text style={styles.uptoText}>EXCLUSIVE</Text>
                <View style={styles.discountRow}>
                  <Text style={styles.discountValue}>30%</Text>
                  <Text style={styles.discountOff}> OFF</Text>
                </View>
                <Text style={styles.promoDesc}>Valid only for today!</Text>
                <TouchableOpacity style={styles.orderNowBtn}>
                  <Text style={styles.orderNowText}>Order Now</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.darkBannerRight}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=400&q=80' }} 
                  style={styles.darkBannerImage} 
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* EXACT 4-ITEM CATEGORY SCROLL */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.categoryScroll}
            pagingEnabled={true}
            decelerationRate="fast"
            snapToAlignment="start"
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  style={styles.categoryItem}
                  onPress={() => setActiveCategory(cat.id)}
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

          {/* 2-Column Recommended Grid (Dynamically Fetched) */}
          <View style={[styles.sectionHeader, { marginTop: 10 }]}>
            <Text style={[styles.sectionTitle, { fontSize: 20 }]}>Recommended for you</Text>
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.recommendedGrid}>
              {products.map((item) => (
                <TouchableOpacity key={item._id} style={styles.gridCard}>
                  
                  <View style={styles.imageContainer}>
                    {/* Maps to your MongoDB 'image' field */}
                    <Image source={{ uri: item.image }} style={styles.gridImage} />
                    
                    <TouchableOpacity style={styles.heartBadge}>
                      <Ionicons name="heart-outline" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>

                    <View style={styles.timeBadge}>
                      <Feather name="clock" size={10} color={COLORS.textDark} style={{ marginRight: 4 }} />
                      <Text style={styles.timeText}>15 min</Text>
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    
                    {/* Maps to your MongoDB 'name' field */}
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    
                    <View style={styles.shopRatingRow}>
                      <View style={styles.shopInfo}>
                        <Ionicons name="storefront-outline" size={12} color={COLORS.heartIcon} style={{ marginRight: 2 }} />
                        {/* Assuming tags hold the shop name or details for now */}
                        <Text style={styles.shopName} numberOfLines={1}>{item.tags || "Local Market"}</Text>
                      </View>
                      <View style={styles.ratingInfo}>
                        {/* Maps to your MongoDB 'rating' field */}
                        <Text style={styles.ratingScore}>{item.rating || "4.5"}</Text>
                        <Ionicons name="star" size={10} color={COLORS.starGold} style={{ marginHorizontal: 2 }} />
                      </View>
                    </View>

                    <View style={styles.deliveryPriceRow}>
                      <View style={styles.pricePill}>
                        {/* If price isn't in your schema yet, add it to MongoDB or use a default */}
                        <Text style={styles.priceText}>{item.price || "$4.99"}</Text>
                      </View>
                    </View>

                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

        </ScrollView>
      </SafeAreaView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color={COLORS.primary} />
          <Text style={[styles.navText, { color: COLORS.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="file-text" size={24} color={COLORS.textMuted} />
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="message-circle" size={24} color={COLORS.textMuted} />
          <Text style={styles.navText}>Offers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="user" size={24} color={COLORS.textMuted} />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 25 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  profilePic: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  addressContainer: { justifyContent: 'center' },
  deliverToText: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  addressSelector: { flexDirection: 'row', alignItems: 'center' },
  addressText: { fontSize: 16, fontWeight: '700', color: COLORS.textDark },
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 10, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  searchContainer: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textDark },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  seeAllText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  
  // Dark Promo Banner
  bannerContainer: { width: '100%', height: 150, borderRadius: 16, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 },
  darkBannerGradient: { flex: 1, flexDirection: 'row', borderRadius: 16, overflow: 'hidden' },
  darkBannerLeft: { flex: 1, padding: 20, justifyContent: 'center', zIndex: 2 },
  darkBannerRight: { width: 140, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  darkBannerImage: { width: 180, height: 180, borderRadius: 90, position: 'absolute', right: -30, borderWidth: 4, borderColor: 'rgba(255,255,255,0.05)' },
  uptoText: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  discountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2, marginBottom: 4 },
  discountValue: { color: '#EEDAA5', fontSize: 28, fontWeight: '900' },
  discountOff: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 4 },
  promoDesc: { color: '#CBD5E1', fontSize: 11, marginBottom: 12 },
  orderNowBtn: { backgroundColor: '#FFFFFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' },
  orderNowText: { color: '#0F172A', fontSize: 11, fontWeight: 'bold' },

  // CATEGORY SCROLL STYLES
  categoryScroll: {
    marginBottom: 30,
    overflow: 'visible',
  },
  categoryItem: {
    width: CATEGORY_ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categorySquircle: {
    width: 60,
    height: 60,
    borderRadius: 32, 
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 1,
  },
  categoryEmoji: {
    fontSize: 28, 
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
  },

  // 2-COLUMN GRID STYLES
  recommendedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  gridCard: {
    width: '48%', 
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 0.5,
  },
  imageContainer: {
    position: 'relative',
    height: 120, 
    width: '100%',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heartBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.heartBg,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: COLORS.badgeBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  cardFooter: {
    padding: 12,
  },
  itemName: {
    fontSize: 14, 
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  shopRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  shopName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
    marginRight: 4,
  },
  ratingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  deliveryPriceRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-end', 
  },
  pricePill: {
    backgroundColor: COLORS.priceBg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
  },
  priceText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },

  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFF' },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, marginTop: 4 }
});