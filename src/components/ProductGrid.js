import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS } from '../components/theme';
// 1. Import useNavigation
import { useNavigation } from '@react-navigation/native'; 

export default function ProductGrid({ products, isLoading }) {
  // 2. Initialize the navigation hook
  const navigation = useNavigation(); 

  return (
    <View>
      <View style={[styles.sectionHeader, { marginTop: 10 }]}>
        <Text style={[styles.sectionTitle, { fontSize: 20 }]}>Recommended for you</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : (
        <View style={styles.recommendedGrid}>
          {products.map((item) => (
            <TouchableOpacity 
              key={item._id} 
              style={styles.gridCard}
              // 3. Add the onPress event to navigate and pass the data!
              onPress={() => navigation.navigate('ProductDetails', { product: item })}
              activeOpacity={0.8}
            >
              
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.gridImage} />
                
                <TouchableOpacity style={styles.heartBadge}>
                  <Ionicons name={item.isFavorite ? "heart" : "heart-outline"} size={16} color={item.isFavorite ? COLORS.heartIcon : COLORS.textMuted} />
                </TouchableOpacity>

                <View style={styles.timeBadge}>
                  <Feather name="clock" size={10} color={COLORS.textDark} style={{ marginRight: 4 }} />
                  <Text style={styles.timeText}>{item.time || "15 min"}</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                
                <View style={styles.shopRatingRow}>
                  <View style={styles.shopInfo}>
                    <Ionicons name="storefront-outline" size={12} color={COLORS.heartIcon} style={{ marginRight: 2 }} />
                    <Text style={styles.shopName} numberOfLines={1}>{item.shop || item.tags || "Local Market"}</Text>
                  </View>
                  <View style={styles.ratingInfo}>
                    <Text style={styles.ratingScore}>{item.rating || "4.5"}</Text>
                    <Ionicons name="star" size={10} color={COLORS.starGold} style={{ marginHorizontal: 2 }} />
                  </View>
                </View>

                <View style={styles.deliveryPriceRow}>
                  <View style={styles.pricePill}>
                    <Text style={styles.priceText}>{item.price || "$4.99"}</Text>
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
  heartBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: COLORS.heartBg, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  timeBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: COLORS.badgeBg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  timeText: { fontSize: 10, fontWeight: '700', color: COLORS.textDark },
  cardFooter: { padding: 12 },
  itemName: { fontSize: 14, fontWeight: '800', color: COLORS.textDark, marginBottom: 6 },
  shopRatingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  shopInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  shopName: { fontSize: 11, fontWeight: '600', color: COLORS.textDark, marginRight: 4 },
  ratingInfo: { flexDirection: 'row', alignItems: 'center' },
  ratingScore: { fontSize: 11, fontWeight: '800', color: COLORS.textDark },
  deliveryPriceRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'flex-end' },
  pricePill: { backgroundColor: COLORS.priceBg, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 14 },
  priceText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
});