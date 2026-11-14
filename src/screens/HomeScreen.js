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
    Keyboard,
    RefreshControl // Added RefreshControl
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
    const [refreshing, setRefreshing] = useState(false); // Added refreshing state
  
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState(''); 

    const [currentAddress, setCurrentAddress] = useState("Fetching location...");
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [isLocationModalVisible, setLocationModalVisible] = useState(false);

    const [activeOrder, setActiveOrder] = useState(null);
    const [cartSummary, setCartSummary] = useState(null);

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'G';

    useEffect(() => {
        fetchSavedAddress();
        handleGetGPSLocation();
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchProducts();
            fetchActiveCartAndOrders();
            fetchSavedAddress();
            
            const loadActiveAddress = async () => {
                const storedAddress = await AsyncStorage.getItem('cachedAddress');
                if (storedAddress) {
                    setCurrentAddress(storedAddress);
                }
            };
            loadActiveAddress();
        }, [])
    );

    // Added onRefresh function for pull-to-refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        fetchProducts();
        await fetchActiveCartAndOrders();
        await fetchSavedAddress();
        setRefreshing(false);
    }, []);

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

    const fallbackToSavedAddress = async () => {
        const storedAddress = await AsyncStorage.getItem('cachedAddress');
        if (storedAddress) {
            setCurrentAddress(storedAddress);
            return;
        }

        // 2. If no cache, try to fetch their saved addresses from the backend
        try {
            const token = await AsyncStorage.getItem('authToken');
            if (token) {
                const API_URL = process.env.EXPO_PUBLIC_IP 
                    ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address`
                    : 'http://192.168.0.107:5000/api/users/address';
                
                const res = await fetch(API_URL, { headers: { 'Authorization': `Bearer ${token}` } });
                const data = await res.json();
                
                if (data.addresses && data.addresses.length > 0) {
                    const firstAddress = data.addresses[0].fullAddress;
                    setCurrentAddress(firstAddress);
                    await AsyncStorage.setItem('cachedAddress', firstAddress);
                    
                    // Also store coordinates if available so checkout works seamlessly
                    if (data.addresses[0].location) {
                        await AsyncStorage.setItem('activeLat', data.addresses[0].location.latitude.toString());
                        await AsyncStorage.setItem('activeLng', data.addresses[0].location.longitude.toString());
                    }
                    return;
                }
            }
        } catch (err) {
            console.error("Fallback address fetch failed:", err);
        }

        // 3. If no cache and no saved addresses, show a neutral prompt instead of an error
        setCurrentAddress("Select Delivery Location");
    };

    const handleGetGPSLocation = async (isManualClick = false) => {
        // ALWAYS show feedback if the user manually clicked it
        if (isManualClick || currentAddress === "Fetching location...") {
            setCurrentAddress("Fetching GPS...");
        }

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                if (isManualClick) {
                    Alert.alert("Permission Denied", "Please allow location access in your app settings.");
                }
                await fallbackToSavedAddress(); 
                return;
            }

            let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            
            await AsyncStorage.setItem('activeLat', location.coords.latitude.toString());
            await AsyncStorage.setItem('activeLng', location.coords.longitude.toString());

            let geocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            let readableAddress = "Unknown Location";
            if (geocode.length > 0) {
                const place = geocode[0];
                readableAddress = [place.name, place.street, place.city, place.region].filter(Boolean).join(', ') || "Current Location";
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
            console.log("GPS fetch failed (Location might be off).", error.message);
            
            // If they explicitly clicked the button, tell them WHY it didn't work
            if (isManualClick) {
                Alert.alert(
                    "Location Unavailable", 
                    "Please make sure your device's GPS/Location toggle is turned ON and try again."
                );
            }
            
            await fallbackToSavedAddress(); 
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
                
                {/* Attached RefreshControl to ScrollView */}
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={styles.scrollContent} 
                    keyboardShouldPersistTaps="handled"
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                            colors={[THEME.primary]}
                            tintColor={THEME.primary} 
                        />
                    }
                >
                    
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('Profile')}
                                style={styles.avatarPlaceholder}
                            >
                                <Text style={styles.avatarText}>{userInitial}</Text>
                            </TouchableOpacity>
                            
                            <View style={styles.addressContainer}>
                                <Text style={styles.deliverToText}>Deliver to {user?.user?.name ? `${user.user.name}` : ''}</Text>
                                
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

                        {searchQuery.length > 0 && (
                            <View style={styles.searchDropdown}>
                                <ScrollView style={{ maxHeight: 220 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={true}>
                                    {searchFilteredProducts.length > 0 ? (
                                        searchFilteredProducts.map((product, index) => {
                                            const isOutOfStock = product.inStock === false;

                                            return (
                                                <TouchableOpacity 
                                                    key={product._id} 
                                                    style={[
                                                        styles.searchDropdownItem,
                                                        index === searchFilteredProducts.length - 1 && { borderBottomWidth: 0 },
                                                        isOutOfStock && { opacity: 0.5 }
                                                    ]}
                                                    activeOpacity={0.7}
                                                    disabled={isOutOfStock}
                                                    onPress={() => {
                                                        setSearchQuery('');
                                                        Keyboard.dismiss();
                                                        navigation.navigate('ProductDetails', { product });
                                                    }}
                                                >
                                                    <View style={{ position: 'relative', marginRight: 12 }}>
                                                        <Image source={{ uri: product.image }} style={styles.searchItemImage} />
                                                        
                                                        {isOutOfStock && (
                                                            <View style={[styles.searchItemImage, { position: 'absolute', top: 0, left: 0, backgroundColor: 'rgba(255, 255, 255, 0.65)' }]} />
                                                        )}
                                                    </View>
                                                    <View style={styles.searchItemDetails}>
                                                        <View style={{ flex: 1, marginRight: 8 }}>
                                                            <Text style={[styles.searchItemName, isOutOfStock && { textDecorationLine: 'line-through' }]} numberOfLines={1}>{product.name}</Text>
                                                            <Text style={{ fontSize: 11, color: THEME.textMuted }} numberOfLines={1}>
                                                                {product.sellerId?.shopName || 'Local Shop'}
                                                            </Text>
                                                        </View>
                                                        <View style={{ alignItems: 'flex-end' }}>
                                                            <Text style={styles.searchItemPrice}>₹{product.price}</Text>
                                                            {isOutOfStock && (
                                                                <Text style={{ fontSize: 10, color: '#EF4444', fontWeight: 'bold', marginTop: 2 }}>OUT OF STOCK</Text>
                                                            )}
                                                        </View>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })
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
                                // ADD 'true' HERE to indicate a manual click
                                handleGetGPSLocation(true); 
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
                                            
                                            if (addr.location?.latitude && addr.location?.longitude) {
                                                await AsyncStorage.setItem('activeLat', addr.location.latitude.toString());
                                                await AsyncStorage.setItem('activeLng', addr.location.longitude.toString());
                                            }

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
    searchItemName: { fontSize: 14, fontWeight: '600', color: THEME.textDark, marginBottom: 2 },
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