import React from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    StatusBar,
    Linking,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const THEME = {
    primary: '#10B981',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    surfaceActive: '#ECFDF5'
};

export default function HelpCenterScreen({ navigation }) {
    
    const handleCallSupport = async () => {
        const phoneNumber = 'tel:+9118001234567'; // Replace with your actual support number
        
        try {
            // Directly open the dialer to bypass OS-level canOpenURL restrictions
            await Linking.openURL(phoneNumber);
        } catch (error) {
            // This will only trigger if the device physically cannot make calls
            Alert.alert(
                "Phone Call Unavailable", 
                "Your device does not support phone calls. You can reach us at 1800-123-4567."
            );
        }
    };

    const handleEmailSupport = () => {
        const email = 'mailto:support@yourdeliveryapp.com?subject=App%20Support%20Request';
        Linking.canOpenURL(email).then(supported => {
            if (supported) {
                Linking.openURL(email);
            } else {
                Alert.alert("Error", "Could not open email app.");
            }
        });
    };

    const IssueCard = ({ icon, title, description, onPress }) => (
        <TouchableOpacity style={styles.issueCard} onPress={onPress}>
            <View style={styles.issueIconBox}>
                <Feather name={icon} size={20} color={THEME.primary} />
            </View>
            <View style={styles.issueTextContainer}>
                <Text style={styles.issueTitle}>{title}</Text>
                <Text style={styles.issueDescription}>{description}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={THEME.textMuted} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={THEME.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Help & Support</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <Text style={styles.greetingText}>How can we help you?</Text>
                
                <Text style={styles.sectionTitle}>Common Issues</Text>
                <View style={styles.cardContainer}>
                    <IssueCard 
                        icon="refresh-ccw" 
                        title="Refund Related Issues" 
                        description="Track pending refunds or report a payment error."
                        onPress={() => Alert.alert("Refunds", "Please contact support for refund initiation.")}
                    />
                    <View style={styles.divider} />
                    <IssueCard 
                        icon="package" 
                        title="Order Not Delivered" 
                        description="Contact delivery partner in the order status page or report a missing order."
                        onPress={() => (navigation.navigate('Orders'))}
                    />
                    <View style={styles.divider} />
                    <IssueCard 
                        icon="alert-triangle" 
                        title="Missing or Wrong Items" 
                        description="Received incorrect food items in your package."
                        onPress={() => Alert.alert("Missing Items", "Please keep photos of the delivered package and contact customer support.")}
                    />
                    <View style={styles.divider} />
                    <IssueCard 
                        icon="more-horizontal" 
                        title="Other Issues" 
                        description="For general queries."
                        onPress={() => Alert.alert("Other Issues", "Scroll down to contact our support team.")}
                    />
                </View>

                <Text style={styles.sectionTitle}>Contact Customer Support</Text>
                <View style={styles.contactContainer}>
                    <TouchableOpacity style={[styles.contactBtn, styles.callBtn]} onPress={handleCallSupport}>
                        <Feather name="phone-call" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.callBtnText}>Call Us Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.contactBtnOutline} onPress={handleEmailSupport}>
                        <Feather name="mail" size={20} color={THEME.textDark} style={{ marginRight: 8 }} />
                        <Text style={styles.outlineBtnText}>Email Support</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footerInfo}>
                    <Text style={styles.footerText}>Support available from 9:00 AM to 11:00 PM</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: THEME.background },
    backButton: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark },
    
    scrollContent: { padding: 16, paddingBottom: 40 },
    
    greetingText: { fontSize: 24, fontWeight: '800', color: THEME.textDark, marginBottom: 24, marginTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: THEME.textDark, marginBottom: 12, marginLeft: 4 },
    
    cardContainer: { backgroundColor: THEME.card, borderRadius: 16, paddingVertical: 8, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: THEME.border },
    issueCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    issueIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: THEME.surfaceActive, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    issueTextContainer: { flex: 1, paddingRight: 16 },
    issueTitle: { fontSize: 15, fontWeight: '700', color: THEME.textDark, marginBottom: 4 },
    issueDescription: { fontSize: 13, color: THEME.textMuted, lineHeight: 18 },
    divider: { height: 1, backgroundColor: THEME.border, marginHorizontal: 16 },

    contactContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginRight: 8, shadowColor: THEME.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    callBtn: { backgroundColor: THEME.primary },
    callBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    
    contactBtnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginLeft: 8, backgroundColor: THEME.card, borderWidth: 1, borderColor: THEME.border },
    outlineBtnText: { color: THEME.textDark, fontSize: 15, fontWeight: '700' },

    footerInfo: { marginTop: 32, alignItems: 'center' },
    footerText: { color: THEME.textMuted, fontSize: 13, fontWeight: '500' }
});