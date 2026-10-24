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
    Modal,
    Keyboard 
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
  
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState(''); 

    const [currentAddress, setCurrentAddress] = useState("Fetching location...");
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [isLocationModalVisible, setLocationModalVisible] = useState(false);

    const [activeOrder, setActiveOrder] = useState(null);
    const [cartSummary, setCartSummary] = useState(null);

    // --- NEW: Extract first letter of user's name for avatar placeholder ---
    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'G';

    useEffect(() => {
        fetchProducts();
        fetchSavedAddress();
        checkAndLoadLocation();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchActiveCartAndOrders();
            fetchSavedAddress();
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
            
            if (data.addresses && data.addresses.length > 0) {
                setSavedAddresses(data.addresses);
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

    const categoryFilteredProducts = selectedCategory === 'All' 
        ? products 
        : products.filter(product => product.category === selectedCategory);

    const searchFilteredProducts = searchQuery.trim() === ''
        ? []
        : products.filter(product => product.name?.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <LinearGradient colors={[THEME.surface, THEME.background]} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor={THEME.surface} />
                
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            {/* --- UPDATED: Replaced Image with Avatar Placeholder --- */}
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('Profile')}
                                style={styles.avatarPlaceholder}
                            >
                                <Text style={styles.avatarText}>{userInitial}</Text>
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

                    {/* Search Bar & Popup Wrapper */}
                    <View style={styles.searchWrapper}>
                        <View style={styles.searchContainer}>
                            <Feather name="search" size={20} color={THEME.textMuted} style={styles.searchIcon} />
                            <TextInput 
                                style={styles.searchInput}
                                placeholder="What are you craving?"
                                placeholderTextColor={THEME.textMuted}
                                value={searchQuery} 
                                onChangeText={setSearchQuery} 
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
                                    <Feather name="x-circle" size={18} color={THEME.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Search Results Dropdown */}
                        {searchQuery.length > 0 && (
                            <View style={styles.searchDropdown}>
                                <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
                                    {searchFilteredProducts.length > 0 ? (
                                        searchFilteredProducts.map((product, index) => (
                                            <TouchableOpacity 
                                                key={product._id} 
                                                style={[
                                                    styles.searchDropdownItem,
                                                    index === searchFilteredProducts.length - 1 && { borderBottomWidth: 0 }
                                                ]}
                                                activeOpacity={0.7}
                                                onPress={() => {
                                                    setSearchQuery('');
                                                    Keyboard.dismiss();
                                                    navigation.navigate('ProductDetails', { product });
                                                }}
                                            >
                                                <Image source={{ uri: product.image }} style={styles.searchItemImage} />
                                                <View style={styles.searchItemDetails}>
                                                    <Text style={styles.searchItemName} numberOfLines={1}>{product.name}</Text>
                                                    <Text style={styles.searchItemPrice}>₹{product.price}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <View style={styles.searchNoResult}>
                                            <Text style={styles.searchNoResultText}>No match for "{searchQuery}"</Text>
                                        </View>
                                    )}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    <PromoBanner />
                    
                    <CategoryList 
                        selectedCategory={selectedCategory} 
                        onSelectCategory={setSelectedCategory} 
                    />

                    <ProductGrid products={categoryFilteredProducts} isLoading={isLoading} />

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

                        {savedAddresses.length > 0 ? (
                            <View style={{ marginTop: 16 }}>
                                <Text style={{ fontSize: 15, fontWeight: '700', color: THEME.textDark, marginBottom: 8 }}>
                                    Saved Addresses
                                </Text>
                                
                                {savedAddresses.map((addr, index) => (
                                    <TouchableOpacity 
                                        key={addr._id || index}
                                        style={styles.locationOption}
                                        onPress={async () => {
                                            setCurrentAddress(addr.fullAddress);
                                            await AsyncStorage.setItem('cachedAddress', addr.fullAddress);
                                            setLocationModalVisible(false);
                                        }}
                                    >
                                        <View style={[styles.locationIconBox, { backgroundColor: '#F1F5F9' }]}>
                                            <Feather name="map-pin" size={20} color={THEME.textDark} />
                                        </View>
                                        <View style={styles.locationOptionTextContainer}>
                                            <Text style={[styles.locationOptionSub, { color: THEME.textDark, fontSize: 14 }]} numberOfLines={2}>
                                                {addr.fullAddress}
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.locationOption}>
                                <View style={[styles.locationIconBox, { backgroundColor: '#F1F5F9' }]}>
                                    <Feather name="map-pin" size={20} color={THEME.textDark} />
                                </View>
                                <View style={styles.locationOptionTextContainer}>
                                    <Text style={styles.locationOptionTitle}>Saved Addresses</Text>
                                    <Text style={styles.locationOptionSub}>No address saved yet</Text>
                                </View>
                            </View>
                        )}
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
    
    // --- UPDATED: Avatar Styles ---
    avatarPlaceholder: { width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    avatarText: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
    
    addressContainer: { justifyContent: 'center', flex: 1 },
    deliverToText: { fontSize: 12, color: THEME.textMuted, marginBottom: 2 },
    addressSelector: { flexDirection: 'row', alignItems: 'center' },
    addressText: { fontSize: 16, fontWeight: '700', color: THEME.textDark, flexShrink: 1 },
    
    headerIcons: { flexDirection: 'row', gap: 12 },
    iconCircle: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: THEME.border, backgroundColor: THEME.surface, justifyContent: 'center', alignItems: 'center' },
    notificationDot: { position: 'absolute', top: 10, right: 12, width: 6, height: 6, borderRadius: 3, backgroundColor: '#EF4444' },
    
    searchWrapper: { position: 'relative', zIndex: 10, marginBottom: 30 },
    searchContainer: { flexDirection: 'row', backgroundColor: THEME.surface, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 5, elevation: 2, borderWidth: 1, borderColor: THEME.border },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, color: THEME.textDark },
    
    searchDropdown: { position: 'absolute', top: 72, left: 0, right: 0, backgroundColor: THEME.card, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, borderWidth: 1, borderColor: THEME.border, zIndex: 20, overflow: 'hidden' },
    searchDropdownItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: THEME.border },
    searchItemImage: { width: 36, height: 36, borderRadius: 6, backgroundColor: THEME.background, marginRight: 12 },
    searchItemDetails: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    searchItemName: { fontSize: 14, fontWeight: '600', color: THEME.textDark, flex: 1, marginRight: 8 },
    searchItemPrice: { fontSize: 13, color: THEME.primary, fontWeight: '700' },
    searchNoResult: { padding: 16, alignItems: 'center' },
    searchNoResultText: { color: THEME.textMuted, fontSize: 13, fontWeight: '500' },

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