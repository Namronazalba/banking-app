import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthState } from '../types/banking';
import {
  getCurrentUser,
  setCurrentUser,
  findUserByEmail,
  saveUser,
  generateId,
  initializeDemoData,
} from '../utils/storage';

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check for admin login
    if (email === 'admin@bankwithnorms.com' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin-001',
        email: 'admin@bankwithnorms.com',
        firstName: 'Super',
        lastName: 'Admin',
        phone: '+1 (555) 999-0000',
        address: 'BankWithNorms HQ',
        pin: '0000',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      setUser(adminUser);
      setIsAuthenticated(true);
      setCurrentUser(adminUser);
      return true;
    }
    if (email === 'testuser@bankwithnorms.com' && password === '123456') {
      const normalUser: User = {
        id: 'user-001',
        email: 'testuser@bankwithnorms.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '+63 900 000 0000',
        address: 'Quezon City, Philippines',
        pin: '1234',
        role: 'user',
        createdAt: new Date().toISOString(),
      };

      setUser(normalUser);
      setIsAuthenticated(true);
      setCurrentUser(normalUser);

      return true;
    }
    const foundUser = findUserByEmail(email);
    
    // For demo purposes, accept any password that's at least 6 characters
    // In production, you'd verify against hashed password
    if (foundUser && password.length >= 6) {
      setUser(foundUser);
      setIsAuthenticated(true);
      setCurrentUser(foundUser);
      initializeDemoData(foundUser.id);
      return true;
    }
    
    return false;
  };

  const signup = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if user already exists
    const existingUser = findUserByEmail(userData.email);
    if (existingUser) {
      return false;
    }
    
    const newUser: User = {
      ...userData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    
    saveUser(newUser);
    setUser(newUser);
    setIsAuthenticated(true);
    setCurrentUser(newUser);
    initializeDemoData(newUser.id);
    
    return true;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const verifyPin = (pin: string): boolean => {
    return user ? user.pin === pin : false;
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout, verifyPin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthState => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};