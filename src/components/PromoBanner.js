import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../components/theme';

export default function PromoBanner() {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Special Offers</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.bannerContainer}>
        <LinearGradient
          colors={['#1F2937', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.darkBannerGradient}
        >
          <View style={styles.darkBannerLeft}>
            <Text style={styles.uptoText}>EXCLUSIVE</Text>
            <View style={styles.discountRow}>
              <Text style={styles.discountValue}>30%</Text>
              <Text style={styles.discountOff}> OFF</Text>
            </View>
            <Text style={styles.promoDesc}>Valid only for today!</Text>
            <TouchableOpacity style={styles.orderNowBtn}>
              <Text style={styles.orderNowText}>Order Now</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.darkBannerRight}>
            <Image 
              source={{ uri: 'https://i.postimg.cc/85cnb05S/Farm-fresh-produce-1366x768.jpg' }} 
              style={styles.darkBannerImage} 
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textDark },
  seeAllText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  bannerContainer: { width: '100%', height: 150, borderRadius: 16, marginBottom: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8 },
  darkBannerGradient: { flex: 1, flexDirection: 'row', borderRadius: 16, overflow: 'hidden' },
  darkBannerLeft: { flex: 1, padding: 20, justifyContent: 'center', zIndex: 2 },
  darkBannerRight: { width: 140, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  darkBannerImage: { width: 180, height: 180, borderRadius: 90, position: 'absolute', right: -30, borderWidth: 4, borderColor: 'rgba(255,255,255,0.05)' },
  uptoText: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  discountRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 2, marginBottom: 4 },
  discountValue: { color: '#EEDAA5', fontSize: 28, fontWeight: '900' },
  discountOff: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 4 },
  promoDesc: { color: '#CBD5E1', fontSize: 11, marginBottom: 12 },
  orderNowBtn: { backgroundColor: '#FFFFFF', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, alignSelf: 'flex-start' },
  orderNowText: { color: '#0F172A', fontSize: 11, fontWeight: 'bold' },
});