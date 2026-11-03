import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const THEME = {
    primary: '#10B981',
    textDark: '#1E293B',
    textMuted: '#64748B',
    background: '#F8FAFC', // Changed to a soft off-white for premium feel
    card: '#FFFFFF',
    border: '#E2E8F0',
};

// Helper to determine the hero icon based on the policy title
const getIconForTitle = (title) => {
    const t = title.toLowerCase();
    if (t.includes('contact')) return 'headphones';
    if (t.includes('terms')) return 'file-text';
    if (t.includes('privacy')) return 'shield';
    if (t.includes('refund')) return 'refresh-ccw';
    if (t.includes('shipping')) return 'truck';
    return 'info';
};

export default function PolicyScreen({ route, navigation }) {
    const { pageData } = route.params;

    if (!pageData) return null;

    const heroIcon = getIconForTitle(pageData.title);

    // Smart Text Parser to format the raw text data beautifully
    const renderContent = (content) => {
        return content.split('\n').map((line, index) => {
            const trimmedLine = line.trim();
            
            // Empty lines become spacing
            if (trimmedLine === '') {
                return <View key={index} style={styles.spacer} />;
            }
            
            // Bullet points
            if (trimmedLine.startsWith('•')) {
                return (
                    <View key={index} style={styles.bulletRow}>
                        <View style={styles.bulletDot} />
                        <Text style={styles.bulletText}>{trimmedLine.replace('•', '').trim()}</Text>
                    </View>
                );
            }
            
            // Section Headers (e.g., "1. General Use", "Get in Touch", "Last Updated")
            const isSectionHeader = /^\d+\.\s/.test(trimmedLine) || trimmedLine.includes('Last Updated') || trimmedLine === 'Get in Touch';
            
            if (isSectionHeader) {
                return (
                    <Text key={index} style={trimmedLine.includes('Last Updated') ? styles.dateText : styles.sectionHeading}>
                        {trimmedLine}
                    </Text>
                );
            }
            
            // Standard Paragraphs
            return (
                <Text key={index} style={styles.bodyText}>
                    {trimmedLine}
                </Text>
            );
        });
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={THEME.card} />
            
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color={THEME.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Legal & Policies</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                
                <View style={styles.heroCard}>
                    <View style={styles.iconCircle}>
                        <Feather name={heroIcon} size={28} color={THEME.primary} />
                    </View>
                    <Text style={styles.pageTitle}>{pageData.title}</Text>
                </View>

                <View style={styles.documentCard}>
                    {renderContent(pageData.content)}
                </View>
                
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.background },
    
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: THEME.card, borderBottomWidth: 1, borderBottomColor: THEME.border },
    backBtn: { padding: 8, marginLeft: -8 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: THEME.textDark },
    
    contentContainer: { padding: 20, paddingBottom: 60 },
    
    heroCard: { alignItems: 'center', marginBottom: 24, marginTop: 10 },
    iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    pageTitle: { fontSize: 24, fontWeight: '800', color: THEME.textDark, textAlign: 'center' },
    
    documentCard: { backgroundColor: THEME.card, borderRadius: 20, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
    
    // Parsed Text Styles
    spacer: { height: 16 },
    dateText: { fontSize: 13, fontWeight: '600', color: THEME.textMuted, marginBottom: 16, fontStyle: 'italic' },
    sectionHeading: { fontSize: 17, fontWeight: '700', color: THEME.textDark, marginTop: 12, marginBottom: 8 },
    bodyText: { fontSize: 15, color: '#334155', lineHeight: 24, fontWeight: '400' },
    
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8, paddingRight: 10 },
    bulletDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.primary, marginTop: 10, marginRight: 12, marginLeft: 4 },
    bulletText: { flex: 1, fontSize: 15, color: '#334155', lineHeight: 24, fontWeight: '400' }
});