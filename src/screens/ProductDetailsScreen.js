import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Alert,
  Linking,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../components/theme';

const { width } = Dimensions.get('window');

const getUnitConfig = (category) => {
  switch (category?.toLowerCase()) {
    case 'veg':
    case 'fruits':
    case 'meat':
    case 'fish':
      return { unit: 'kg', step: 0.5, min: 0.5 };
    case 'dairy':
      return { unit: 'L', step: 1, min: 1 };
    case 'coconuts':
    default:
      return { unit: 'pcs', step: 1, min: 1 };
  }
};

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params;
  
  const [otherProducts, setOtherProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  const unitConfig = getUnitConfig(product.category);
  const [quantity, setQuantity] = useState(unitConfig.min);

  useEffect(() => {
    const fetchOtherProducts = async () => {
      const API_URL = process.env.EXPO_PUBLIC_IP 
        ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/products`
        : 'http://192.168.0.107:5000/api/products';

      try {
        const token = await AsyncStorage.getItem('authToken');
        const response = await fetch(API_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (Array.isArray(data)) {
            const filteredData = data.filter(item => item._id !== product._id);
            setOtherProducts(filteredData.slice(0, 8)); 
        }
      } catch (error) {
        console.error("Error fetching other products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOtherProducts();
  }, [product]);

  const increment = () => setQuantity(prev => prev + unitConfig.step);
  const decrement = () => setQuantity(prev => (prev > unitConfig.min ? prev - unitConfig.step : unitConfig.min));

  const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0;
  const currencySymbol = product.price.replace(/[0-9.]/g, '') || '₹';
  const totalPrice = (numericPrice * quantity).toFixed(2);

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      // 1. Retrieve the stored coordinates from AsyncStorage
      const activeLat = await AsyncStorage.getItem('activeLat');
      const activeLng = await AsyncStorage.getItem('activeLng');

      // 2. Validate that coordinates exist before proceeding
      if (!activeLat || !activeLng || activeLat === 'null' || activeLng === 'null') {
          setIsAddingToCart(false);
          return Alert.alert(
              "Delivery Address Required", 
              "Please select or pin a delivery address before adding items to your cart.",
              [
                  { text: "Cancel", style: "cancel" },
                  { 
                      text: "Select Address", 
                      onPress: () => navigation.navigate('SavedAddresses') 
                  }
              ]
          );
      }

      const API_URL = process.env.EXPO_PUBLIC_IP 
        ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/cart/add`
        : 'http://192.168.0.107:5000/api/cart/add';

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: quantity,
          userLat: parseFloat(activeLat), // Sent as a number for backend Haversine formula
          userLng: parseFloat(activeLng)
        })
      });

      const data = await response.json();

      if (data.success === false) {
          setErrorMessage(data.error || "Delivery unavailable for this item.");
          setShowErrorModal(true); 
          return;
      }

      if (!response.ok) {
          setErrorMessage(data.error || "Could not add item to cart.");
          setShowErrorModal(true); 
          return;
      }

      navigation.navigate('Cart');

    } catch (error) {
      console.error("Fetch Error:", error);
      setErrorMessage("Network Error. Could not connect to the server.");
      setShowErrorModal(true);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleContactSeller = () => {
    const sellerPhone = product.sellerPhone || '+919876543210'; 
    Linking.openURL(`tel:${sellerPhone}`).catch(err => {
      Alert.alert("Error", "Could not open phone dialer.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <Feather name="chevron-left" size={28} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        
        {/* REPLACED HEART ICON WITH EMPTY PLACEHOLDER TO KEEP TITLE CENTERED */}
        <View style={styles.headerIconBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.imageWrapper}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
        </View>

        <View style={styles.titleArea}>
          <View style={styles.titleColumn}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.shopName}>By {product.shop}</Text>
          </View>
          
          <View style={styles.qtyBox}>
            <TouchableOpacity onPress={decrement} style={styles.qtyBtn}>
              <Feather name="minus" size={18} color={COLORS.textDark} />
            </TouchableOpacity>
            
            <Text style={styles.qtyText}>{quantity} {unitConfig.unit}</Text>
            
            <TouchableOpacity onPress={increment} style={styles.qtyBtn}>
              <Feather name="plus" size={18} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star" size={20} color="#D97706" />
            </View>
            <Text style={styles.infoValue}>{product.rating || "4.8"}</Text>
            <Text style={styles.infoLabel}>{product.reviews || "120"} Reviews</Text>
          </View>
          
          <View style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Feather name="clock" size={20} color="#0369A1" />
            </View>
            <Text style={styles.infoValue}>{product.time || "30m"}</Text>
            <Text style={styles.infoLabel}>Delivery</Text>
          </View>
          
          <View style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#DCFCE7' }]}>
              <Feather name="truck" size={20} color="#15803D" />
            </View>
            <Text style={styles.infoValue}>Free</Text>
            <Text style={styles.infoLabel}>Shipping</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this item</Text>
          <Text style={styles.descriptionText}>
            {product.description || "Premium quality product carefully selected for you. Enjoy the fresh taste and standard delivery to your doorstep."}
          </Text>
        </View>

        <View style={styles.sellerCard}>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerAvatar}>
              <Feather name="shield" size={20} color={COLORS.primary} />
            </View>
            <View>
              <Text style={styles.sellerName}>{product.sellerName || product.shop || "Official Store"}</Text>
              <Text style={styles.sellerVerified}>Verified Seller</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.contactBtn} onPress={handleContactSeller}>
            <Feather name="phone-call" size={18} color={COLORS.primary} />
            <Text style={styles.contactBtnText}>Call</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently bought together</Text>
          
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : otherProducts.length === 0 ? (
            <Text style={styles.emptyText}>No other items available right now.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {otherProducts.map((item) => (
                <TouchableOpacity 
                  key={item._id} 
                  style={styles.relatedCard}
                  onPress={() => navigation.push('ProductDetails', { product: item })}
                  activeOpacity={0.7}
                >
                  <Image source={{ uri: item.image }} style={styles.relatedImage} />
                  <Text style={styles.relatedName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.relatedPrice}>{item.price}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>{currencySymbol}{totalPrice}</Text>
        </View>

        <TouchableOpacity 
          style={[styles.cartButton, isAddingToCart && { opacity: 0.8 }]} 
          onPress={handleAddToCart}
          disabled={isAddingToCart}
        >
          {isAddingToCart ? (
            <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
          ) : (
            <Feather name="shopping-bag" size={20} color="#FFF" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.cartButtonText}>
            {isAddingToCart ? "Adding..." : "Add to Cart"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showErrorModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalIcon}>
                    <Feather name="map-pin" size={28} color="#EF4444" />
                </View>
                <Text style={styles.modalTitle}>Notice</Text>
                <Text style={styles.modalText}>{errorMessage}</Text>
                <TouchableOpacity style={styles.modalBtn} onPress={() => setShowErrorModal(false)}>
                    <Text style={styles.modalBtnText}>Got it</Text>
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingBottom: 100 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerIconBtn: { padding: 8, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }, // Added fixed dimensions to ensure perfect symmetry
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
  
  imageWrapper: { width: width - 40, height: width - 40, alignSelf: 'center', backgroundColor: '#F8FAFC', borderRadius: 32, marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 32 },
  
  titleArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 30, marginBottom: 24 },
  titleColumn: { flex: 1, marginRight: 16 },
  productName: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, marginBottom: 4 },
  shopName: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 20, padding: 4 },
  qtyBtn: { padding: 12, backgroundColor: '#FFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  qtyText: { fontSize: 15, fontWeight: '700', color: COLORS.textDark, paddingHorizontal: 12, minWidth: 50, textAlign: 'center' },
  
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 30 },
  infoCard: { flex: 1, alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 16, borderRadius: 20, marginHorizontal: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  infoValue: { fontSize: 15, fontWeight: '800', color: COLORS.textDark, marginBottom: 2 },
  infoLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 24, marginBottom: 30 },
  
  section: { paddingHorizontal: 24, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, marginBottom: 12 },
  descriptionText: { fontSize: 15, color: COLORS.textMuted, lineHeight: 24, fontWeight: '500' },
  emptyText: { color: COLORS.textMuted, fontStyle: 'italic' },

  sellerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 16, borderRadius: 20, marginHorizontal: 24, marginBottom: 32, borderWidth: 1, borderColor: '#F1F5F9' },
  sellerInfo: { flexDirection: 'row', alignItems: 'center' },
  sellerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sellerName: { fontSize: 15, fontWeight: '700', color: COLORS.textDark },
  sellerVerified: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  contactBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textDark, marginLeft: 6 },
  
  horizontalList: { flexDirection: 'row', marginLeft: -24, paddingLeft: 24 },
  relatedCard: { width: 120, marginRight: 16 },
  relatedImage: { width: 120, height: 120, borderRadius: 20, backgroundColor: '#F8FAFC', marginBottom: 10 },
  relatedName: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 4, lineHeight: 20 },
  relatedPrice: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
  totalPrice: { fontSize: 24, fontWeight: '900', color: COLORS.textDark },
  cartButton: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  cartButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  modalIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textDark, marginBottom: 8 },
  modalText: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  modalBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, width: '100%', borderRadius: 14, alignItems: 'center' },
  modalBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' }
});