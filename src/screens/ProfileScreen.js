import React, { useContext } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    StatusBar,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { LEGAL_PAGES } from '../constants/legalData'; // Ensure this file exists!

const THEME = {
    primary: '#10B981',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    danger: '#EF4444'
};

export default function ProfileScreen({ navigation }) {
    const { user, logout } = useContext(AuthContext);

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Log Out", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('authToken');
                            if (logout) {
                                logout();
                            }
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Auth' }],
                            });
                        } catch (error) {
                            console.error("Logout Error:", error);
                            Alert.alert("Error", "Could not log out. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    const MenuOption = ({ icon, title, subtitle, onPress, color = THEME.textDark }) => (
        <TouchableOpacity style={styles.menuOption} onPress={onPress}>
            <View style={[styles.menuIconBox, { backgroundColor: color === THEME.danger ? '#FEF2F2' : '#F1F5F9' }]}>
                <Feather name={icon} size={20} color={color === THEME.danger ? THEME.danger : THEME.primary} />
            </View>
            <View style={styles.menuTextContainer}>
                <Text style={[styles.menuTitle, { color }]}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
            </View>
            <Feather name="chevron-right" size={20} color={THEME.textMuted} />
        </TouchableOpacity>
    );

    const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'G';

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
                {/* <TouchableOpacity style={styles.editButton}>
                    <Feather name="edit-2" size={18} color={THEME.primary} />
                </TouchableOpacity> */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.profileCard}>
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>{userInitial}</Text>
                    </View>
                    
                    <View style={styles.profileInfo}>
                        <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'guest@example.com'}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>Elite User</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Dashboard</Text>
                <View style={styles.menuCard}>
                    <MenuOption 
                        icon="shopping-bag" 
                        title="My Orders" 
                        subtitle="View your order history" 
                        onPress={() => navigation.navigate('Orders')} 
                    />
                    <View style={styles.divider} />
                    <MenuOption 
                        icon="map-pin" 
                        title="Delivery Addresses" 
                        subtitle="Manage saved addresses" 
                        onPress={() => navigation.navigate('SavedAddresses')}
                    />
                    <View style={styles.divider} />
                    <MenuOption 
                        icon="help-circle" 
                        title="Help & Support" 
                        onPress={() => { navigation.navigate('HelpCenter')}} 
                    />
                </View>

                {/* --- NEW: Legal & Policies Section --- */}
                <Text style={styles.sectionTitle}>Legal & Policies</Text>
                <View style={styles.menuCard}>
                    <MenuOption 
                        icon="headphones" 
                        title="Contact Us" 
                        onPress={() => navigation.navigate('Policy', { pageData: LEGAL_PAGES.contact })} 
                    />
                    <View style={styles.divider} />
                    <MenuOption 
                        icon="file-text" 
                        title="Terms & Conditions" 
                        onPress={() => navigation.navigate('Policy', { pageData: LEGAL_PAGES.terms })} 
                    />
                    <View style={styles.divider} />
                    <MenuOption 
                        icon="shield" 
                        title="Privacy Policy" 
                        onPress={() => navigation.navigate('Policy', { pageData: LEGAL_PAGES.privacy })} 
                    />
                    <View style={styles.divider} />
                    <MenuOption 
                        icon="refresh-ccw" 
                        title="Cancellation & Refunds" 
                        onPress={() => navigation.navigate('Policy', { pageData: LEGAL_PAGES.refunds })} 
                    />
                    <View style={styles.divider} />
                    <MenuOption 
                        icon="truck" 
                        title="Shipping & Delivery" 
                        onPress={() => navigation.navigate('Policy', { pageData: LEGAL_PAGES.shipping })} 
                    />
                </View>

                <Text style={styles.sectionTitle}>Account</Text>
                <View style={styles.menuCard}>
                    <MenuOption 
                        icon="log-out" 
                        title="Log Out" 
                        color={THEME.danger}
                        onPress={handleLogout} 
                    />
                </View>
                
                <Text style={styles.versionText}>App Version 1.0.0</Text>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: THEME.background },
    headerTitle: { fontSize: 22, fontWeight: '800', color: THEME.textDark },
    editButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
    
    scrollContent: { padding: 20, paddingBottom: 100 },
    
    profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: THEME.card, borderRadius: 20, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
    
    avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, backgroundColor: THEME.primary, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
    
    profileInfo: { flex: 1 },
    userName: { fontSize: 18, fontWeight: '700', color: THEME.textDark, marginBottom: 4 },
    userEmail: { fontSize: 14, color: THEME.textMuted, marginBottom: 8 },
    badge: { alignSelf: 'flex-start', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    badgeText: { fontSize: 12, fontWeight: '700', color: THEME.primary },
    
    sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.textDark, marginBottom: 12, marginLeft: 4 },
    menuCard: { backgroundColor: THEME.card, borderRadius: 20, paddingVertical: 8, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
    menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
    menuIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    menuTextContainer: { flex: 1 },
    menuTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
    menuSubtitle: { fontSize: 13, color: THEME.textMuted },
    divider: { height: 1, backgroundColor: THEME.border, marginHorizontal: 16 },
    
    versionText: { textAlign: 'center', fontSize: 13, color: THEME.textMuted, marginTop: 10, marginBottom: 20 }
});