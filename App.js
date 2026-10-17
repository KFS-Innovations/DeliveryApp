import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather, Ionicons } from '@expo/vector-icons';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProductDetailsScreen from './src/screens/ProductDetailsScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { AuthProvider } from './src/context/AuthContext';
import OrderStatusScreen from './src/screens/OrderStatusScreen';
import OrdersScreen from './src/screens/OrdersScreen';

import { TouchableOpacity } from 'react-native';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// --- NEW: Bottom Tab Navigator ---
function MainTabs() {
  return (
<Tab.Navigator
      screenOptions={({ route }) => ({ 
        headerShown: false,
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#64748B',
        
        tabBarButton: (props) => (
          <TouchableOpacity {...props} activeOpacity={1} /> 
        ),
        
        tabBarStyle: { 
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 60,
          paddingBottom: 10,
          paddingTop: 4
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <Ionicons name="home" size={22} color={color} />;
          } else if (route.name === 'Orders') {
            return <Feather name="file-text" size={22} color={color} />;
          } else if (route.name === 'Offers') {
            return <Feather name="message-circle" size={22} color={color} />;
          } else if (route.name === 'Profile') {
            return <Feather name="user" size={22} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// --- UPDATED: Master Stack Navigator ---
export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator 
          initialRouteName="Auth"
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          
          <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="OrderStatus" component={OrderStatusScreen} />
          <Stack.Screen name="Orders" component={OrdersScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}