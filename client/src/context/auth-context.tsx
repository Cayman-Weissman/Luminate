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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log("Checking auth status...");
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (res.ok) {
          const userData = await res.json();
          console.log("User authenticated:", userData);
          setUser(userData);
        } else {
          console.log("User not authenticated:", res.status);
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
        credentials: 'include'
      });
      
      console.log("Auth context - Login response status:", loginRes.status);
      
      if (!loginRes.ok) {
        console.error("Auth context - Login response error:", await loginRes.text());
        throw new Error(`Login failed with status: ${loginRes.status}`);
      }
      
      const userData = await loginRes.json();
      console.log("Auth context - Login successful, user data:", userData);
      setUser(userData);
      
      // Refresh authentication status to ensure client state is updated
      console.log("Auth context - Verifying session with /auth/me");
      await new Promise(resolve => setTimeout(resolve, 300)); // Longer delay to ensure session is ready
      
      const meRes = await fetch('/api/auth/me', { 
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log("Auth context - Session verification response:", meRes.status);
      
      if (meRes.ok) {
        const refreshedData = await meRes.json();
        console.log("Auth context - Session verified, user data:", refreshedData);
        setUser(refreshedData);
      } else {
        console.warn("Auth context - Session verification failed despite successful login");
        const errorText = await meRes.text();
        console.error("Auth context - /auth/me error details:", errorText);
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
      await apiRequest('POST', '/api/auth/register', { username, email, password });
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
      await apiRequest('POST', '/api/auth/logout', {});
      setUser(null);
    } catch (err) {
      setError('Logout failed');
      throw err;
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
