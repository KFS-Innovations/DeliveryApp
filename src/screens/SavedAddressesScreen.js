import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator,
    StatusBar,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview'; 

const THEME = {
    primary: '#10B981',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    danger: '#EF4444',
    surfaceActive: '#ECFDF5'
};

const mapHTML = (lat, lng) => `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body, html { padding: 0; margin: 0; width: 100%; height: 100%; }
        #map { width: 100%; height: 100%; }
        .center-marker { 
            position: absolute; 
            top: 50%; left: 50%; 
            transform: translate(-50%, -100%); 
            z-index: 1000; 
            pointer-events: none; 
            font-size: 36px;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="center-marker">📍</div>
    <script>
        var map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    </script>
</body>
</html>
`;

export default function SavedAddressesScreen({ navigation }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal & Form States
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [houseDetails, setHouseDetails] = useState("");
    const [areaDetails, setAreaDetails] = useState("");
    const [landmark, setLandmark] = useState("");
    
    // Coordinate States
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    // Map States
    const [initialMapCoords, setInitialMapCoords] = useState({ latitude: 8.5241, longitude: 76.9366 });
    const [isMapModalVisible, setMapModalVisible] = useState(false);
    
    // Map Search & Suggestion States
    const webViewRef = useRef(null);
    const searchTimeout = useRef(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Prevents WebView from reloading on every keystroke. MUST be before `if (loading)`
    const mapSource = useMemo(() => {
        return { html: mapHTML(initialMapCoords.latitude, initialMapCoords.longitude) };
    }, [initialMapCoords.latitude, initialMapCoords.longitude]);

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.addresses) setAddresses(data.addresses);
        } catch (error) {
            Alert.alert("Error", "Could not fetch addresses.");
        } finally {
            setLoading(false);
        }
    };

    // --- NEW: Save the selected address as the active delivery location ---
    const handleSelectActiveAddress = async (address) => {
        try {
            if (!address.location || !address.location.latitude || !address.location.longitude) {
                return Alert.alert("Location Missing", "This address is missing GPS coordinates. Please edit it and pin a location on the map.");
            }

            // 1. Store coordinates and full address text
            await AsyncStorage.setItem('activeLat', address.location.latitude.toString());
            await AsyncStorage.setItem('activeLng', address.location.longitude.toString());
            await AsyncStorage.setItem('cachedAddress', address.fullAddress); // Syncs with Home screen

            Alert.alert(
                "Address Selected", 
                "Your delivery location has been updated.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            Alert.alert("Error", "Could not set active address.");
        }
    };

    const handleDelete = async (addressId) => {
        Alert.alert("Delete Address", "Are you sure you want to delete this address?", [
            { text: "Cancel", style: "cancel" },
            { 
                text: "Delete", style: "destructive",
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('authToken');
                        const res = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address/${addressId}`, {
                            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (data.success) {
                            setAddresses(addresses.filter(addr => addr._id !== addressId));
                        }
                    } catch (error) {
                        Alert.alert("Error", "Network error while deleting");
                    }
                }
            }
        ]);
    };

    const openModalForNew = () => {
        setEditingAddressId(null);
        setHouseDetails(""); setAreaDetails(""); setLandmark("");
        setLatitude(null); setLongitude(null);
        setModalVisible(true);
    };

    const openModalForEdit = (address) => {
        setEditingAddressId(address._id);
        setHouseDetails(address.houseDetails || "");
        setAreaDetails(address.areaDetails || "");
        setLandmark(address.landmark || "");
        
        const lat = address.location?.latitude || null;
        const lng = address.location?.longitude || null;
        setLatitude(lat); setLongitude(lng);
        setModalVisible(true);
    };

    const handleGetCurrentLocation = async () => {
        setIsFetchingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Allow location access to pin your address.');
                setIsFetchingLocation(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLatitude(location.coords.latitude);
            setLongitude(location.coords.longitude);
            
            let geocode = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            if (geocode.length > 0) {
                const place = geocode[0];
                const areaInfo = [place.name, place.street, place.subregion, place.city, place.postalCode].filter(Boolean).join(', ');
                setAreaDetails(areaInfo); 
            }
        } catch (error) {
            Alert.alert('Error', 'Could not fetch location.');
        } finally {
            setIsFetchingLocation(false);
        }
    };

    // Live search suggestion handler with Debounce
    const handleTextChange = (text) => {
        setSearchQuery(text);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        
        if (text.length > 2) {
            // Wait 600ms after user stops typing before calling API
            searchTimeout.current = setTimeout(async () => {
                try {
                    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&limit=5&countrycodes=in`;
                    const response = await fetch(url, { headers: { 'User-Agent': 'FoodDeliveryApp/1.0' } });
                    const data = await response.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                } catch (error) {
                    console.log("Error fetching suggestions");
                }
            }, 600);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    // Action when clicking a suggestion
    const handleSelectSuggestion = (item) => {
        setSearchQuery(item.display_name);
        setShowSuggestions(false);
        Keyboard.dismiss();
        
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                map.setView([${lat}, ${lon}], 15);
                true;
            `);
        }
    };

    const handleSearchLocation = async () => {
        setShowSuggestions(false);
        if (!searchQuery.trim()) return;
        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=in`;
            const response = await fetch(url, { headers: { 'User-Agent': 'FoodDeliveryApp/1.0' } });
            const data = await response.json();
            
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                
                if (webViewRef.current) {
                    webViewRef.current.injectJavaScript(`
                        map.setView([${lat}, ${lon}], 15);
                        true;
                    `);
                }
            } else {
                Alert.alert("Not Found", "Could not find this place. Try a broader search.");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to search location.");
        }
    };

    // Ask the WebView for the map's center coordinates only when confirmed
    const handleConfirmMapLocation = () => {
        if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
                var center = map.getCenter();
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    action: 'CONFIRM',
                    latitude: center.lat, 
                    longitude: center.lng 
                }));
                true;
            `);
        }
    };

    const handleSaveAddress = async () => {
        if (!houseDetails.trim() || !areaDetails.trim()) {
            return Alert.alert("Required Fields", "Please enter your House/Flat No. and Area.");
        }
        if (!latitude || !longitude) {
            return Alert.alert("Location Required", "Please click 'Pin Current Location' or 'Pick on Map'.");
        }
        
        const fullAddress = `${houseDetails}, ${areaDetails}${landmark ? `, Near ${landmark}` : ''}`;
        const url = editingAddressId 
            ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address/${editingAddressId}`
            : `http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address`;
        
        const method = editingAddressId ? 'PUT' : 'POST';

        try {
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ houseDetails, areaDetails, landmark, fullAddress, location: { latitude, longitude }})
            });

            const data = await res.json();
            if (data.success) {
                fetchAddresses(); 
                setModalVisible(false);
            } else {
                Alert.alert("Error", "Could not save address");
            }
        } catch (error) {
            Alert.alert("Error", "Network error while saving address");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={THEME.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
                <TouchableOpacity onPress={openModalForNew} style={styles.addButton}>
                    <Feather name="plus" size={24} color={THEME.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {addresses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Feather name="map" size={48} color={THEME.textMuted} style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyText}>No saved addresses yet.</Text>
                    </View>
                ) : (
                    addresses.map((addr) => (
                        // --- CHANGED: Made the entire card clickable to select the active address ---
                        <TouchableOpacity 
                            key={addr._id} 
                            style={styles.addressCard}
                            onPress={() => handleSelectActiveAddress(addr)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.addressCardHeader}>
                                <View style={styles.iconBox}>
                                    <Feather name="home" size={20} color={THEME.primary} />
                                </View>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity 
                                        onPress={(e) => { e.stopPropagation(); openModalForEdit(addr); }} 
                                        style={styles.iconButton}
                                    >
                                        <Feather name="edit-2" size={18} color={THEME.textMuted} />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={(e) => { e.stopPropagation(); handleDelete(addr._id); }} 
                                        style={[styles.iconButton, { marginLeft: 12 }]}
                                    >
                                        <Feather name="trash-2" size={18} color={THEME.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={styles.addressValue}>{addr.fullAddress}</Text>
                            <Text style={styles.tapToSelectText}>Tap to select for delivery</Text>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Form Modal */}
            <Modal visible={isModalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>{editingAddressId ? "Edit Address" : "Add New Address"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                                <Feather name="x" size={24} color={THEME.textMuted} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <View style={styles.locationButtonRow}>
                                <TouchableOpacity style={styles.currentLocationBtn} onPress={handleGetCurrentLocation}>
                                    {isFetchingLocation ? (
                                        <ActivityIndicator size="small" color={THEME.primary} style={{ marginRight: 8 }} />
                                    ) : (
                                        <Feather name="navigation" size={20} color={THEME.primary} style={{ marginRight: 8 }} />
                                    )}
                                    <Text style={styles.currentLocationBtnText}>Current Location</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.mapBtn} onPress={() => {
                                    setInitialMapCoords({
                                        latitude: latitude || 8.5241,
                                        longitude: longitude || 76.9366
                                    });
                                    setMapModalVisible(true);
                                }}>
                                    <Feather name="map" size={20} color="#3B82F6" style={{ marginRight: 8 }} />
                                    <Text style={styles.mapBtnText}>Pick on Map</Text>
                                </TouchableOpacity>
                            </View>

                            {latitude && longitude && (
                                <Text style={styles.successPinText}>✓ Location pinned successfully</Text>
                            )}

                            <Text style={styles.inputSubLabel}>House / Flat / Block No.*</Text>
                            <TextInput
                                style={styles.addressInput}
                                placeholder="e.g. Flat 4B, Skyline Apartments"
                                placeholderTextColor={THEME.textMuted}
                                value={houseDetails}
                                onChangeText={setHouseDetails}
                            />

                            <Text style={styles.inputSubLabel}>Area / Street / Sector*</Text>
                            <TextInput
                                style={styles.addressInput}
                                placeholder="e.g. MG Road, Near City Center"
                                placeholderTextColor={THEME.textMuted}
                                value={areaDetails}
                                onChangeText={setAreaDetails}
                                multiline
                            />

                            <Text style={styles.inputSubLabel}>Landmark (Optional)</Text>
                            <TextInput
                                style={styles.addressInput}
                                placeholder="e.g. Opposite Metro Station"
                                placeholderTextColor={THEME.textMuted}
                                value={landmark}
                                onChangeText={setLandmark}
                            />

                            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveAddress}>
                                <Text style={styles.modalSaveText}>{editingAddressId ? "Update Address" : "Save Address"}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* MAP PICKER MODAL */}
            <Modal visible={isMapModalVisible} animationType="slide">
                <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setMapModalVisible(false)} style={styles.backButton}>
                            <Feather name="x" size={24} color={THEME.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Move map to adjust</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={{ flex: 1 }}>
                        <View style={styles.mapSearchContainer}>
                            <TextInput
                                style={styles.mapSearchInput}
                                placeholder="Search area, city, or landmark..."
                                placeholderTextColor={THEME.textMuted}
                                value={searchQuery}
                                onChangeText={handleTextChange}
                                onSubmitEditing={handleSearchLocation}
                                returnKeyType="search"
                            />
                            <TouchableOpacity style={styles.mapSearchBtn} onPress={handleSearchLocation}>
                                <Feather name="search" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>

                        {/* Live Suggestions Overlay */}
                        {showSuggestions && suggestions.length > 0 && (
                            <View style={styles.suggestionsContainer}>
                                <ScrollView keyboardShouldPersistTaps="handled">
                                    {suggestions.map((item, index) => (
                                        <TouchableOpacity 
                                            key={index} 
                                            style={styles.suggestionItem}
                                            onPress={() => handleSelectSuggestion(item)}
                                        >
                                            <Feather name="map-pin" size={16} color={THEME.textMuted} style={{ marginRight: 10, marginTop: 2 }} />
                                            <Text style={styles.suggestionText} numberOfLines={2}>
                                                {item.display_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <WebView 
                            ref={webViewRef}
                            source={mapSource}
                            style={{ flex: 1 }}
                            scrollEnabled={false}
                            bounces={false}
                            javaScriptEnabled={true}
                            domStorageEnabled={true}
                            showsVerticalScrollIndicator={false}
                            showsHorizontalScrollIndicator={false}
                            overScrollMode="never" 
                            onMessage={async (event) => {
                                const data = JSON.parse(event.nativeEvent.data);
                                
                                if (data.action === 'CONFIRM') {
                                    setLatitude(data.latitude);
                                    setLongitude(data.longitude);
                                    setMapModalVisible(false);
                                    
                                    try {
                                        let geocode = await Location.reverseGeocodeAsync({
                                            latitude: data.latitude,
                                            longitude: data.longitude
                                        });
                                        if (geocode.length > 0) {
                                            const place = geocode[0];
                                            const areaInfo = [place.name, place.street, place.subregion, place.city, place.postalCode].filter(Boolean).join(', ');
                                            setAreaDetails(areaInfo); 
                                        }
                                    } catch (error) {
                                        console.log("Could not reverse geocode map location");
                                    }
                                }
                            }}
                        />
                    </View>

                    <View style={styles.mapFooter}>
                        <TouchableOpacity style={styles.modalSaveBtn} onPress={handleConfirmMapLocation}>
                            <Text style={styles.modalSaveText}>Confirm this Location</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: THEME.card, borderBottomWidth: 1, borderBottomColor: THEME.border },
    backButton: { padding: 8, marginLeft: -8 },
    addButton: { padding: 8, marginRight: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark },
    scrollContent: { padding: 16, paddingBottom: 40 },
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: THEME.textMuted, fontSize: 16, fontWeight: '500' },

    addressCard: { backgroundColor: THEME.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: THEME.border },
    addressCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
    actionButtons: { flexDirection: 'row' },
    iconButton: { padding: 8, backgroundColor: THEME.background, borderRadius: 8 },
    addressValue: { fontSize: 14, color: THEME.textDark, lineHeight: 22 },
    tapToSelectText: { color: THEME.primary, fontSize: 12, marginTop: 12, fontWeight: '600' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: THEME.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 20, maxHeight: '90%' },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark },
    
    locationButtonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 10 },
    currentLocationBtn: { flex: 1, marginRight: 8, backgroundColor: THEME.surfaceActive, borderColor: '#D1FAE5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
    currentLocationBtnText: { color: THEME.primary, fontWeight: '700', fontSize: 14 },
    
    mapBtn: { flex: 1, marginLeft: 8, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1 },
    mapBtnText: { color: '#3B82F6', fontWeight: '700', fontSize: 14 },
    
    successPinText: { color: THEME.primary, fontSize: 12, textAlign: 'center', marginBottom: 10, fontWeight: '600' },

    inputSubLabel: { fontSize: 13, fontWeight: '600', color: THEME.textDark, marginBottom: 6, marginTop: 12 },
    addressInput: { borderWidth: 1, borderColor: THEME.border, borderRadius: 10, padding: 12, fontSize: 15, color: THEME.textDark, backgroundColor: THEME.background },
    
    modalSaveBtn: { padding: 16, borderRadius: 12, backgroundColor: THEME.primary, alignItems: 'center', marginTop: 24 },
    modalSaveText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

    mapSearchContainer: { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row', zIndex: 10, backgroundColor: THEME.card, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 5 },
    mapSearchInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: THEME.textDark },
    mapSearchBtn: { backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, borderTopRightRadius: 12, borderBottomRightRadius: 12 },

    suggestionsContainer: { position: 'absolute', top: 76, left: 16, right: 16, backgroundColor: THEME.card, borderRadius: 12, maxHeight: 220, zIndex: 20, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, borderWidth: 1, borderColor: THEME.border },
    suggestionItem: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderBottomColor: THEME.border },
    suggestionText: { flex: 1, fontSize: 14, color: THEME.textDark, lineHeight: 20 },

    mapFooter: { padding: 20, backgroundColor: THEME.card, paddingBottom: 40 }
});