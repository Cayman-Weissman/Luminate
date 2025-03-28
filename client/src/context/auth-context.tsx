import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Token management functions
const getToken = (): string | null => localStorage.getItem('authToken');
const setToken = (token: string): void => localStorage.setItem('authToken', token);
const removeToken = (): void => localStorage.removeItem('authToken');

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in by checking for token
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = getToken();
      
      try {
        console.log("Checking auth status...");
        if (!token) {
          console.log("No auth token found");
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // Include token in Authorization header
        const res = await fetch('/api/auth/me', { 
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-cache'
        });
        
        if (res.ok) {
          const userData = await res.json();
          console.log("User authenticated:", userData);
          setUser(userData);
        } else {
          console.log("Token invalid or expired:", res.status);
          removeToken(); // Clear invalid token
          setUser(null);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setUser(null);
        setError('Failed to fetch user data');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Auth context - Starting login with username:", username);
      
      // Request login with fetch directly for more control
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        cache: 'no-cache' // Prevent caching of the request
      });
      
      console.log("Auth context - Login response status:", loginRes.status);
      
      if (!loginRes.ok) {
        console.error("Auth context - Login response error:", await loginRes.text());
        throw new Error(`Login failed with status: ${loginRes.status}`);
      }
      
      const loginData = await loginRes.json();
      console.log("Auth context - Login successful");
      
      // Store the JWT token in localStorage
      if (loginData.token) {
        setToken(loginData.token);
        console.log("Auth context - Token stored in localStorage");
      } else {
        console.error("Auth context - No token received from server");
        throw new Error("No authentication token received");
      }
      
      // Set user data if included in response, or fetch it
      if (loginData.user) {
        console.log("Auth context - User data from login:", loginData.user);
        setUser(loginData.user);
      } else {
        // Fetch fresh user data using the token
        console.log("Auth context - Fetching user data with token");
        const meRes = await fetch('/api/auth/me', { 
          headers: {
            'Authorization': `Bearer ${loginData.token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-cache'
        });
        
        if (meRes.ok) {
          const userData = await meRes.json();
          console.log("Auth context - User data fetched:", userData);
          setUser(userData);
        } else {
          console.error("Auth context - Failed to fetch user data after login");
          throw new Error("Failed to fetch user data after login");
        }
      }
    } catch (err) {
      console.error("Auth context - Login error:", err);
      setError('Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/auth/register', { username, email, password });
      
      // If registration returns a token, store it and log in the user
      if (response && typeof response === 'object' && 'token' in response) {
        setToken(response.token);
        if ('user' in response) {
          setUser(response.user || null);
        }
      }
    } catch (err) {
      setError('Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Include the token in the logout request
      const token = getToken();
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Clear token and user state regardless of server response
      removeToken();
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
      // Still remove token and user data on error
      removeToken();
      setUser(null);
      setError('Logout encountered an error');
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
