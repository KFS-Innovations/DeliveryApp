import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  StatusBar,
  Alert,
  Modal // <-- Added Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import * as Location from 'expo-location'; 

import PromoBanner from '../components/PromoBanner';
import CategoryList from '../components/CategoryList';
import ProductGrid from '../components/ProductGrid';

const THEME = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceActive: '#E2E8F0',
  textPrimary: '#0F172A',
  textMuted: '#64748B',
  primary: '#10B981',
  border: '#E2E8F0',
};

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Location States
  const [currentAddress, setCurrentAddress] = useState("Fetching location...");
  const [savedAddress, setSavedAddress] = useState(null);
  const [isLocationModalVisible, setLocationModalVisible] = useState(false);

useEffect(() => {
    fetchProducts();
    fetchSavedAddress();
    checkAndLoadLocation();
  }, []);

  // Check if we already fetched the location previously
  const checkAndLoadLocation = async () => {
    try {
      const cached = await AsyncStorage.getItem('cachedAddress');
      if (cached) {
        setCurrentAddress(cached);
      } else {
        // Only fetch GPS if we have no cached address
        handleGetGPSLocation();
      }
    } catch (error) {
      handleGetGPSLocation();
    }
  };

  const fetchProducts = () => {
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
  };

  // Fetch the address the user saved during checkout
  const fetchSavedAddress = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      
      const API_URL = process.env.EXPO_PUBLIC_IP 
        ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address`
        : 'http://192.168.0.107:5000/api/users/address';

      const res = await fetch(API_URL, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.address && data.address !== "Please add a delivery address") {
        setSavedAddress(data.address);
      }
    } catch (error) {
      console.error("Error fetching saved address:", error);
    }
  };

  // Get Live GPS Location
  const handleGetGPSLocation = async () => {
    setCurrentAddress("Fetching GPS...");
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setCurrentAddress("Location permission denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      let readableAddress = "Unknown Location";
      if (geocode.length > 0) {
        const { city, district, region } = geocode[0];
        readableAddress = city || district || region || "Current Location";
        setCurrentAddress(readableAddress);
      }
      await AsyncStorage.setItem('cachedAddress', readableAddress);

      // Silently update backend with live coordinates
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        const API_URL = process.env.EXPO_PUBLIC_IP 
          ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/location`
          : 'http://192.168.0.107:5000/api/users/location';

        await fetch(API_URL, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            address: readableAddress
          })
        });
      }
    } catch (error) {
      console.error("Error handling location:", error);
      setCurrentAddress("Location unavailable");
    }
  };

  return (
    <LinearGradient colors={[THEME.surface, THEME.background]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.surface} />
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }} 
                  style={styles.profilePic} 
                />
              </TouchableOpacity>
              <View style={styles.addressContainer}>
                <Text style={styles.deliverToText}>Deliver to {user?.user?.name ? `• ${user.user.name}` : ''}</Text>
                
                {/* Make Address Clickable */}
                <TouchableOpacity 
                  style={styles.addressSelector}
                  onPress={() => setLocationModalVisible(true)}
                >
                  <Text style={styles.addressText} numberOfLines={1}>
                    {currentAddress.length > 22 
                      ? `${currentAddress.substring(0, 14)}..` 
                      : currentAddress}
                  </Text>
                  <Ionicons name="caret-down" size={14} color={THEME.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.headerIcons}>
              <TouchableOpacity style={styles.iconCircle}>
                <Feather name="bell" size={20} color={THEME.textPrimary} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('Cart')}>
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

      {/* LOCATION SELECTION MODAL */}
      <Modal visible={isLocationModalVisible} animationType="fade" transparent={true} onRequestClose={() => setLocationModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Delivery Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Feather name="x" size={24} color={THEME.textMuted} />
              </TouchableOpacity>
            </View>
            
            {/* Option 1: Live GPS */}
            <TouchableOpacity 
              style={styles.locationOption}
              onPress={() => {
                handleGetGPSLocation();
                setLocationModalVisible(false);
              }}
            >
              <View style={styles.locationIconBox}>
                <Feather name="navigation" size={20} color={THEME.primary} />
              </View>
              <View style={styles.locationOptionTextContainer}>
                <Text style={styles.locationOptionTitle}>Use Current Location</Text>
                <Text style={styles.locationOptionSub}>Fetch location via GPS</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Option 2: Saved Address */}
            <TouchableOpacity 
              style={styles.locationOption}
              onPress={async () => {
                if (savedAddress) {
                  setCurrentAddress(savedAddress);
                  await AsyncStorage.setItem('cachedAddress', savedAddress); // <-- Cache their choice
                  setLocationModalVisible(false);
                } else {
                  Alert.alert("No Saved Address", "You can save an address during the checkout process.");
                }
              }}
            >
              <View style={[styles.locationIconBox, { backgroundColor: '#F1F5F9' }]}>
                <Feather name="map-pin" size={20} color={THEME.textDark} />
              </View>
              <View style={styles.locationOptionTextContainer}>
                <Text style={styles.locationOptionTitle}>Saved Address</Text>
                <Text style={styles.locationOptionSub} numberOfLines={2}>
                  {savedAddress ? savedAddress : "No address saved yet"}
                </Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 25 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 15 },
  profilePic: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  addressContainer: { justifyContent: 'center', flex: 1 },
  deliverToText: { fontSize: 12, color: THEME.textMuted, marginBottom: 2 },
  addressSelector: { flexDirection: 'row', alignItems: 'center' },
  addressText: { fontSize: 16, fontWeight: '700', color: THEME.textPrimary, flexShrink: 1 },
  
  headerIcons: { flexDirection: 'row', gap: 12 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: THEME.border, backgroundColor: THEME.surface, justifyContent: 'center', alignItems: 'center' },
  notificationDot: { position: 'absolute', top: 10, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
  
  searchContainer: { flexDirection: 'row', backgroundColor: THEME.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: THEME.border },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: THEME.textPrimary },
  
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, paddingBottom: 20, borderTopWidth: 1, borderTopColor: THEME.border, backgroundColor: THEME.surface },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 10, fontWeight: '600', color: THEME.textMuted, marginTop: 4 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: THEME.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.textPrimary },
  locationOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  locationIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  locationOptionTextContainer: { flex: 1 },
  locationOptionTitle: { fontSize: 16, fontWeight: '600', color: THEME.textPrimary, marginBottom: 4 },
  locationOptionSub: { fontSize: 13, color: THEME.textMuted, lineHeight: 18 },
  divider: { height: 1, backgroundColor: THEME.border, marginVertical: 8 }
});