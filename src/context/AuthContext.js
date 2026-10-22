import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if a user is already logged in when the app starts
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to load user data", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (backendResponse) => {
    try {
      // 1. Save the user object to state and local storage
      setUser(backendResponse.user);
      await AsyncStorage.setItem('userData', JSON.stringify(backendResponse.user));
      
      // 2. Explicitly save the token and the userId
      if (backendResponse.token) {
        await AsyncStorage.setItem('authToken', backendResponse.token);
        
        // Safely check for both _id (MongoDB default) and id (common backend formatting)
        const userId = backendResponse.user._id || backendResponse.user.id;
        
        if (userId) {
            // Convert to string just in case, as AsyncStorage requires string values
            await AsyncStorage.setItem('userId', String(userId)); 
        } else {
            console.error("⚠️ Login successful, but no ID found in backend response.");
        }
      }
    } catch (error) {
      console.error("Failed to save user data", error);
    }
  };

  // Call this function to log the user out
  const logout = async () => {
    try {
      setUser(null);
      // Remove BOTH keys when logging out
      await AsyncStorage.removeItem('userData');
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userId'); 
    } catch (error) {
      console.error("Failed to clear user data", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};