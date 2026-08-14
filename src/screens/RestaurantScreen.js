import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../context/CartContext';

// --- COLOR THEME ---
const THEME_COLOR = '#F62440'; // Vibrant Red
const BG_COLOR = '#FFFAF3';    // Very Light Cream
const HIGHLIGHT_LIGHT = '#FFF2DB'; // Light Peach
const HIGHLIGHT_MED = '#FFE5BF';   // Warm Peach

// Mock Restaurant Data
const RESTAURANT_INFO = {
  name: 'KFC Banani 11',
  rating: '4.8',
  reviews: '1K+ ratings',
  distance: '2.5 km',
  time: '15-20 mins',
  tags: 'American • Fast Food • Burgers',
  location: 'Banani, Dhaka',
  deliveryFee: 'Free delivery on orders above $15'
};

// Mock Menu Data grouped by categories
const MENU = [
  {
    category: 'Recommended',
    items: [
      {
        id: 'm1',
        name: 'Zinger Burger',
        price: '$5.99',
        description: 'Signature chicken burger with mayo and lettuce. Served hot and crispy.',
        isVeg: false,
        bestseller: true,
        image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=300&q=80'
      },
      {
        id: 'm2',
        name: 'Spicy Fries (Large)',
        price: '$2.99',
        description: 'Crispy golden fries tossed in our signature spicy seasoning.',
        isVeg: true,
        bestseller: false,
        image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=300&q=80'
      }
    ]
  },
  {
    category: 'Main Course',
    items: [
      {
        id: 'm3',
        name: '8 pc Hot & Crispy Chicken',
        price: '$14.99',
        description: 'Treat yourself to 8 pieces of our signature Hot & Crispy bone-in chicken.',
        isVeg: false,
        bestseller: true,
        image: 'https://images.unsplash.com/photo-1569691899455-88464f6d3cb1?auto=format&fit=crop&w=300&q=80'
      }
    ]
  }
];

export default function RestaurantScreen() {
  const navigation = useNavigation();
  
  // Connect to the Global Cart Context
  const { addToCart, removeFromCart, getQuantity, getTotalItems, getTotalPrice } = useCart();
  
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  // Helper to render the Swiggy-style Veg/Non-Veg icon
  const renderFoodTypeIcon = (isVeg) => {
    const color = isVeg ? '#0F8A65' : '#E43B4F';
    return (
      <View style={[styles.typeIconContainer, { borderColor: color }]}>
        <View style={[styles.typeIconDot, { backgroundColor: color }]} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* Custom Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}>
            <Feather name="search" size={22} color="#333" />
          </TouchableOpacity>
          {/* Top Cart Icon Alternative */}
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Cart')}>
            <Ionicons name="cart-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
        
        {/* Restaurant Info Card */}
        <View style={styles.infoCardWrapper}>
          <View style={styles.infoCard}>
            <Text style={styles.restaurantName}>{RESTAURANT_INFO.name}</Text>
            
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={18} color="#0F8A65" />
              <Text style={styles.ratingText}>{RESTAURANT_INFO.rating}</Text>
              <Text style={styles.reviewText}>({RESTAURANT_INFO.reviews})</Text>
            </View>

            <Text style={styles.tagsText}>{RESTAURANT_INFO.tags}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{RESTAURANT_INFO.distance} | {RESTAURANT_INFO.location}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="bike-fast" size={16} color="#666" />
                <Text style={styles.metaText}>{RESTAURANT_INFO.time}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.deliveryInfoRow}>
              <MaterialCommunityIcons name="brightness-percent" size={18} color={THEME_COLOR} />
              <Text style={styles.deliveryInfoText}>{RESTAURANT_INFO.deliveryFee}</Text>
            </View>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          {MENU.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.menuSection}>
              
              <Text style={styles.categoryTitle}>{section.category} ({section.items.length})</Text>

              {section.items.map((item, itemIndex) => {
                const quantity = getQuantity(item.id);
                const isLast = itemIndex === section.items.length - 1;

                return (
                  <View key={item.id} style={[styles.menuItem, !isLast && styles.itemBorder]}>
                    
                    <View style={styles.itemDetails}>
                      {renderFoodTypeIcon(item.isVeg)}
                      
                      {item.bestseller && (
                        <View style={styles.bestsellerBadge}>
                          <Text style={styles.bestsellerText}>Bestseller</Text>
                        </View>
                      )}
                      
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemPrice}>{item.price}</Text>
                      <Text style={styles.itemDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    </View>

                    <View style={styles.itemImageContainer}>
                      <Image source={{ uri: item.image }} style={styles.itemImage} />
                      
                      <View style={styles.addButtonContainer}>
                        {quantity === 0 ? (
                          <TouchableOpacity 
                            style={styles.addButton} 
                            onPress={() => addToCart(item)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.addButtonText}>ADD</Text>
                            <Ionicons name="add" size={14} color={THEME_COLOR} style={styles.addIcon} />
                          </TouchableOpacity>
                        ) : (
                          <View style={styles.quantityControl}>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => removeFromCart(item.id)}>
                              <Text style={styles.qtyBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{quantity}</Text>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => addToCart(item)}>
                              <Text style={styles.qtyBtnText}>+</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>

                  </View>
                );
              })}
              
              <View style={styles.sectionDivider} />
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Sticky Bottom Cart Bar (Appears when items are added) */}
      {totalItems > 0 && (
        <View style={styles.stickyCartBar}>
          <View>
            <Text style={styles.stickyItemText}>{totalItems} ITEM{totalItems > 1 ? 'S' : ''}</Text>
            <Text style={styles.stickyPriceText}>${totalPrice.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.viewCartBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.viewCartText}>View Cart</Text>
            <Ionicons name="cart" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BG_COLOR,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: BG_COLOR,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 15,
  },
  headerBtn: {
    padding: 5,
  },
  container: {
    flex: 1,
  },
  infoCardWrapper: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 25,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#222',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 5,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  reviewText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  tagsText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  metaRow: {
    gap: 6,
    marginBottom: 15,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 15,
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: HIGHLIGHT_LIGHT,
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  deliveryInfoText: {
    fontSize: 12,
    color: '#222',
    fontWeight: '600',
    flex: 1,
  },
  menuContainer: {
    backgroundColor: '#FFF',
    paddingBottom: 80, // Padding so the last items aren't blocked by the sticky bar
  },
  menuSection: {
    paddingTop: 20,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#222',
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 25,
    paddingTop: 10,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 15,
  },
  itemDetails: {
    flex: 1,
    paddingRight: 15,
  },
  typeIconContainer: {
    width: 14,
    height: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 2,
  },
  typeIconDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bestsellerBadge: {
    backgroundColor: HIGHLIGHT_MED,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  bestsellerText: {
    fontSize: 10,
    color: THEME_COLOR,
    fontWeight: '700',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  itemDescription: {
    fontSize: 12,
    color: '#777',
    lineHeight: 18,
  },
  itemImageContainer: {
    alignItems: 'center',
  },
  itemImage: {
    width: 130,
    height: 130,
    borderRadius: 16,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: -15, 
    width: 100,
    height: 36,
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    justifyContent: 'center',
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: THEME_COLOR,
    fontWeight: '800',
    fontSize: 15,
  },
  addIcon: {
    position: 'absolute',
    right: 8,
    top: 4,
  },
  quantityControl: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  qtyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME_COLOR,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionDivider: {
    height: 12,
    backgroundColor: '#F5F6F8',
  },
  stickyCartBar: {
    position: 'absolute',
    bottom: 20,
    left: 15,
    right: 15,
    backgroundColor: THEME_COLOR,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  stickyItemText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  stickyPriceText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  viewCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewCartText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});