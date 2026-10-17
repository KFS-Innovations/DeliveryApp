import React, { useState, useEffect, useContext, useCallback } from 'react';
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
    Modal 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import * as Location from 'expo-location'; 
import { useFocusEffect } from '@react-navigation/native'; 

import PromoBanner from '../components/PromoBanner';
import CategoryList from '../components/CategoryList';
import ProductGrid from '../components/ProductGrid';

const THEME = {
    primary: '#10B981',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceActive: '#E2E8F0',
    border: '#E2E8F0',
};

export default function HomeScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
  
    // --- NEW: Category Filter State ---
    const [selectedCategory, setSelectedCategory] = useState('All');

    // Location States
    const [currentAddress, setCurrentAddress] = useState("Fetching location...");
    const [savedAddress, setSavedAddress] = useState(null);
    const [isLocationModalVisible, setLocationModalVisible] = useState(false);

    // Pending Action States
    const [activeOrder, setActiveOrder] = useState(null);
    const [cartSummary, setCartSummary] = useState(null);

    useEffect(() => {
        fetchProducts();
        fetchSavedAddress();
        checkAndLoadLocation();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchActiveCartAndOrders();
        }, [])
    );

    const fetchActiveCartAndOrders = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;
            const headers = { 'Authorization': `Bearer ${token}` };

            const orderRes = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:5000/api/order/history`, { headers });
            const orderData = await orderRes.json();
            
            if (orderData.orders && orderData.orders.length > 0) {
                const latestOrder = orderData.orders[0];
                if (latestOrder.orderStatus !== 'Delivered' && latestOrder.orderStatus !== 'Cancelled') {
                    setActiveOrder(latestOrder);
                } else {
                    setActiveOrder(null);
                }
            }

            const cartRes = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:5000/api/cart`, { headers });
            const cartData = await cartRes.json();
            
            if (cartData.items && cartData.items.length > 0) {
                const total = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                setCartSummary({ count: cartData.items.length, total });
            } else {
                setCartSummary(null);
            }
        } catch (error) {
            console.error("Error fetching pending activities:", error);
        }
    };

    const checkAndLoadLocation = async () => {
        try {
            const cached = await AsyncStorage.getItem('cachedAddress');
            if (cached) {
                setCurrentAddress(cached);
            } else {
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
            .catch((error) => console.error("Error fetching data: ", error));
    };

    const fetchSavedAddress = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (!token) return;
            
            const API_URL = process.env.EXPO_PUBLIC_IP 
                ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address`
                : 'http://192.168.0.107:5000/api/users/address';

            const res = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            
            if (data.address && data.address !== "Please add a delivery address") {
                setSavedAddress(data.address);
            }
        } catch (error) {
            console.error("Error fetching saved address:", error);
        }
    };

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

            const token = await AsyncStorage.getItem('authToken');
            if (token) {
                const API_URL = process.env.EXPO_PUBLIC_IP 
                    ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/location`
                    : 'http://192.168.0.107:5000/api/users/location';

                await fetch(API_URL, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

    // --- NEW: Filter products before passing them to the Grid ---
    const filteredProducts = selectedCategory === 'All' 
        ? products 
        : products.filter(product => product.category === selectedCategory);

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
                            <TouchableOpacity style={styles.iconCircle} onPress={() => navigation.navigate('Cart')}>
                                <Feather name="shopping-bag" size={20} color={THEME.textDark} />
                                {cartSummary && <View style={styles.notificationDot} />}
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
                    
                    {/* --- UPDATED: Pass state to CategoryList and filtered items to ProductGrid --- */}
                    <CategoryList 
                        selectedCategory={selectedCategory} 
                        onSelectCategory={setSelectedCategory} 
                    />
                    <ProductGrid products={filteredProducts} isLoading={isLoading} />

                </ScrollView>
            </SafeAreaView>

            {/* FLOATING ACTION BANNER */}
            {activeOrder ? (
               <TouchableOpacity 
                    style={[styles.floatingBanner, { backgroundColor: '#13737e' }]} 
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('OrderStatus', { orderId: activeOrder._id })}
                >
                    <View style={styles.floatingIconBox}>
                        <Feather name="package" size={20} color="#FFF" />
                    </View>
                    <View style={styles.floatingTextContainer}>
                        <Text style={styles.floatingTitle}>Ongoing Order</Text>
                        <Text style={styles.floatingSub}>Status: {activeOrder.orderStatus}</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#FFF" />
                </TouchableOpacity>
            ) : cartSummary ? (
                <TouchableOpacity 
                    style={styles.floatingBanner} 
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('Cart')}
                >
                    <View style={styles.floatingIconBox}>
                        <Feather name="shopping-bag" size={20} color="#FFF" />
                    </View>
                    <View style={styles.floatingTextContainer}>
                        <Text style={styles.floatingTitle}>{cartSummary.count} Item{cartSummary.count > 1 ? 's' : ''} in Cart</Text>
                        <Text style={styles.floatingSub}>₹{cartSummary.total.toFixed(2)} Proceed to checkout</Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#FFF" />
                </TouchableOpacity>
            ) : null}

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

                        <TouchableOpacity 
                            style={styles.locationOption}
                            onPress={async () => {
                                if (savedAddress) {
                                    setCurrentAddress(savedAddress);
                                    await AsyncStorage.setItem('cachedAddress', savedAddress);
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
    scrollContent: { paddingHorizontal: 20, paddingBottom: 100 }, 
    
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 25 },
    headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 15 },
    profilePic: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
    addressContainer: { justifyContent: 'center', flex: 1 },
    deliverToText: { fontSize: 12, color: THEME.textMuted, marginBottom: 2 },
    addressSelector: { flexDirection: 'row', alignItems: 'center' },
    addressText: { fontSize: 16, fontWeight: '700', color: THEME.textDark, flexShrink: 1 }, // Changed textPrimary to textDark to fix potential crash
    
    headerIcons: { flexDirection: 'row', gap: 12 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: THEME.border, backgroundColor: THEME.surface, justifyContent: 'center', alignItems: 'center' },
    notificationDot: { position: 'absolute', top: 10, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
    
    searchContainer: { flexDirection: 'row', backgroundColor: THEME.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: THEME.border },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, color: THEME.textDark }, // Changed textPrimary to textDark
    
    floatingBanner: { position: 'absolute', bottom: 16, left: 16, right: 16, backgroundColor: THEME.primary, borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    floatingIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    floatingTextContainer: { flex: 1 },
    floatingTitle: { fontSize: 15, fontWeight: '700', color: '#FFF', marginBottom: 2 },
    floatingSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: THEME.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark },
    locationOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    locationIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    locationOptionTextContainer: { flex: 1 },
    locationOptionTitle: { fontSize: 16, fontWeight: '600', color: THEME.textDark, marginBottom: 4 },
    locationOptionSub: { fontSize: 13, color: THEME.textMuted, lineHeight: 18 },
    divider: { height: 1, backgroundColor: THEME.border, marginVertical: 8 }
});