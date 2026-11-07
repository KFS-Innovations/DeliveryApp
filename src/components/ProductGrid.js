import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../components/theme';
import { useNavigation } from '@react-navigation/native'; 

export default function ProductGrid({ products, isLoading }) {
  const navigation = useNavigation(); 

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <View>
      <View style={[styles.sectionHeader, { marginTop: 10 }]}>
        <Text style={[styles.sectionTitle, { fontSize: 20 }]}>Recommended for you</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : safeProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
                <Feather name="shopping-bag" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySub}>We don't have any products in this category yet. Check back later!</Text>
        </View>
      ) : (
        <View style={styles.recommendedGrid}>
          {safeProducts.map((item) => (
            <TouchableOpacity 
              key={item._id} 
              style={styles.gridCard}
              onPress={() => navigation.navigate('ProductDetails', { product: item })}
              activeOpacity={0.8}
            >
              
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.gridImage} />
                <View style={styles.timeBadge}>
                  <Feather name="clock" size={10} color={COLORS.textDark} style={{ marginRight: 4 }} />
                  <Text style={styles.timeText}>{item.time || "15 min"}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                
                {/* Shop Name Row */}
                <View style={styles.shopInfo}>
                  <Ionicons name="storefront-outline" size={12} color={COLORS.heartIcon} style={{ marginRight: 2 }} />
                  <Text style={styles.shopName} numberOfLines={1}>
                    {item.sellerId?.shopName || "Local Market"}
                  </Text>
                </View>

                {/* Rating and Price Row (Grouped together on the same level) */}
                <View style={styles.ratingPriceRow}>
                  <View style={styles.ratingInfo}>
                    <Text style={styles.ratingScore}>{item.rating || "4.5"}</Text>
                    <Ionicons name="star" size={12} color={COLORS.starGold} style={{ marginHorizontal: 2 }} />
                  </View>

                  <View style={styles.pricePill}>
                    <Text style={styles.priceText}>{item.price || "₹0"}</Text>
                  </View>
                </View>

              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  recommendedGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 20 },
  gridCard: { width: '48%', backgroundColor: COLORS.cardBg, borderRadius: 20, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 0.5 },
  imageContainer: { position: 'relative', height: 120, width: '100%' },
  gridImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  timeBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: COLORS.badgeBg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  timeText: { fontSize: 10, fontWeight: '700', color: COLORS.textDark },
  cardFooter: { padding: 12 },
  itemName: { fontSize: 14, fontWeight: '800', color: COLORS.textDark, marginBottom: 4 },
  
  // Updated Styles for Layout
  shopInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  shopName: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginRight: 4, flex: 1 },
  
  ratingPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  ratingInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 },
  ratingScore: { fontSize: 12, fontWeight: '800', color: '#B45309' },
  
  pricePill: { backgroundColor: COLORS.priceBg, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14 },
  priceText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, paddingHorizontal: 20 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20 },
});