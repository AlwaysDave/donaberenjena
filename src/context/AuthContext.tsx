import React, { createContext, useContext, useState, useEffect } from 'react';
import { AdminRole, AdminUser } from '../types';
import { getStoredAdminSession, saveStoredAdminSession } from '../services/firebase';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  login: (email: string, role?: AdminRole) => Promise<void>;
  loginAsDemo: (role: AdminRole) => void;
  switchRole: (role: AdminRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredAdminSession());

  useEffect(() => {
    saveStoredAdminSession(user);
  }, [user]);

  const login = async (email: string, role: AdminRole = 'advanced') => {
    // In production with Firebase Auth, signInWithEmailAndPassword would be called.
    const newUser: AdminUser = {
      uid: 'admin-' + Math.random().toString(36).substring(2, 9),
      email: email || 'admin@donaberenjena.es',
      name: email.split('@')[0] || 'Administrador',
      role: role,
      isDemo: false
    };
    setUser(newUser);
  };

  const loginAsDemo = (role: AdminRole) => {
    const demoUser: AdminUser = {
      uid: 'demo-' + role,
      email: role === 'advanced' ? 'directiva@donaberenjena.es' : 'coordinacion@donaberenjena.es',
      name: role === 'advanced' ? 'Dirección Gastronómica' : 'Coordinador de Sala',
      role: role,
      isDemo: true
    };
    setUser(demoUser);
  };

  const switchRole = (role: AdminRole) => {
    if (user) {
      setUser({
        ...user,
        role
      });
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginAsDemo, switchRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
