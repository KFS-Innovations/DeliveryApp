import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    Image, 
    ActivityIndicator,
    StatusBar,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const COLORS = {
    primary: '#10B981',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    border: '#F1F5F9',
    disabled: '#94A3B8'
};

// Helper to read store open status across common cart item shapes
const isCartItemShopOpen = (item) => {
    if (typeof item?.sellerId?.isOpen === 'boolean') return item.sellerId.isOpen;
    if (typeof item?.isStoreOpen === 'boolean') return item.isStoreOpen;
    if (typeof item?.shopOpen === 'boolean') return item.shopOpen;
    return true;
};

const getCartItemShopName = (item) => {
    return item?.sellerId?.shopName || item?.shopName || 'This shop';
};

export default function CartScreen({ navigation }) {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);

    useFocusEffect(
        useCallback(() => {
            fetchCart();
        }, [])
    );

    const fetchCart = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const activeLat = await AsyncStorage.getItem('activeLat');
            const activeLng = await AsyncStorage.getItem('activeLng');

            const ip = process.env.EXPO_PUBLIC_IP?.trim();
            const API_URL = ip
                ? `http://${ip}:5000/api/cart?lat=${activeLat}&lng=${activeLng}`
                : `http://192.168.0.107:5000/api/cart?lat=${activeLat}&lng=${activeLng}`;

            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const textResponse = await response.text(); 
            const data = JSON.parse(textResponse);
            const latestItems = data.items || [];
            
            setCartItems(latestItems);
            calculateTotal(latestItems);
            return latestItems;
        } catch (error) {
            console.error("Failed to fetch cart:", error);
            return cartItems;
        } finally {
            setLoading(false);
        }
    };

    const handleProceedToCheckout = async () => {
        const latestItems = await fetchCart();
        const closedItems = latestItems.filter((item) => !isCartItemShopOpen(item));

        if (closedItems.length > 0) {
            const closedShopNames = [...new Set(closedItems.map(getCartItemShopName))].join(', ');
            Alert.alert(
                'Store Currently Closed',
                `${closedShopNames} ${closedItems.length > 1 ? 'are' : 'is'} closed right now and cannot accept orders. Please remove the closed item(s) to proceed to checkout.`
            );
            return;
        }

        navigation.navigate('Checkout');
    };

    const calculateTotal = (items) => {
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        setTotalPrice(total);
    };

    const updateQuantity = async (productId, newQuantity) => {
        if (newQuantity < 1) return; 

        const updatedItems = cartItems.map(item => 
            item.productId === productId ? { ...item, quantity: newQuantity } : item
        );
        setCartItems(updatedItems);
        calculateTotal(updatedItems);

        try {
            const token = await AsyncStorage.getItem('authToken');
            const ip = process.env.EXPO_PUBLIC_IP?.trim();
            const API_URL = ip 
                ? `http://${ip}:5000/api/cart/update`
                : 'http://192.168.0.107:5000/api/cart/update';

            await fetch(API_URL, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ productId, quantity: newQuantity })
            });
        } catch (error) {
            console.error("Backend quantity update failed", error);
            fetchCart(); 
        }
    };

    const removeItem = async (productId) => {
        const updatedItems = cartItems.filter(item => item.productId !== productId);
        setCartItems(updatedItems);
        calculateTotal(updatedItems);

        try {
            const token = await AsyncStorage.getItem('authToken');
            const ip = process.env.EXPO_PUBLIC_IP?.trim();
            const API_URL = ip 
                ? `http://${ip}:5000/api/cart/remove/${productId}`
                : `http://192.168.0.107:5000/api/cart/remove/${productId}`;

            await fetch(API_URL, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Item removal failed", error);
            fetchCart(); 
        }
    };

    const hasClosedShopItems = cartItems.some((item) => !isCartItemShopOpen(item));

    const renderItem = ({ item }) => {
        const shopOpen = isCartItemShopOpen(item);

        return (
            <View style={[styles.cartItem, !shopOpen && styles.closedCartItem]}>
                <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
                <View style={styles.itemDetails}>
                    <View style={styles.titleRow}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                        <TouchableOpacity onPress={() => removeItem(item.productId)} style={styles.removeBtn}>
                            <Feather name="trash-2" size={18} color={COLORS.danger} />
                        </TouchableOpacity>
                    </View>

                    {!shopOpen && (
                        <View style={styles.closedBadge}>
                            <Text style={styles.closedBadgeText}>
                                {getCartItemShopName(item)} is currently closed
                            </Text>
                        </View>
                    )}

                    <Text style={styles.itemPrice}>₹{item.price ? item.price.toFixed(2) : '0.00'}</Text>
                    <View style={styles.quantityContainer}>
                        <TouchableOpacity 
                            onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                            style={styles.qtyBtn}
                            disabled={!shopOpen}
                        >
                            <Feather name="minus" size={16} color={COLORS.textDark} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity 
                            onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                            style={styles.qtyBtn}
                            disabled={!shopOpen}
                        >
                            <Feather name="plus" size={16} color={COLORS.textDark} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="chevron-left" size={28} color={COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Cart</Text>
                <View style={{ width: 44 }} />
            </View>
            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                        <Feather name="shopping-bag" size={48} color={COLORS.textMuted} />
                    </View>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptyText}>Looks like you haven't added anything to your cart yet.</Text>
                    <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.goBack('MainTabs')}>
                        <Text style={styles.browseText}>Start Shopping</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.flexContainer}>
                    <FlatList
                        data={cartItems}
                        keyExtractor={(item) => item.productId.toString()}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                        showsVerticalScrollIndicator={false}
                    />
                    <View style={styles.footer}>
                        {hasClosedShopItems && (
                            <Text style={styles.footerWarning}>
                                One or more shops in your cart are closed. Remove closed items before checkout.
                            </Text>
                        )}
                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalPrice}>₹{totalPrice.toFixed(2)}</Text>
                        </View>
                        <TouchableOpacity 
                            style={[styles.checkoutBtn, hasClosedShopItems && styles.checkoutBtnDisabled]} 
                            onPress={handleProceedToCheckout}
                        >
                            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
                            <Feather name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: COLORS.background 
    },
    flexContainer: { flex: 1 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textDark },
    listContainer: { padding: 16, paddingBottom: 150 },
    cartItem: { 
        flexDirection: 'row', 
        backgroundColor: COLORS.card, 
        padding: 12, 
        marginBottom: 16, 
        borderRadius: 20, 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2
    },
    closedCartItem: {
        opacity: 0.7,
        borderWidth: 1,
        borderColor: '#FECACA'
    },
    closedBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.dangerLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 4
    },
    closedBadgeText: {
        color: COLORS.danger,
        fontSize: 11,
        fontWeight: '700'
    },
    productImage: { width: 90, height: 90, borderRadius: 16, backgroundColor: COLORS.border },
    itemDetails: { flex: 1, marginLeft: 16 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, flex: 1, marginRight: 8, lineHeight: 22 },
    removeBtn: { backgroundColor: COLORS.dangerLight, padding: 8, borderRadius: 12, marginTop: -4, marginRight: -4 },
    itemPrice: { fontSize: 16, color: COLORS.primary, fontWeight: '800', marginTop: 4, marginBottom: 12 },
    quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: 12, alignSelf: 'flex-start', padding: 4 },
    qtyBtn: { padding: 8, backgroundColor: COLORS.card, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    qtyText: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, paddingHorizontal: 16 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textDark, marginBottom: 8 },
    emptyText: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
    browseBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center' },
    browseText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
    footer: { 
        position: 'absolute',
        bottom: 0, 
        left: 0, 
        right: 0, 
        backgroundColor: COLORS.card, 
        paddingHorizontal: 24, 
        paddingTop: 20,
        paddingBottom: 32,
        borderTopWidth: 1, 
        borderColor: COLORS.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
        elevation: 10
    },
    footerWarning: {
        color: COLORS.danger,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 10
    },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    totalLabel: { fontSize: 15, color: COLORS.textMuted, fontWeight: '600' },
    totalPrice: { fontSize: 24, fontWeight: '900', color: COLORS.textDark },
    checkoutBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingVertical: 18, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    checkoutBtnDisabled: {
        backgroundColor: COLORS.disabled,
        shadowOpacity: 0,
        elevation: 0
    },
    checkoutText: { color: '#FFF', fontWeight: '800', fontSize: 16 }
});