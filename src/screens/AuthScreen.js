import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  StatusBar,
  LayoutAnimation,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// NEW: "Farm & Sea" Premium Fresh Market Theme
const THEME = {
  background: '#FFFFFF',   // Crisp clean white
  surface: '#F8FAFC',      // Very light slate for inputs
  surfaceActive: '#FEF2F2', // Light coral/red tint for active states
  textPrimary: '#0F172A',  // Deep navy/slate for text
  textMuted: '#64748B',    // Medium slate for placeholders
  primary: '#E11D48',      // Vibrant Crimson (Appetizing for meat/fresh food)
  border: '#E2E8F0',       // Soft border
  accent: '#0EA5E9',       // Ocean Blue accent for fish/seafood vibes
};

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useContext(AuthContext);
  
  // Form State (Logic Unchanged)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Loading State (Logic Unchanged)
  const [isLoading, setIsLoading] = useState(false);

  const toggleAuthMode = (mode) => {
    if (isLogin !== mode) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsLogin(mode);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setShowPassword(false); 
    }
  };

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanEmail || !password || (!isLogin && (!cleanName || !cleanPhone))) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    const rootUrl = process.env.EXPO_PUBLIC_API_URL;
    const API_BASE_URL = `${rootUrl.replace(/\/+$/, '')}/api/auth`;

    try {
      const endpoint = isLogin ? `${API_BASE_URL}/login` : `${API_BASE_URL}/register`;

      const payload = isLogin
        ? { email: cleanEmail, password }
        : { name: cleanName, email: cleanEmail, phone: cleanPhone, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        await login(data);
      } else {
        Alert.alert('Authentication Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error('Auth Error:', error);
      Alert.alert(
        'Network Error',
        'Could not connect to the server. Please check your connection or try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Brand Visuals */}
          <View style={styles.brandContainer}>
            <View style={styles.iconRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF2F2' }]}>
                <Feather name="box" size={24} color={THEME.primary} />
              </View>
              <View style={[styles.iconCircle, { backgroundColor: '#F0F9FF', marginHorizontal: -10, zIndex: 1, borderWidth: 3, borderColor: THEME.background }]}>
                <Feather name="anchor" size={24} color={THEME.accent} />
              </View>
              <View style={[styles.iconCircle, { backgroundColor: '#FEFCE8', borderWidth: 3, borderColor: THEME.background }]}>
                <Feather name="sun" size={24} color="#D97706" />
              </View>
            </View>
            {/* <Text style={styles.brandTags}>MEAT • FISH • PURE OILS</Text> */}
          </View>

          {/* Dynamic Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>
              {isLogin ? 'Welcome Back' : 'Freshness Delivered'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin 
                ? 'Sign in to order premium cuts and fresh catch.' 
                : 'Join us for farm-fresh meat, seafood, and pure coconut oil.'}
  
             </Text>
          </View>

          {/* Pill-shaped Segmented Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, isLogin && styles.activeToggleButton]} 
              onPress={() => toggleAuthMode(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.toggleButton, !isLogin && styles.activeToggleButton]} 
              onPress={() => toggleAuthMode(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>Register</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            
            {/* Full Name Input */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="user" size={18} color={THEME.textMuted} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="Enter your name"
                    placeholderTextColor={THEME.textMuted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>
            )}

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={18} color={THEME.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="hello@example.com"
                  placeholderTextColor={THEME.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Phone Number Input */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="phone" size={18} color={THEME.textMuted} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="+91 98765 43210"
                    placeholderTextColor={THEME.textMuted}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>
            )}

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={18} color={THEME.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder={isLogin ? "••••••••" : "Create a strong password"}
                  placeholderTextColor={THEME.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Feather name={showPassword ? "eye" : "eye-off"} size={18} color={THEME.textMuted} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Forgot Password */}
            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            {/* Submit Button */}
            <TouchableOpacity 
              style={[styles.primaryButton, !isLogin && { marginTop: 12 }]} 
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isLogin ? 'Log In to Order' : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background },
  flexContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 24 },
  
  brandContainer: { alignItems: 'center', marginBottom: 28, marginTop: 10 },
  iconRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  iconCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  // brandTags: { fontSize: 12, fontWeight: '700', color: THEME.textPrimary, letterSpacing: 1.5 },
  
  headerContainer: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: THEME.textPrimary, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: THEME.textMuted, fontWeight: '500', lineHeight: 22, textAlign: 'center', paddingHorizontal: 16 },
  
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderRadius: 30,
    padding: 4,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
  },
  activeToggleButton: {
    backgroundColor: THEME.background,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  activeToggleText: {
    color: '#10B981',
    fontWeight: '700',
  },

  formContainer: { marginBottom: 20 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '600', color: THEME.textPrimary, marginBottom: 8, marginLeft: 4 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: THEME.surface, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    height: 56, 
    borderWidth: 1, 
    borderColor: THEME.surface,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: THEME.textPrimary, fontWeight: '500' },
  eyeIcon: { padding: 8 },
  
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -4 },
  forgotPasswordText: { fontSize: 13, fontWeight: '700', color: '#10B981' },
  
  primaryButton: { 
    backgroundColor: '#10B981', 
    borderRadius: 16, 
    height: 56, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: THEME.primary, 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 8, 
    elevation: 5 
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});