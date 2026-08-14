import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  TextInput,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';

// --- COLOR THEME ---
const THEME_COLOR = '#F62440'; // Vibrant Red
const BG_COLOR = '#FFFAF3';    // Very Light Cream
const HIGHLIGHT_LIGHT = '#FFF2DB'; // Light Peach

export default function CartScreen() {
  const navigation = useNavigation();
  const { cartItems, addToCart, removeFromCart, clearCart, getTotalPrice } = useCart(); 

  const deliveryFee = 2.00;
  const subtotal = getTotalPrice();
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;

  // --- NEW: Order Placement Logic ---
  const handlePlaceOrder = () => {
    // 1. In the future, this is where you will make a POST request to your Flask backend
    // example: await fetch('http://your-api.com/orders', { method: 'POST', body: JSON.stringify(cartItems) })
    
    // 2. If the API returns success, redirect the user to the tracking screen
    navigation.navigate('OrderTracking');
    
    // Note: We are deliberately NOT calling clearCart() right here because 
    // the OrderTrackingScreen is temporarily relying on the CartContext to display the receipt.
    // In a real app, you would pass the resulting 'OrderID' to the tracking screen and fetch it from the database.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={clearCart}>
          <Ionicons name="trash-outline" size={24} color={THEME_COLOR} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        
        {/* Cart Items List */}
        <View style={styles.section}>
          {cartItems.length === 0 ? (
            <Text style={styles.emptyCartText}>Your cart is empty.</Text>
          ) : (
            cartItems.map((item) => {
              const priceNumber = typeof item.price === 'string' 
                ? parseFloat(item.price.replace('$', '')) 
                : item.price;

              return (
                <View key={item.id} style={styles.cartItem}>
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>${priceNumber.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.quantityControl}>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                      <Ionicons name="remove" size={16} color={THEME_COLOR} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                      <Ionicons name="add" size={16} color={THEME_COLOR} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Promo Code Section */}
        <View style={styles.promoSection}>
          <Feather name="tag" size={20} color="#666" style={styles.promoIcon} />
          <TextInput 
            style={styles.promoInput} 
            placeholder="Enter Promo Code" 
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.applyBtn}>
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>

        {/* Delivery Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Deliver To</Text>
          <TouchableOpacity style={styles.addressCard}>
            <View style={styles.addressIconBg}>
              <Ionicons name="location" size={24} color={THEME_COLOR} />
            </View>
            <View style={styles.addressDetails}>
              <Text style={styles.addressLabel}>Home</Text>
              <Text style={styles.addressText} numberOfLines={2}>Banani, Dhaka, 1213, Bangladesh</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Payment Method Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity style={styles.paymentCard}>
            <View style={styles.paymentIconBg}>
              <MaterialCommunityIcons name="credit-card-outline" size={24} color={THEME_COLOR} />
            </View>
            <View style={styles.paymentDetails}>
              <Text style={styles.paymentLabel}>Credit Card</Text>
              <Text style={styles.paymentText}>**** **** **** 1234</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Bill Details Section */}
        <View style={styles.billSection}>
          <Text style={styles.sectionTitle}>Bill Summary</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.billRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Fixed Bottom Checkout Button */}
      <View style={styles.bottomFooter}>
        <TouchableOpacity 
          style={[styles.checkoutBtn, cartItems.length === 0 && styles.checkoutBtnDisabled]} 
          disabled={cartItems.length === 0}
          onPress={handlePlaceOrder}
        >
          <Text style={styles.checkoutBtnText}>Place Order</Text>
          <Text style={styles.checkoutBtnText}>${total.toFixed(2)}</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  headerBtn: {
    padding: 5,
  },
  container: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFF',
    padding: 20,
    marginBottom: 10,
  },
  emptyCartText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    paddingVertical: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 15,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME_COLOR,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HIGHLIGHT_LIGHT,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  qtyBtn: {
    padding: 4,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginHorizontal: 10,
  },
  promoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    marginBottom: 10,
  },
  promoIcon: {
    marginRight: 10,
  },
  promoInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  applyBtn: {
    backgroundColor: THEME_COLOR,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 15,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressIconBg: {
    width: 40,
    height: 40,
    backgroundColor: HIGHLIGHT_LIGHT,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  addressDetails: {
    flex: 1,
    paddingRight: 10,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentIconBg: {
    width: 40,
    height: 40,
    backgroundColor: HIGHLIGHT_LIGHT,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  paymentText: {
    fontSize: 12,
    color: '#666',
  },
  billSection: {
    backgroundColor: '#FFF',
    padding: 20,
    paddingBottom: 40,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 14,
    color: '#666',
  },
  billValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 15,
    marginTop: 5,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#222',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME_COLOR,
  },
  bottomFooter: {
    backgroundColor: '#FFF',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  checkoutBtn: {
    backgroundColor: THEME_COLOR,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
  },
  checkoutBtnDisabled: {
    opacity: 0.5,
  },
  checkoutBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  }
});