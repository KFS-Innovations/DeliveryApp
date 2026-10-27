import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView,
    ActivityIndicator,
    Image,
    StatusBar,
    Linking,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME = {
    primary: '#10B981',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    success: '#059669',
    warning: '#F59E0B',
    danger: '#EF4444' 
};

const STATUS_STEPS = [
    { id: 'Placed', label: 'Order Placed', desc: 'Waiting for seller approval' },
    { id: 'Preparing', label: 'Processing Order', desc: 'The seller is packing your items' },
    { id: 'Out for Delivery', label: 'Out for Delivery', desc: 'Your order is on the way' },
    { id: 'Delivered', label: 'Delivered', desc: 'Enjoy your purchase!' }
];

export default function OrderStatusScreen({ route, navigation }) {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderStatus();
        
        const interval = setInterval(() => {
            fetchOrderStatus();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const fetchOrderStatus = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const API_URL = process.env.EXPO_PUBLIC_IP 
                ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/order/${orderId}`
                : `http://192.168.0.107:5000/api/order/${orderId}`; 

            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log(token)
            const data = await response.json();

            if (data.success) {
                setOrder(data.order);
            }
        } catch (error) {
            console.error("Error fetching order status:", error);
        } finally {
            setLoading(false);
        }
    };

    const getActiveStepIndex = () => {
        if (!order) return 0;
        return STATUS_STEPS.findIndex(step => step.id === order.orderStatus);
    };

    const handleCallDriver = () => {
        if (order?.deliveryPartner?.phone) {
            Linking.openURL(`tel:${order.deliveryPartner.phone}`);
        }
    };

    const handleCallSeller = () => {
        const sellerPhone = order?.items?.[0]?.productId?.sellerPhone || '+919876543210';
        Linking.openURL(`tel:${sellerPhone}`).catch(err => {
            Alert.alert("Error", "Could not open phone dialer.");
        });
    };

    // --- NEW: Cancel Order Logic ---
    const executeCancelOrder = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const API_URL = process.env.EXPO_PUBLIC_IP 
                ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/order/${orderId}/status`
                : `http://192.168.0.107:5000/api/order/${orderId}/status`; 

            const response = await fetch(API_URL, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ orderStatus: 'Cancelled' })
            });
            const data = await response.json();

            if (data.success) {
                setOrder(data.order); // Instantly updates UI to show cancelled card
                Alert.alert("Order Cancelled", "Your order has been cancelled successfully.");
            } else {
                Alert.alert("Error", data.error || "Could not cancel order.");
            }
        } catch (error) {
            console.error("Cancel Order Error:", error);
            Alert.alert("Error", "Network error. Please try again.");
        }
    };

    // --- NEW: Help Menu Logic ---
    const handleHelpPress = () => {
        // Order can only be cancelled if it's still in the very first "Placed" step
        const canCancel = order?.orderStatus === 'Placed';
        
        const options = [
            { text: "Contact Support", onPress: () => Alert.alert("Support", "Please call 1800-123-4567") },
            { text: "Dismiss", style: "cancel" }
        ];

        // Inject the Cancel button only if allowed
        if (canCancel) {
            options.splice(1, 0, { 
                text: "Cancel Order", 
                style: "destructive", 
                onPress: () => {
                    Alert.alert(
                        "Cancel Order", 
                        "Are you sure you want to cancel this order?",
                        [
                            { text: "No", style: "cancel" },
                            { text: "Yes, Cancel", style: "destructive", onPress: executeCancelOrder }
                        ]
                    );
                } 
            });
        }

        Alert.alert(
            "Need Help?",
            canCancel ? "What would you like to do?" : "This order is already being processed and cannot be cancelled. Contact support for help.",
            options
        );
    };

    if (loading || !order) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.primary} />
                <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
        );
    }

    const isCancelled = order.orderStatus === 'Cancelled';
    const activeStepIndex = getActiveStepIndex();
    
    const shopName = order?.items?.[0]?.productId?.shop || "Official Store";
    const shopPhone = order?.items?.[0]?.productId?.sellerPhone || "+91 98765 43210";

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={THEME.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #{order._id.substring(order._id.length - 6).toUpperCase()}</Text>
                {/* --- UPDATED: Help Button Action --- */}
                <TouchableOpacity style={styles.helpButton} onPress={handleHelpPress}>
                    <Text style={styles.helpText}>Help</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {isCancelled ? (
                    <View style={styles.cancelledCard}>
                        <View style={styles.cancelledIconBox}>
                            <Feather name="x-circle" size={40} color={THEME.danger} />
                        </View>
                        <Text style={styles.cancelledTitle}>Order Cancelled</Text>
                        <Text style={styles.cancelledDesc}>
                            This order was cancelled. If you made a payment, the refund will be initiated automatically.
                        </Text>
                        <View style={styles.amountBadge}>
                            <Text style={styles.amountText}>Amount: ₹{order.totalAmount}</Text>
                        </View>
                    </View>
                ) : (
                    <>
                        <View style={styles.etaCard}>
                            <View style={styles.etaHeader}>
                                <Feather name="clock" size={24} color={THEME.primary} />
                                <Text style={styles.etaTitle}>
                                    {order.orderStatus === 'Delivered' ? 'Delivered Successfully' : 'Estimated Arrival'}
                                </Text>
                            </View>
                            {order.orderStatus !== 'Delivered' && (
                                <Text style={styles.etaTime}>15 - 20 mins</Text>
                            )}
                            <View style={styles.amountBadge}>
                                <Text style={styles.amountText}>{order.paymentMethod === 'cod' ? 'To Pay:' : 'Paid:'} ₹{order.totalAmount}</Text>
                            </View>
                        </View>

                        <View style={styles.card}>
                            <Text style={styles.sectionTitle}>Tracking Status</Text>
                            <View style={styles.timelineContainer}>
                                {STATUS_STEPS.map((step, index) => {
                                    const isCompleted = index <= activeStepIndex;
                                    const isCurrent = index === activeStepIndex;
                                    const isLast = index === STATUS_STEPS.length - 1;

                                    return (
                                        <View key={step.id} style={styles.timelineRow}>
                                            <View style={styles.timelineGraphic}>
                                                <View style={[
                                                    styles.timelineDot,
                                                    isCompleted ? styles.timelineDotActive : styles.timelineDotInactive,
                                                    isCurrent && styles.timelineDotCurrent
                                                ]}>
                                                    {isCompleted && <Feather name="check" size={12} color="#FFF" />}
                                                </View>
                                                {!isLast && (
                                                    <View style={[
                                                        styles.timelineLine,
                                                        index < activeStepIndex ? styles.timelineLineActive : styles.timelineLineInactive
                                                    ]} />
                                                )}
                                            </View>
                                            <View style={styles.timelineTextContainer}>
                                                <Text style={[styles.timelineLabel, isCompleted ? styles.textDark : styles.textMuted]}>
                                                    {step.label}
                                                </Text>
                                                <Text style={styles.timelineDesc}>{step.desc}</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        <View style={styles.sellerCard}>
                            <View style={styles.sellerInfo}>
                                <View style={styles.sellerAvatar}>
                                    <Feather name="shopping-bag" size={20} color={THEME.primary} />
                                </View>
                                <View>
                                    <Text style={styles.sellerName}>{shopName}</Text>
                                    <Text style={styles.sellerPhoneText}>{shopPhone}</Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.sellerCallBtn} onPress={handleCallSeller}>
                                <Feather name="phone-call" size={16} color={THEME.textDark} />
                                <Text style={styles.sellerCallText}>Call</Text>
                            </TouchableOpacity>
                        </View>

                        {order.deliveryPartner?.name && (
                            <View style={styles.driverCard}>
                                <Image 
                                    source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=80' }} 
                                    style={styles.driverPic} 
                                />
                                <View style={styles.driverInfo}>
                                    <Text style={styles.driverName}>{order.deliveryPartner.name}</Text>
                                    
                                    <View style={styles.ratingRow}>
                                        <Text style={styles.driverRole}>Delivery Partner</Text>
                                        <View style={styles.dotSeparator} />
                                        <Feather name="star" size={12} color={THEME.warning} />
                                        <Text style={styles.ratingText}>4.8</Text>
                                    </View>

                                    <View style={styles.phoneRow}>
                                        <Feather name="phone" size={12} color="#94A3B8" />
                                        <Text style={styles.driverPhone}>{order.deliveryPartner.phone}</Text>
                                    </View>
                                </View>
                                <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
                                    <Feather name="phone-call" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}

                <View style={[styles.card, { marginTop: 20 }]}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    
                    {order.items?.map((item, index) => {
                        const product = item.productId;
                        if (!product) return null; 
                        
                        const lineTotal = (item.price * item.quantity).toFixed(2);

                        return (
                            <View key={index} style={styles.orderItemRow}>
                                <Image source={{ uri: product.image }} style={styles.orderItemImage} />
                                <View style={styles.orderItemDetails}>
                                    <Text style={styles.orderItemName} numberOfLines={1}>{product.name}</Text>
                                    <Text style={styles.orderItemQty}>Qty: {item.quantity}</Text>
                                </View>
                                <Text style={styles.orderItemPrice}>₹{lineTotal}</Text>
                            </View>
                        );
                    })}

                    <View style={styles.summaryDivider} />

                    {(() => {
                        const itemsTotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
                        const deliveryFee = order.totalAmount - itemsTotal;
                        const displayDeliveryFee = deliveryFee > 0.01 ? `₹${deliveryFee.toFixed(2)}` : 'Free';

                        return (
                            <>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Payment Method</Text>
                                    <Text style={styles.summaryValue}>
                                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                                    </Text>
                                </View>
                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Delivery Fee</Text>
                                    <Text style={[styles.summaryValue, displayDeliveryFee === 'Free' && { color: THEME.primary }]}>
                                        {displayDeliveryFee}
                                    </Text>
                                </View>
                                
                                <View style={styles.summaryTotalRow}>
                                    <Text style={styles.summaryTotalLabel}>Total</Text>
                                    <Text style={styles.summaryTotalValue}>₹{order.totalAmount}</Text>
                                </View>
                            </>
                        );
                    })()}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
    loadingText: { marginTop: 12, color: THEME.textMuted, fontWeight: '500' },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15 },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: THEME.textDark },
    helpButton: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 8 },
    helpText: { fontSize: 13, fontWeight: '600', color: THEME.textDark },
    
    scrollContent: { padding: 16, paddingBottom: 40 },
    
    card: { backgroundColor: THEME.card, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
    
    etaCard: { backgroundColor: THEME.card, borderRadius: 16, padding: 24, marginBottom: 20, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    etaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    etaTitle: { fontSize: 15, fontWeight: '600', color: THEME.textMuted, marginLeft: 8 },
    etaTime: { fontSize: 32, fontWeight: '800', color: THEME.textDark, marginBottom: 16 },
    amountBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    amountText: { fontSize: 14, fontWeight: '700', color: THEME.primary },
    
    cancelledCard: { backgroundColor: '#FEF2F2', borderRadius: 16, padding: 24, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: '#FECACA' },
    cancelledIconBox: { marginBottom: 16 },
    cancelledTitle: { fontSize: 20, fontWeight: '800', color: THEME.danger, marginBottom: 8 },
    cancelledDesc: { fontSize: 14, color: '#991B1B', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
    
    sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.textDark, marginBottom: 20 },
    
    timelineContainer: { marginTop: 8 },
    timelineRow: { flexDirection: 'row', minHeight: 60 },
    timelineGraphic: { width: 30, alignItems: 'center' },
    timelineDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', zIndex: 2, backgroundColor: THEME.card },
    timelineDotActive: { backgroundColor: THEME.primary },
    timelineDotInactive: { backgroundColor: THEME.border, borderWidth: 4, borderColor: THEME.card },
    timelineDotCurrent: { borderWidth: 4, borderColor: '#D1FAE5', backgroundColor: THEME.primary },
    timelineLine: { width: 2, flex: 1, marginTop: -4, marginBottom: -4, zIndex: 1 },
    timelineLineActive: { backgroundColor: THEME.primary },
    timelineLineInactive: { backgroundColor: THEME.border },
    
    timelineTextContainer: { flex: 1, marginLeft: 16, paddingBottom: 30 },
    timelineLabel: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
    timelineDesc: { fontSize: 13, color: THEME.textMuted, lineHeight: 18 },
    textDark: { color: THEME.textDark },
    textMuted: { color: THEME.textMuted },

    sellerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.card, padding: 16, borderRadius: 16, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
    sellerInfo: { flexDirection: 'row', alignItems: 'center' },
    sellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    sellerName: { fontSize: 15, fontWeight: '700', color: THEME.textDark },
    sellerPhoneText: { fontSize: 13, color: THEME.textMuted, marginTop: 2, fontWeight: '500' },
    sellerCallBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: THEME.border },
    sellerCallText: { fontSize: 13, fontWeight: '700', color: THEME.textDark, marginLeft: 6 },

    driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.textDark, borderRadius: 16, padding: 16, marginTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    driverPic: { width: 54, height: 54, borderRadius: 27, marginRight: 16, borderWidth: 2, borderColor: '#334155' },
    driverInfo: { flex: 1, justifyContent: 'center' },
    driverName: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    driverRole: { fontSize: 12, color: '#94A3B8' },
    dotSeparator: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#475569', marginHorizontal: 6 },
    ratingText: { fontSize: 12, fontWeight: '700', color: '#FFF', marginLeft: 4 },
    phoneRow: { flexDirection: 'row', alignItems: 'center' },
    driverPhone: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginLeft: 6, letterSpacing: 0.5 },
    callButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center' },

    orderItemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    orderItemImage: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F1F5F9', marginRight: 12 },
    orderItemDetails: { flex: 1, justifyContent: 'center' },
    orderItemName: { fontSize: 15, fontWeight: '600', color: THEME.textDark, marginBottom: 4 },
    orderItemQty: { fontSize: 13, color: THEME.textMuted },
    orderItemPrice: { fontSize: 15, fontWeight: '700', color: THEME.textDark },
    
    summaryDivider: { height: 1, backgroundColor: THEME.border, marginVertical: 16 },
    
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { fontSize: 14, color: THEME.textMuted },
    summaryValue: { fontSize: 14, fontWeight: '600', color: THEME.textDark },
    
    summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: THEME.border, borderStyle: 'dashed' },
    summaryTotalLabel: { fontSize: 16, fontWeight: '800', color: THEME.textDark },
    summaryTotalValue: { fontSize: 18, fontWeight: '900', color: THEME.primary }
});