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
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { COLORS } from '../components/theme';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params;
  
  const [otherProducts, setOtherProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchOtherProducts = async () => {
      const API_URL = process.env.EXPO_PUBLIC_IP 
        ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/products`
        : 'http://192.168.0.107:5000/api/products';

      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        const filteredData = data.filter(item => item._id !== product._id);
        setOtherProducts(filteredData.slice(0, 8)); 
      } catch (error) {
        console.error("Error fetching other products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOtherProducts();
  }, [product]);

  const increment = () => setQuantity(prev => prev + 1);
  const decrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

  // Extract numerical value from price string (e.g. "₹60" -> 60) for total calculation
  const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0;
  const currencySymbol = product.price.replace(/[0-9.]/g, '') || '₹';
  const totalPrice = (numericPrice * quantity).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Standard Clean Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
          <Feather name="chevron-left" size={28} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <TouchableOpacity style={styles.headerIconBtn}>
          <Ionicons name={product.isFavorite ? "heart" : "heart-outline"} size={26} color={product.isFavorite ? "#EF4444" : COLORS.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Framed Catalog Image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
        </View>

        {/* Title and Inline Quantity */}
        <View style={styles.titleArea}>
          <View style={styles.titleColumn}>
            <Text style={styles.productName}>{product.name}</Text>
            <Text style={styles.shopName}>By {product.shop || "Our Store"}</Text>
          </View>
          
          <View style={styles.qtyBox}>
            <TouchableOpacity onPress={decrement} style={styles.qtyBtn}>
              <Feather name="minus" size={18} color={COLORS.textDark} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{quantity}</Text>
            <TouchableOpacity onPress={increment} style={styles.qtyBtn}>
              <Feather name="plus" size={18} color={COLORS.textDark} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vertical Info Cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="star" size={20} color="#D97706" />
            </View>
            <Text style={styles.infoValue}>{product.rating}</Text>
            <Text style={styles.infoLabel}>{product.reviews} Reviews</Text>
          </View>
          
          <View style={styles.infoCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
              <Feather name="clock" size={20} color="#0369A1" />
            </View>
            <Text style={styles.infoValue}>{product.time}</Text>
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

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About this item</Text>
          <Text style={styles.descriptionText}>
            {product.description || "Premium quality product carefully selected for you. Enjoy the fresh taste and standard delivery to your doorstep."}
          </Text>
        </View>

        {/* Related Items */}
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

      {/* Sticky Bottom Bar with Total Price */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total Price</Text>
          <Text style={styles.totalPrice}>{currencySymbol}{totalPrice}</Text>
        </View>

        <TouchableOpacity style={styles.cartButton}>
          <Feather name="shopping-bag" size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={styles.cartButtonText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  scrollContent: { paddingBottom: 100 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  headerIconBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark },
  
  // Image
  imageWrapper: { width: width - 40, height: width - 40, alignSelf: 'center', backgroundColor: '#F8FAFC', borderRadius: 32, marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  productImage: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: 32 },
  
  // Title & Qty
  titleArea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 30, marginBottom: 24 },
  titleColumn: { flex: 1, marginRight: 16 },
  productName: { fontSize: 24, fontWeight: '800', color: COLORS.textDark, marginBottom: 4 },
  shopName: { fontSize: 14, color: COLORS.textMuted, fontWeight: '600' },
  qtyBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 20, padding: 4 },
  qtyBtn: { padding: 12, backgroundColor: '#FFF', borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  qtyText: { fontSize: 16, fontWeight: '700', color: COLORS.textDark, paddingHorizontal: 16 },
  
  // Info Grid
  infoGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 30 },
  infoCard: { flex: 1, alignItems: 'center', backgroundColor: '#FFF', paddingVertical: 16, borderRadius: 20, marginHorizontal: 4, borderWidth: 1, borderColor: '#F1F5F9' },
  iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  infoValue: { fontSize: 15, fontWeight: '800', color: COLORS.textDark, marginBottom: 2 },
  infoLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 24, marginBottom: 30 },
  
  // Sections
  section: { paddingHorizontal: 24, marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textDark, marginBottom: 12 },
  descriptionText: { fontSize: 15, color: COLORS.textMuted, lineHeight: 24, fontWeight: '500' },
  emptyText: { color: COLORS.textMuted, fontStyle: 'italic' },
  
  // Related Items
  horizontalList: { flexDirection: 'row', marginLeft: -24, paddingLeft: 24 },
  relatedCard: { width: 120, marginRight: 16 },
  relatedImage: { width: 120, height: 120, borderRadius: 20, backgroundColor: '#F8FAFC', marginBottom: 10 },
  relatedName: { fontSize: 14, fontWeight: '600', color: COLORS.textDark, marginBottom: 4, lineHeight: 20 },
  relatedPrice: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  
  // Sticky Bottom Bar
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  priceContainer: { flex: 1 },
  priceLabel: { fontSize: 13, color: COLORS.textMuted, fontWeight: '600', marginBottom: 2 },
  totalPrice: { fontSize: 24, fontWeight: '900', color: COLORS.textDark },
  cartButton: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20, alignItems: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  cartButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' }
});