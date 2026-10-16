import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    FlatList, 
    ActivityIndicator, 
    Image, 
    StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const THEME = {
    primary: '#10B981',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    success: '#059669',
    warning: '#F59E0B',
    danger: '#EF4444'
};

export default function OrdersScreen({ navigation }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Active');

    useFocusEffect(
        useCallback(() => {
            fetchOrders();
        }, [])
    );

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('authToken');
            const API_URL = process.env.EXPO_PUBLIC_IP 
                ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/order/history`
                : `http://192.168.0.107:5000/api/order/history`;

            const response = await fetch(API_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const activeOrders = orders.filter(o => ['Placed', 'Preparing', 'Out for Delivery'].includes(o.orderStatus));
    const pastOrders = orders.filter(o => ['Delivered', 'Cancelled'].includes(o.orderStatus));

    const displayedOrders = activeTab === 'Active' ? activeOrders : pastOrders;

    const getStatusColor = (status) => {
        if (status === 'Delivered') return THEME.success;
        if (status === 'Cancelled') return THEME.danger;
        if (status === 'Out for Delivery') return THEME.warning;
        return THEME.primary;
    };

    const renderOrderItem = ({ item }) => {
        const firstProduct = item.items[0]?.productId;
        const extraItemsCount = item.items.length - 1;

        return (
            <TouchableOpacity 
                style={styles.orderCard} 
                activeOpacity={0.7}
                onPress={() => navigation.navigate('OrderStatus', { orderId: item._id })}
            >
                <View style={styles.cardHeader}>
                    <Text style={styles.orderIdText}>Order #{item._id.substring(item._id.length - 6).toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.orderStatus) + '1A' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(item.orderStatus) }]}>
                            {item.orderStatus}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.imageContainer}>
                        {firstProduct?.image ? (
                            <Image source={{ uri: firstProduct.image }} style={styles.productImage} />
                        ) : (
                            <View style={[styles.productImage, styles.placeholderImage]}>
                                <Feather name="shopping-bag" size={24} color={THEME.textMuted} />
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.orderDetails}>
                        <Text style={styles.productName} numberOfLines={1}>
                            {firstProduct?.name || 'Deleted Product'}
                        </Text>
                        <Text style={styles.extraItemsText}>
                            {extraItemsCount > 0 ? `+ ${extraItemsCount} more item${extraItemsCount > 1 ? 's' : ''}` : '1 Item'}
                        </Text>
                        <Text style={styles.dateText}>
                            {new Date(item.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>

                    <View style={styles.priceContainer}>
                        <Text style={styles.totalPrice}>₹{item.totalAmount}</Text>
                        <Feather name="chevron-right" size={20} color={THEME.textMuted} style={{ marginTop: 4 }} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={THEME.surface} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={THEME.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Orders</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'Active' && styles.activeTab]} 
                    onPress={() => setActiveTab('Active')}
                >
                    <Text style={[styles.tabText, activeTab === 'Active' && styles.activeTabText]}>
                        Active ({activeOrders.length})
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'Past' && styles.activeTab]} 
                    onPress={() => setActiveTab('Past')}
                >
                    <Text style={[styles.tabText, activeTab === 'Past' && styles.activeTabText]}>
                        Past Orders
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={THEME.primary} />
                </View>
            ) : displayedOrders.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Feather name="package" size={60} color={THEME.border} style={{ marginBottom: 16 }} />
                    <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} orders yet</Text>
                    <Text style={styles.emptySub}>When you place an order, it will appear here.</Text>
                </View>
            ) : (
                <FlatList 
                    data={displayedOrders}
                    keyExtractor={(item) => item._id}
                    renderItem={renderOrderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: THEME.card },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark },
    
    tabContainer: { flexDirection: 'row', backgroundColor: THEME.card, paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: THEME.border },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: THEME.primary },
    tabText: { fontSize: 15, fontWeight: '600', color: THEME.textMuted },
    activeTabText: { color: THEME.primary },
    
    listContent: { padding: 16, paddingBottom: 40 },
    
    orderCard: { backgroundColor: THEME.card, borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: THEME.border },
    orderIdText: { fontSize: 14, fontWeight: '700', color: THEME.textDark },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 12, fontWeight: '700' },
    
    cardBody: { flexDirection: 'row', alignItems: 'center' },
    imageContainer: { marginRight: 16 },
    productImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F1F5F9' },
    placeholderImage: { justifyContent: 'center', alignItems: 'center' },
    
    orderDetails: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '600', color: THEME.textDark, marginBottom: 4 },
    extraItemsText: { fontSize: 13, color: THEME.textMuted, marginBottom: 4 },
    dateText: { fontSize: 12, color: THEME.textMuted },
    
    priceContainer: { alignItems: 'flex-end', justifyContent: 'center' },
    totalPrice: { fontSize: 16, fontWeight: '700', color: THEME.textDark },
    
    emptyTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark, marginBottom: 8 },
    emptySub: { fontSize: 14, color: THEME.textMuted, textAlign: 'center' }
});