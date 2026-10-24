import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    ScrollView, 
    ActivityIndicator,
    StatusBar,
    Alert,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME = {
    primary: '#10B981',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC',
    card: '#FFFFFF',
    border: '#E2E8F0',
    danger: '#EF4444'
};

export default function SavedAddressesScreen({ navigation }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal & Form States
    const [isModalVisible, setModalVisible] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [houseDetails, setHouseDetails] = useState("");
    const [areaDetails, setAreaDetails] = useState("");
    const [landmark, setLandmark] = useState("");

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.addresses) {
                setAddresses(data.addresses);
            }
        } catch (error) {
            Alert.alert("Error", "Could not fetch addresses.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (addressId) => {
        Alert.alert(
            "Delete Address",
            "Are you sure you want to delete this address?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('authToken');
                            const res = await fetch(`http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address/${addressId}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            
                            const data = await res.json();
                            if (data.success) {
                                setAddresses(addresses.filter(addr => addr._id !== addressId));
                            } else {
                                Alert.alert("Error", "Could not delete address");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Network error while deleting");
                        }
                    }
                }
            ]
        );
    };

    const openModalForNew = () => {
        setEditingAddressId(null);
        setHouseDetails("");
        setAreaDetails("");
        setLandmark("");
        setModalVisible(true);
    };

    const openModalForEdit = (address) => {
        setEditingAddressId(address._id);
        setHouseDetails(address.houseDetails || "");
        setAreaDetails(address.areaDetails || "");
        setLandmark(address.landmark || "");
        setModalVisible(true);
    };

    const handleSaveAddress = async () => {
        if (!houseDetails.trim() || !areaDetails.trim()) {
            return Alert.alert("Required Fields", "Please enter your House/Flat No. and Area.");
        }
        
        const fullAddress = `${houseDetails}, ${areaDetails}${landmark ? `, Near ${landmark}` : ''}`;
        const url = editingAddressId 
            ? `http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address/${editingAddressId}`
            : `http://${process.env.EXPO_PUBLIC_IP}:5000/api/users/address`;
        
        const method = editingAddressId ? 'PUT' : 'POST';

        try {
            const token = await AsyncStorage.getItem('authToken');
            const res = await fetch(url, {
                method: method,
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ houseDetails, areaDetails, landmark, fullAddress })
            });

            const data = await res.json();
            if (data.success) {
                fetchAddresses(); // Refresh the list
                setModalVisible(false);
            } else {
                Alert.alert("Error", "Could not save address");
            }
        } catch (error) {
            Alert.alert("Error", "Network error while saving address");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
            
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color={THEME.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Addresses</Text>
                <TouchableOpacity onPress={openModalForNew} style={styles.addButton}>
                    <Feather name="plus" size={24} color={THEME.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {addresses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Feather name="map" size={48} color={THEME.textMuted} style={{ marginBottom: 16 }} />
                        <Text style={styles.emptyText}>No saved addresses yet.</Text>
                    </View>
                ) : (
                    addresses.map((addr) => (
                        <View key={addr._id} style={styles.addressCard}>
                            <View style={styles.addressCardHeader}>
                                <View style={styles.iconBox}>
                                    <Feather name="home" size={20} color={THEME.primary} />
                                </View>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity onPress={() => openModalForEdit(addr)} style={styles.iconButton}>
                                        <Feather name="edit-2" size={18} color={THEME.textMuted} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDelete(addr._id)} style={[styles.iconButton, { marginLeft: 12 }]}>
                                        <Feather name="trash-2" size={18} color={THEME.danger} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={styles.addressValue}>{addr.fullAddress}</Text>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Add / Edit Modal */}
            <Modal visible={isModalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={styles.modalTitle}>{editingAddressId ? "Edit Address" : "Add New Address"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 4 }}>
                                <Feather name="x" size={24} color={THEME.textMuted} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            <Text style={styles.inputSubLabel}>House / Flat / Block No.*</Text>
                            <TextInput
                                style={styles.addressInput}
                                placeholder="e.g. Flat 4B, Skyline Apartments"
                                placeholderTextColor={THEME.textMuted}
                                value={houseDetails}
                                onChangeText={setHouseDetails}
                            />

                            <Text style={styles.inputSubLabel}>Area / Street / Sector*</Text>
                            <TextInput
                                style={styles.addressInput}
                                placeholder="e.g. MG Road, Near City Center"
                                placeholderTextColor={THEME.textMuted}
                                value={areaDetails}
                                onChangeText={setAreaDetails}
                                multiline
                            />

                            <Text style={styles.inputSubLabel}>Landmark (Optional)</Text>
                            <TextInput
                                style={styles.addressInput}
                                placeholder="e.g. Opposite Metro Station"
                                placeholderTextColor={THEME.textMuted}
                                value={landmark}
                                onChangeText={setLandmark}
                            />

                            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveAddress}>
                                <Text style={styles.modalSaveText}>{editingAddressId ? "Update Address" : "Save Address"}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15, backgroundColor: THEME.card, borderBottomWidth: 1, borderBottomColor: THEME.border },
    backButton: { padding: 8, marginLeft: -8 },
    addButton: { padding: 8, marginRight: -8 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark },
    scrollContent: { padding: 16, paddingBottom: 40 },
    
    emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { color: THEME.textMuted, fontSize: 16, fontWeight: '500' },

    addressCard: { backgroundColor: THEME.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: THEME.border },
    addressCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    iconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center' },
    actionButtons: { flexDirection: 'row' },
    iconButton: { padding: 8, backgroundColor: THEME.background, borderRadius: 8 },
    addressValue: { fontSize: 14, color: THEME.textDark, lineHeight: 22 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: THEME.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingTop: 20, maxHeight: '90%' },
    modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '700', color: THEME.textDark },
    inputSubLabel: { fontSize: 13, fontWeight: '600', color: THEME.textDark, marginBottom: 6, marginTop: 12 },
    addressInput: { borderWidth: 1, borderColor: THEME.border, borderRadius: 10, padding: 12, fontSize: 15, color: THEME.textDark, backgroundColor: THEME.background },
    modalSaveBtn: { padding: 16, borderRadius: 12, backgroundColor: THEME.primary, alignItems: 'center', marginTop: 24 },
    modalSaveText: { color: '#FFF', fontWeight: '700', fontSize: 15 }
});