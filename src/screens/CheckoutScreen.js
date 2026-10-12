import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator,
    StatusBar,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Matching your exact app theme
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
    const [deliveryFee, setDeliveryFee] = useState(40); // Fixed delivery fee (₹40)
    const [paymentMethod, setPaymentMethod] = useState('cod'); // Default to Cash on Delivery
    const [address, setAddress] = useState("Fetching your location...");

    useEffect(() => {
        fetchCheckoutData();
    }, []);

    const fetchCheckoutData = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            
            // 1. Fetch Cart Total (Reusing your existing cart endpoint)
            const CART_API_URL = process.env.EXPO_PUBLIC_IP 
                ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/cart`
                : 'http://192.168.0.107:5000/api/cart';

            const cartRes = await fetch(CART_API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const cartData = await cartRes.json();
            
            if (cartData.items) {
                const total = cartData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                setSubtotal(total);
            }

            // 2. Fetch User Address (Optional: Hook this up to your new /api/user endpoint later)
            // For now, we'll set a placeholder based on our recent location work
            setAddress("Trivandrum, Kerala, India"); 

        } catch (error) {
            console.error("Failed to load checkout details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePlaceOrder = async () => {
        // You will create an /api/orders endpoint in Node.js to handle this later
        Alert.alert(
            "Order Placed!", 
            "Your delicious food is on the way.",
            [{ text: "Awesome", onPress: () => navigation.navigate('Home') }]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.primary} />
            </View>
        );
    }

    const totalAmount = subtotal + deliveryFee;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={THEME.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Delivery Address Section */}
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

                {/* Order Summary Section */}
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

                {/* Payment Options Section */}
                <Text style={styles.sectionTitle}>Payment Method</Text>
                <View style={styles.card}>
                    {/* UPI Option */}
                    <TouchableOpacity 
                        style={styles.paymentRow} 
                        onPress={() => setPaymentMethod('upi')}
                    >
                        <View style={styles.paymentIconBox}>
                            <Feather name="smartphone" size={20} color={THEME.textDark} />
                        </View>
                        <Text style={styles.paymentText}>UPI (GPay, PhonePe, Paytm)</Text>
                        <Feather 
                            name={paymentMethod === 'upi' ? "check-circle" : "circle"} 
                            size={22} 
                            color={paymentMethod === 'upi' ? THEME.primary : THEME.textMuted} 
                        />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* Card Option */}
                    <TouchableOpacity 
                        style={styles.paymentRow} 
                        onPress={() => setPaymentMethod('card')}
                    >
                        <View style={styles.paymentIconBox}>
                            <Feather name="credit-card" size={20} color={THEME.textDark} />
                        </View>
                        <Text style={styles.paymentText}>Credit / Debit Card</Text>
                        <Feather 
                            name={paymentMethod === 'card' ? "check-circle" : "circle"} 
                            size={22} 
                            color={paymentMethod === 'card' ? THEME.primary : THEME.textMuted} 
                        />
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* Cash on Delivery Option */}
                    <TouchableOpacity 
                        style={styles.paymentRow} 
                        onPress={() => setPaymentMethod('cod')}
                    >
                        <View style={styles.paymentIconBox}>
                            <Feather name="dollar-sign" size={20} color={THEME.textDark} />
                        </View>
                        <Text style={styles.paymentText}>Cash on Delivery</Text>
                        <Feather 
                            name={paymentMethod === 'cod' ? "check-circle" : "circle"} 
                            size={22} 
                            color={paymentMethod === 'cod' ? THEME.primary : THEME.textMuted} 
                        />
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* Bottom Sticky Footer */}
            <View style={styles.footer}>
                <View style={styles.footerTextContainer}>
                    <Text style={styles.footerLabel}>Amount Payable</Text>
                    <Text style={styles.footerAmount}>₹{totalAmount.toFixed(2)}</Text>
                </View>
                <TouchableOpacity style={styles.placeOrderBtn} onPress={handlePlaceOrder}>
                    <Text style={styles.placeOrderText}>Place Order</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
    
    // Header
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: THEME.background },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark },
    
    scrollContent: { padding: 16, paddingBottom: 100 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.textDark, marginBottom: 12, marginTop: 8 },
    
    // Cards
    card: { backgroundColor: THEME.card, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
    
    // Address
    addressRow: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    addressTextContainer: { flex: 1 },
    addressLabel: { fontSize: 14, fontWeight: '700', color: THEME.textDark, marginBottom: 2 },
    addressValue: { fontSize: 13, color: THEME.textMuted, lineHeight: 18 },
    changeText: { color: THEME.primary, fontWeight: '600', fontSize: 14, padding: 8 },
    
    // Summary
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryText: { fontSize: 14, color: THEME.textMuted, fontWeight: '500' },
    summaryValue: { fontSize: 14, color: THEME.textDark, fontWeight: '600' },
    divider: { height: 1, backgroundColor: THEME.border, marginVertical: 12 },
    totalText: { fontSize: 16, color: THEME.textDark, fontWeight: '800' },
    totalValue: { fontSize: 18, color: THEME.primary, fontWeight: '800' },
    
    // Payment
    paymentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
    paymentIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: THEME.background, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    paymentText: { flex: 1, fontSize: 15, fontWeight: '600', color: THEME.textDark },
    
    // Footer
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: THEME.card, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, borderTopWidth: 1, borderColor: THEME.border, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 10 },
    footerTextContainer: { flex: 1 },
    footerLabel: { fontSize: 12, color: THEME.textMuted, fontWeight: '600', marginBottom: 2 },
    footerAmount: { fontSize: 20, fontWeight: '800', color: THEME.textDark },
    placeOrderBtn: { backgroundColor: THEME.primary, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, shadowColor: THEME.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    placeOrderText: { color: '#FFF', fontWeight: '700', fontSize: 16 }
});