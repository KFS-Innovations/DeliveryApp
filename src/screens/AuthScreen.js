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

// NEW: Local Dark Theme Colors
const THEME = {
  background: '#F8FAFC',   // Soft, clean off-white for the main background
  surface: '#FFFFFF',      // Pure white for inputs and toggles to pop
  surfaceActive: '#E2E8F0', // Light slate for the active toggle button
  textPrimary: '#0F172A',  // Deep slate/near-black for highly readable text
  textMuted: '#64748B',    // Medium gray for placeholders and icons
  primary: '#10B981',      // Vibrant Emerald Green (unchanged)
  border: '#E2E8F0',       // Subtle light gray border
};

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Loading State
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
    if (!email || !password || (!isLogin && (!name || !phone))) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    
    const API_BASE_URL = `http://${process.env.EXPO_PUBLIC_IP}:5000/api/auth`;

    try {
      const endpoint = isLogin ? `${API_BASE_URL}/login` : `${API_BASE_URL}/register`;
      
      const payload = isLogin 
        ? { email, password } 
        : { name, email, phone, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        navigation.replace('Home');
      } else {
        Alert.alert('Authentication Failed', data.message || 'Something went wrong');
      }
    } catch (error) {
      console.error("Auth Error:", error);
      Alert.alert('Network Error', 'Could not connect to the server. Check your local IP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Changed StatusBar to light-content for Dark Mode */}
      <StatusBar barStyle="light-content" backgroundColor={THEME.background} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flexContainer}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Dynamic Header */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </Text>
            <Text style={styles.subtitle}>
              {isLogin 
                ? 'Sign in to continue your journey.' 
                : 'Join us and get your groceries delivered fast.'}
            </Text>
          </View>

          {/* Modern Toggle Switch */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity 
              style={[styles.toggleButton, isLogin && styles.activeToggleButton]} 
              onPress={() => toggleAuthMode(true)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>Log In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.toggleButton, !isLogin && styles.activeToggleButton]} 
              onPress={() => toggleAuthMode(false)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            
            {/* Full Name Input */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="user" size={20} color={THEME.textMuted} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="John Doe"
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
                <Feather name="mail" size={20} color={THEME.textMuted} style={styles.inputIcon} />
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
                  <Feather name="phone" size={20} color={THEME.textMuted} style={styles.inputIcon} />
                  <TextInput 
                    style={styles.input}
                    placeholder="+1 234 567 8900"
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
                <Feather name="lock" size={20} color={THEME.textMuted} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder={isLogin ? "••••••••" : "Create a strong password"}
                  placeholderTextColor={THEME.textMuted}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  <Feather name={showPassword ? "eye" : "eye-off"} size={20} color={THEME.textMuted} />
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
              style={[styles.primaryButton, !isLogin && { marginTop: 10 }]} 
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isLogin ? 'Log In' : 'Sign Up'}
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 40 },
  
  headerContainer: { marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: THEME.textPrimary, marginBottom: 8, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: THEME.textMuted, fontWeight: '400', lineHeight: 22 },
  
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: THEME.surface,
    borderRadius: 20,
    padding: 6,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  activeToggleButton: {
    backgroundColor: THEME.surfaceActive,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: THEME.textMuted,
  },
  activeToggleText: {
    color: THEME.textPrimary,
    fontWeight: '800',
  },

  formContainer: { marginBottom: 30 },
  inputGroup: { marginBottom: 22 },
  label: { fontSize: 13, fontWeight: '700', color: THEME.textPrimary, marginBottom: 10, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: THEME.surface, 
    borderRadius: 16, 
    paddingHorizontal: 18, 
    height: 60, 
    borderWidth: 1, 
    borderColor: THEME.border 
  },
  inputIcon: { marginRight: 14 },
  input: { flex: 1, fontSize: 16, color: THEME.textPrimary, fontWeight: '500' },
  eyeIcon: { padding: 4 },
  
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotPasswordText: { fontSize: 14, fontWeight: '700', color: THEME.primary },
  
  primaryButton: { 
    backgroundColor: THEME.primary, 
    borderRadius: 16, 
    height: 60, 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: THEME.primary, 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 10, 
    elevation: 6 
  },
  primaryButtonText: { color: THEME.background, fontSize: 17, fontWeight: '900', letterSpacing: 0.5 },
});