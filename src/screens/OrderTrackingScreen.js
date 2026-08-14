import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  ScrollView,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps'; // <-- IMPORTED REAL MAP
import { useCart } from '../context/CartContext'; 

// --- COLOR THEME ---
const THEME_COLOR = '#F62440'; 
const BG_COLOR = '#FFFAF3';    
const HIGHLIGHT_LIGHT = '#FFF2DB'; 
const SUCCESS_GREEN = '#0F8A65';

export default function OrderTrackingScreen() {
  const navigation = useNavigation();
  const { cartItems, getTotalPrice } = useCart();
  
  const deliveryFee = 2.00;
  const subtotal = getTotalPrice();
  const totalPaid = subtotal > 0 ? (subtotal + deliveryFee).toFixed(2) : '16.97'; 
  
  const orderSummaryString = cartItems.length > 0 
    ? cartItems.map(item => `${item.quantity}x ${item.name}`).join(', ')
    : '2x Zinger Burger, 1x Spicy Fries'; 

  return (
    <View style={styles.root}>
      
      {/* REAL INTERACTIVE MAP */}
      <MapView 
        style={styles.mapBackground}
        initialRegion={{
          latitude: 23.7937, // Coordinates for Banani, Dhaka
          longitude: 90.4066,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
      >
        <Marker 
          coordinate={{ latitude: 23.7937, longitude: 90.4066 }} 
          title="KFC Banani 11"
          description="Preparing your order"
        />
      </MapView>
      
      {/* Subtle overlay so the back button is visible over the map */}
      <View style={styles.mapOverlay} />

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Transparent Header Over Map */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.helpBtn}>
            <Text style={styles.helpBtnText}>Help</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Sheet containing tracking details */}
        <View style={styles.bottomSheet}>
          <View style={styles.dragHandle} />
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            
            {/* Delivery Time Header */}
            <View style={styles.timeHeader}>
              <Text style={styles.timeLabel}>Estimated Delivery</Text>
              <Text style={styles.timeValue}>15 - 20 mins</Text>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
              <Text style={styles.statusText}>Your food is being prepared</Text>
            </View>

            {/* Delivery Executive Info */}
            <View style={styles.driverCard}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=150&q=80' }} 
                style={styles.driverAvatar} 
              />
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>Ahmed Khan</Text>
                <View style={styles.driverRating}>
                  <Ionicons name="star" size={14} color="#F5A623" />
                  <Text style={styles.ratingText}>4.9</Text>
                  <Text style={styles.bikeText}> • Honda CB Shine</Text>
                </View>
              </View>
              
              <View style={styles.contactActions}>
                <TouchableOpacity style={styles.iconBtn}>
                  <Ionicons name="chatbubble-outline" size={20} color={THEME_COLOR} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, styles.callBtn]}>
                  <Ionicons name="call" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Order Status Timeline */}
            <View style={styles.timelineContainer}>
              <Text style={styles.sectionTitle}>Order Status</Text>
              
              {/* Step 1: Accepted (Completed) */}
              <View style={styles.timelineStep}>
                <View style={styles.stepIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color={SUCCESS_GREEN} />
                  <View style={[styles.stepLine, { backgroundColor: SUCCESS_GREEN }]} />
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={styles.stepTitle}>Order Accepted</Text>
                  <Text style={styles.stepSub}>Restaurant has confirmed your order</Text>
                </View>
              </View>

              {/* Step 2: Preparing (Active) */}
              <View style={styles.timelineStep}>
                <View style={styles.stepIconContainer}>
                  <MaterialCommunityIcons name="pot-steam" size={24} color={THEME_COLOR} />
                  <View style={styles.stepLine} />
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={[styles.stepTitle, styles.activeStepTitle]}>Preparing Food</Text>
                  <Text style={styles.stepSub}>Your food is currently being cooked</Text>
                </View>
              </View>

              {/* Step 3: On the way (Pending) */}
              <View style={styles.timelineStep}>
                <View style={styles.stepIconContainer}>
                  <MaterialCommunityIcons name="bike" size={24} color="#DDD" />
                </View>
                <View style={styles.stepTextContainer}>
                  <Text style={[styles.stepTitle, styles.pendingStepTitle]}>Out for Delivery</Text>
                  <Text style={styles.stepSub}>Ahmed is waiting to pick up your order</Text>
                </View>
              </View>
            </View>

            {/* Dynamic Order Summary Snapshot */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.restaurantName}>KFC Banani 11</Text>
                <Text style={styles.orderId}>Order #9021B</Text>
              </View>
              <Text style={styles.summaryItems}>{orderSummaryString}</Text>
              <View style={styles.receiptRow}>
                <TouchableOpacity>
                  <Text style={styles.receiptLink}>View Receipt</Text>
                </TouchableOpacity>
                <Text style={styles.totalPaid}>Paid ${totalPaid}</Text>
              </View>
            </View>

          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E5E9F0', 
  },
  mapBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '65%', // Explicit layout boundaries fix blank screen issues
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '65%',
    backgroundColor: 'rgba(255,255,255,0.1)', // Significantly reduced opacity so the map is highly visible
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 10,
  },
  headerBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#FFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  helpBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  helpBtnText: {
    fontWeight: '700',
    color: THEME_COLOR,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: BG_COLOR,
    marginTop: '35%', // Creates the exact spacing needed to show the map
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#DDD',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  timeHeader: {
    alignItems: 'center',
    marginBottom: 25,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#222',
    marginBottom: 15,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 10,
  },
  progressFill: {
    width: '50%', 
    height: '100%',
    backgroundColor: THEME_COLOR,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME_COLOR,
  },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginLeft: 4,
  },
  bikeText: {
    fontSize: 12,
    color: '#888',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: HIGHLIGHT_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBtn: {
    backgroundColor: SUCCESS_GREEN,
  },
  timelineContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginBottom: 20,
  },
  timelineStep: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepIconContainer: {
    alignItems: 'center',
    width: 30,
    marginRight: 15,
  },
  stepLine: {
    width: 2,
    height: 35,
    backgroundColor: '#E5E7EB',
    marginTop: 5,
  },
  stepTextContainer: {
    flex: 1,
    paddingTop: 2,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  activeStepTitle: {
    color: THEME_COLOR,
  },
  pendingStepTitle: {
    color: '#888',
  },
  stepSub: {
    fontSize: 12,
    color: '#777',
  },
  summaryCard: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 15,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  orderId: {
    fontSize: 12,
    color: '#888',
  },
  summaryItems: {
    fontSize: 13,
    color: '#555',
    marginBottom: 15,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  receiptLink: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME_COLOR,
  },
  totalPaid: {
    fontSize: 14,
    fontWeight: '800',
    color: '#222',
  }
});