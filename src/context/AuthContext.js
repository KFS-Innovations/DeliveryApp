import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session when the app opens
  useEffect(() => {
    const loadUser = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem('userData'),
          AsyncStorage.getItem('authToken'),
        ]);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedToken) {
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Pass the full response object: login({ token: data.token, user: data.user })
  const login = async (backendResponse) => {
    try {
      const nextUser = backendResponse?.user || null;
      const nextToken = backendResponse?.token || null;

      if (!nextUser) {
        console.error('Login called without user object in backendResponse');
        return;
      }

      setUser(nextUser);
      setToken(nextToken);

      await AsyncStorage.setItem('userData', JSON.stringify(nextUser));

      if (nextToken) {
        await AsyncStorage.setItem('authToken', nextToken);

        const userId = nextUser._id || nextUser.id;
        if (userId) {
          await AsyncStorage.setItem('userId', String(userId));
        } else {
          console.warn('Login successful, but no _id or id found on user object.');
        }
      }
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  // Call ONLY when the user explicitly logs out
  const logout = async () => {
    try {
      setUser(null);
      setToken(null);
      await AsyncStorage.multiRemove(['userData', 'authToken', 'userId']);
    } catch (error) {
      console.error('Failed to clear user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};