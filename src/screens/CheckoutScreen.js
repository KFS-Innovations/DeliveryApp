import React, { useState, useEffect } from 'react';
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
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview'; 
import * as Location from 'expo-location'; 

const THEME = {
    primary: '#10B981',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    success: '#059669',
    surfaceActive: '#ECFDF5'
};

export default function CheckoutScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [subtotal, setSubtotal] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(40);
    const [paymentMethod, setPaymentMethod] = useState('cod'); 
    
    // --- NEW: Multiple Address States ---
    const [activeAddress, setActiveAddress] = useState("Please select or add an address"); // The string used for the final order
    const [savedAddresses, setSavedAddresses] = useState([]); // Array of address objects from DB
    
    const [paymentUrl, setPaymentUrl] = useState(null);
    const [isAddressModalVisible, setAddressModalVisible] = useState(false);
    
    // Form States
    const [houseDetails, setHouseDetails] = useState("");
    const [areaDetails, setAreaDetails] = useState("");
    const [landmark, setLandmark] = useState("");
    const [isFetchingLocation, setIsFetchingLocation] = useState(false);

    useEffect(() => {
        fetchCheckoutData();
        fetchUserAddresses(); 
    }, []);

    const fetchUserAddresses = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.addresses && data.addresses.length > 0) {
                setSavedAddresses(data.addresses);
                // Automatically set the most recently added address as active
                setActiveAddress(data.addresses[data.addresses.length - 1].fullAddress);
            }
        } catch (error) {
            console.error("Fetch address error:", error);
            setActiveAddress("Failed to load address");
        }
    };

    const fetchCheckoutData = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const CART_API_URL = `http://${process.env.EXPO_PUBLIC_IP}:5000/api/cart`;

            const cartRes = await fetch(CART_API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const cartData = await cartRes.json();
            
            if (cartData.items) {
                const total = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                setSubtotal(total);
            }
        } catch (error) {
            console.error("Failed to load checkout details:", error);
        } finally {
            setLoading(false);
        }
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

    const handleSaveNewAddress = async () => {
        if (!houseDetails.trim() || !areaDetails.trim()) {
            return Alert.alert("Required Fields", "Please enter your House/Flat No. and Area.");
        }
        
        const fullAddress = `${houseDetails}, ${areaDetails}${landmark ? `, Near ${landmark}` : ''}`;
        
        try {
            const token = await AsyncStorage.getItem('authToken');
            // Notice we changed this to POST based on your new backend route
            const res = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ 
                    houseDetails, 
                    areaDetails, 
                    landmark, 
                    fullAddress,
                })
            });

            const data = await res.json();
            if (data.success) {
                setSavedAddresses(data.addresses); // Update array with the new list from DB
                setActiveAddress(fullAddress); // Set the newly created one as active
                setAddressModalVisible(false); 
                
                // Clear form
                setHouseDetails("");
                setAreaDetails("");
                setLandmark("");
            } else {
                Alert.alert("Error", "Could not save address");
            }
        } catch (error) {
            Alert.alert("Error", "Network error while saving address");
        }
    };

    const totalAmount = subtotal + deliveryFee;

    const finalizeOrderInDB = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const ORDER_API_URL = `http://${process.env.EXPO_PUBLIC_IP}:5000/api/order/place`;

            const response = await fetch(ORDER_API_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    paymentMethod: paymentMethod,
                    deliveryAddress: activeAddress,
                    totalAmount: totalAmount
                })
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert(
                    "Order Placed!", 
                    "Your order has been confirmed successfully.",
                    [{ text: "Track Order", onPress: () => navigation.replace('OrderStatus', { orderId: data.orderId }) }]
                );
            } else {
                Alert.alert("Error", data.error || "Could not place order");
            }
        } catch (error) {
            console.error("Order Creation Error:", error);
            Alert.alert("Error", "Something went wrong while placing your order.");
        }
    };

    const handlePlaceOrder = async () => {
        if (activeAddress === "Please select or add an address" || activeAddress === "Failed to load address") {
            return Alert.alert("Delivery Address", "Please select or add a delivery address before placing your order.");
        }

        if (paymentMethod === 'upi' || paymentMethod === 'card') {
            try {
                // 1. Fetch the token and userId from local storage
                const token = await AsyncStorage.getItem('authToken');
                const myUserId = await AsyncStorage.getItem('userId'); 

                const API_URL = `http://${process.env.EXPO_PUBLIC_IP}:5000/api/payment/generate-link`;
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // Good practice to include the token
                    },
                    // 2. INJECT userId INTO THE BODY HERE
                    body: JSON.stringify({ 
                        amount: totalAmount,
                        userId: myUserId,
                        deliveryAddress: activeAddress 
                    }) 
                });
                
                const data = await response.json();
                
                if (data.payment_url) {
                    setPaymentUrl(data.payment_url); 
                } else {
                    Alert.alert("Error", "Could not generate payment link.");
                }
            } catch (error) {
                Alert.alert("Error", "Could not connect to payment server.");
            }
        } else {
            finalizeOrderInDB();
        }
    };

    const verifyPaymentOnBackend = async (url) => {
        try {
            const queryString = url.split('?')[1];
            const params = {};
            if (queryString) {
                queryString.split('&').forEach(param => {
                    const [key, value] = param.split('=');
                    params[key] = decodeURIComponent(value);
                });
            }

            const VERIFY_URL = `http://${process.env.EXPO_PUBLIC_IP}:5000/api/payment/verify-link`;
            const token = await AsyncStorage.getItem('authToken');
            
            const response = await fetch(VERIFY_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(params)
            });

            const data = await response.json();

            if (data.success) {
                // The frontend no longer saves the order. 
                // The Razorpay Webhook will save it in the background!
                Alert.alert(
                    "Payment Successful!", 
                    "Your order is being processed securely.",
                    [{ text: "OK", onPress: () => navigation.replace('MainTabs') }] // Change 'Home' to your orders screen if you prefer
                );
            } else {
                Alert.alert("Payment Failed", "We could not verify your transaction.");
            }
        } catch (error) {
            Alert.alert("Error", "Something went wrong while verifying the payment.");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.primary} />
            </View>
        );
    }

    const handleClosePayment = () => {
        Alert.alert(
            "Cancel Payment?",
            "Are you sure you want to close this page?\n\nIf you just completed a payment, please press 'Wait' and allow a few seconds for the page to redirect, otherwise your order will not be placed.",
            [
                { text: "Wait", style: "cancel" },
                { 
                    text: "Close Anyway", 
                    style: "destructive", 
                    onPress: () => setPaymentUrl(null) 
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={THEME.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <Text style={styles.sectionTitle}>Delivery Address</Text>
                <View style={styles.card}>
                    <View style={styles.addressRow}>
                        <View style={styles.iconBox}>
                            <Feather name="map-pin" size={20} color={THEME.primary} />
                        </View>
                        <View style={styles.addressTextContainer}>
                            <Text style={styles.addressLabel}>Deliver To</Text>
                            <Text style={styles.addressValue} numberOfLines={3}>{activeAddress}</Text>
                        </View>
                        <TouchableOpacity onPress={() => setAddressModalVisible(true)}>
                            <Text style={styles.changeText}>Change</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Order Summary</Text>
                <View style={styles.card}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryText}>Subtotal</Text>
                        <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryText}>Delivery Fee</Text>
                        <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(2)}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryRow}>
                        <Text style={styles.totalText}>Total</Text>
                        <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Payment Method</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.paymentRow} onPress={() => setPaymentMethod('upi')}>
                        <View style={styles.paymentIconBox}><Feather name="smartphone" size={20} color={THEME.textDark} /></View>
                        <Text style={styles.paymentText}>UPI (GPay, PhonePe, Paytm)</Text>
                        <Feather name={paymentMethod === 'upi' ? "check-circle" : "circle"} size={22} color={paymentMethod === 'upi' ? THEME.primary : THEME.textMuted} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.paymentRow} onPress={() => setPaymentMethod('card')}>
                        <View style={styles.paymentIconBox}><Feather name="credit-card" size={20} color={THEME.textDark} /></View>
                        <Text style={styles.paymentText}>Credit / Debit Card</Text>
                        <Feather name={paymentMethod === 'card' ? "check-circle" : "circle"} size={22} color={paymentMethod === 'card' ? THEME.primary : THEME.textMuted} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.paymentRow} onPress={() => setPaymentMethod('cod')}>
                        <View style={styles.paymentIconBox}><Feather name="dollar-sign" size={20} color={THEME.textDark} /></View>
                        <Text style={styles.paymentText}>Cash on Delivery</Text>
                        <Feather name={paymentMethod === 'cod' ? "check-circle" : "circle"} size={22} color={paymentMethod === 'cod' ? THEME.primary : THEME.textMuted} />
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <View style={styles.footer}>
                <View style={styles.footerTextContainer}>
                    <Text style={styles.footerLabel}>Amount Payable</Text>
                    <Text style={styles.footerAmount}>₹{totalAmount.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder}>
                    <Text style={styles.placeOrderText}>Place Order</Text>
                </TouchableOpacity>
            </View>

            {/* --- UPDATED: MULTIPLE ADDRESS MODAL --- */}
            <Modal visible={isAddressModalVisible} animationType="slide" transparent={true} onRequestClose={() => setAddressModalVisible(false)}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>Delivery Address</Text>
                            <TouchableOpacity onPress={() => setAddressModalVisible(false)} style={{ padding: 4 }}>
                                <Feather name="x" size={24} color={THEME.textMuted} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            
                            {/* Render Array of Saved Addresses - FIX: Replaced && with ternary to avoid rendering '0' */}
                            {savedAddresses.length > 0 ? (
                                <View style={styles.addressSectionBlock}>
                                    <Text style={styles.inputLabel}>Saved Addresses</Text>
                                    
                                    {savedAddresses.map((addr, index) => {
                                        const isSelected = activeAddress === addr.fullAddress;
                                        return (
                                            <TouchableOpacity 
                                                key={addr._id || index}
                                                style={[
                                                    styles.savedAddressCard, 
                                                    isSelected && styles.savedAddressCardActive
                                                ]}
                                                onPress={() => {
                                                    setActiveAddress(addr.fullAddress);
                                                    setAddressModalVisible(false);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <View style={styles.iconBoxSmall}>
                                                    <Feather name="home" size={18} color={isSelected ? THEME.primary : THEME.textMuted} />
                                                </View>
                                                <View style={{ flex: 1 }}>
                                                    <Text style={styles.savedAddressText} numberOfLines={2}>{addr.fullAddress}</Text>
                                                </View>
                                                {isSelected && (
                                                    <Feather name="check-circle" size={20} color={THEME.primary} style={{ marginLeft: 12 }} />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                    
                                    <View style={styles.modalDivider} />
                                </View>
                            ) : null}

                            {/* Add New Address Form */}
                            <Text style={styles.inputLabel}>{savedAddresses.length > 0 ? 'Or Add a New Address' : 'Add New Address'}</Text>
                            
                            <TouchableOpacity style={styles.locationBtn} onPress={handleGetCurrentLocation}>
                                {isFetchingLocation ? (
                                    <ActivityIndicator size="small" color={THEME.primary} style={{ marginRight: 8 }} />
                                ) : (
                                    <Feather name="navigation" size={20} color={THEME.primary} style={{ marginRight: 8 }} />
                                )}
                                <Text style={styles.locationBtnText}>Pin Current Location</Text>
                            </TouchableOpacity>

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

                            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveNewAddress}>
                                <Text style={styles.modalSaveText}>Save & Use Address</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* RAZORPAY WEBVIEW MODAL */}
            <Modal 
                visible={!!paymentUrl} 
                animationType="slide" 
                onRequestClose={handleClosePayment} // <-- Handles Android physical back button
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={handleClosePayment} style={styles.backButton}> 
                            <Feather name="x" size={24} color={THEME.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Complete Payment</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    
                    {paymentUrl && (
                        <WebView 
                            source={{ uri: paymentUrl }} 
                            onNavigationStateChange={(navState) => {
                                if (navState.url.includes("example-callback-url.com/paymentsuccess")) {
                                    setPaymentUrl(null); 
                                    verifyPaymentOnBackend(navState.url); 
                                }
                            }}
                        />
                    )}
                </SafeAreaView>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: THEME.background },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark },
    scrollContent: { padding: 16, paddingBottom: 100 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.textDark, marginBottom: 12, marginTop: 8 },
    card: { backgroundColor: THEME.card, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
    
    addressRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    addressTextContainer: { flex: 1, paddingRight: 8 },
    addressLabel: { fontSize: 14, fontWeight: '700', color: THEME.textDark, marginBottom: 2 },
    addressValue: { fontSize: 13, color: THEME.textMuted, lineHeight: 18 },
    changeText: { color: THEME.primary, fontWeight: '600', fontSize: 14, padding: 8 },
    
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryText: { fontSize: 14, color: THEME.textMuted, fontWeight: '500' },
    summaryValue: { fontSize: 14, color: THEME.textDark, fontWeight: '600' },
    divider: { height: 1, backgroundColor: THEME.border, marginVertical: 12 },
    totalText: { fontSize: 16, color: THEME.textDark, fontWeight: '800' },
    totalValue: { fontSize: 18, color: THEME.primary, fontWeight: '800' },
    
    paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    paymentIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: THEME.background, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    paymentText: { flex: 1, fontSize: 15, fontWeight: '600', color: THEME.textDark },
    
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: THEME.card, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, borderColor: THEME.border, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
    footerTextContainer: { flex: 1 },
    footerLabel: { fontSize: 12, color: THEME.textMuted, fontWeight: '600', marginBottom: 2 },
    footerAmount: { fontSize: 20, fontWeight: '800', color: THEME.textDark },
    placeOrderBtn: { backgroundColor: THEME.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, shadowColor: THEME.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    placeOrderText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    
    // Address Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: THEME.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 20, maxHeight: '90%' },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark },
    
    inputLabel: { fontSize: 16, fontWeight: '700', color: THEME.textDark, marginBottom: 12, marginTop: 8 },
    inputSubLabel: { fontSize: 13, fontWeight: '600', color: THEME.textDark, marginBottom: 6, marginTop: 12 },
    
    addressSectionBlock: { marginBottom: 8 },
    savedAddressCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.background, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: THEME.border, marginBottom: 10 },
    savedAddressCardActive: { backgroundColor: THEME.surfaceActive, borderColor: THEME.primary },
    iconBoxSmall: { marginRight: 12 },
    savedAddressTitle: { fontSize: 14, fontWeight: '700', color: THEME.textDark, marginBottom: 4 },
    savedAddressText: { fontSize: 13, color: THEME.textMuted, lineHeight: 18 },
    modalDivider: { height: 1, backgroundColor: THEME.border, marginVertical: 10 },
    
    locationBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: THEME.surfaceActive, padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#D1FAE5' },
    locationBtnText: { color: THEME.primary, fontWeight: '700', fontSize: 15 },
    addressInput: { borderWidth: 1, borderColor: THEME.border, borderRadius: 10, padding: 12, fontSize: 15, color: THEME.textDark, backgroundColor: THEME.background },
    
    modalSaveBtn: { padding: 16, borderRadius: 12, backgroundColor: THEME.primary, alignItems: 'center', shadowColor: THEME.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, marginTop: 24 },
    modalSaveText: { color: '#FFF', fontWeight: '700', fontSize: 15 }
});