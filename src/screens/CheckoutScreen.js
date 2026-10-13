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
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview'; 

const THEME = {
    primary: '#10B981',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    success: '#059669'
};

export default function CheckoutScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [subtotal, setSubtotal] = useState(0);
    const [deliveryFee, setDeliveryFee] = useState(40);
    const [paymentMethod, setPaymentMethod] = useState('cod'); 
    const [address, setAddress] = useState("Trivandrum, Kerala, India");
    const [paymentUrl, setPaymentUrl] = useState(null);

    useEffect(() => {
        fetchCheckoutData();
    }, []);

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

    const totalAmount = subtotal + deliveryFee;

    // --- NEW: Function to actually place the order in MongoDB ---
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
                    deliveryAddress: address,
                    totalAmount: totalAmount
                })
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert(
                    "Order Placed!", 
                    "Your delicious food is on the way.",
                    [{ text: "Awesome", onPress: () => navigation.navigate('Home') }]
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
        if (paymentMethod === 'upi' || paymentMethod === 'card') {
            try {
                const API_URL = `http://${process.env.EXPO_PUBLIC_IP}:5000/api/payment/generate-link`;
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: totalAmount }) 
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
            // If COD, just save the order to DB immediately
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
                // If Razorpay signature is valid, NOW save the order to DB
                finalizeOrderInDB(); 
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
                            <Text style={styles.addressLabel}>Home</Text>
                            <Text style={styles.addressValue} numberOfLines={2}>{address}</Text>
                        </View>
                        <TouchableOpacity>
                            <Text style={styles.changeText}>Edit</Text>
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

            <Modal visible={!!paymentUrl} animationType="slide" onRequestClose={() => setPaymentUrl(null)}>
                <SafeAreaView style={{ flex: 1, backgroundColor: THEME.background }}>
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => setPaymentUrl(null)} style={styles.backButton}>
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
    addressTextContainer: { flex: 1 },
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
    placeOrderText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});