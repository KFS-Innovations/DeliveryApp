import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Import our isolated components
import PromoBanner from '../components/PromoBanner';
import CategoryList from '../components/CategoryList';
import ProductGrid from '../components/ProductGrid';

// NEW: Consistent Light Theme
const THEME = {
  background: '#F8FAFC',   // Soft, clean off-white
  surface: '#FFFFFF',      // Pure white
  surfaceActive: '#E2E8F0',// Light slate
  textPrimary: '#0F172A',  // Deep slate/near-black
  textMuted: '#64748B',    // Medium gray
  primary: '#10B981',      // Vibrant Emerald Green
  border: '#E2E8F0',       // Subtle light gray border
};

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch data from MongoDB via Node.js
  useEffect(() => {
    // Using your established IP or falling back to the .env variable
    const API_URL = process.env.EXPO_PUBLIC_IP 
      ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/products`
      : 'http://192.168.0.107:5000/api/products';

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
      colors={[THEME.surface, THEME.background]} 
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.surface} />
        
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
                  <Text style={styles.addressText}>Kattakada</Text>
                  <Ionicons name="caret-down" size={14} color={THEME.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconCircle}>
                <Feather name="bell" size={20} color={THEME.textPrimary} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle}>
                <Feather name="shopping-bag" size={20} color={THEME.textPrimary} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color={THEME.textMuted} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="What are you craving?"
              placeholderTextColor={THEME.textMuted}
            />
          </View>

          {/* Imported Components */}
          <PromoBanner />
          <CategoryList />
          <ProductGrid products={products} isLoading={isLoading} />

        </ScrollView>
      </SafeAreaView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color={THEME.primary} />
          <Text style={[styles.navText, { color: THEME.primary }]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="file-text" size={24} color={THEME.textMuted} />
          <Text style={styles.navText}>Orders</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="message-circle" size={24} color={THEME.textMuted} />
          <Text style={styles.navText}>Offers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="user" size={24} color={THEME.textMuted} />
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
  deliverToText: { fontSize: 12, color: THEME.textMuted, marginBottom: 2 },
  addressSelector: { flexDirection: 'row', alignItems: 'center' },
  addressText: { fontSize: 16, fontWeight: '700', color: THEME.textPrimary },
  
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: THEME.border, backgroundColor: THEME.surface, justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 10, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  
  searchContainer: { flexDirection: 'row', backgroundColor: THEME.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: THEME.border },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: THEME.textPrimary },
  
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: THEME.border, backgroundColor: THEME.surface },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, fontWeight: '600', color: THEME.textMuted, marginTop: 4 }
});