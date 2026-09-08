import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, TokenResponse } from '../types';
import { api, ApiError } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: string) => Promise<User>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isBeekeeper: () => boolean;
  isProcessor: () => boolean;
  isLab: () => boolean;
  isCollector: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('honeychain_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('honeychain_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async () => {
    try {
      const profile = await api.get<User>('/api/v1/auth/me');
      setUser(profile);
      localStorage.setItem('honeychain_user', JSON.stringify(profile));
      return profile;
    } catch (err) {
      console.warn('Session verification failed, clearing credentials:', err);
      setUser(null);
      setToken(null);
      localStorage.removeItem('honeychain_token');
      localStorage.removeItem('honeychain_user');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }

    const handleExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [token, fetchProfile]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await api.post<TokenResponse>('/api/v1/auth/login/json', { email, password });
      const authToken = res.access_token;
      localStorage.setItem('honeychain_token', authToken);
      setToken(authToken);

      // Fetch verified user profile with the token
      const profile = await api.get<User>('/api/v1/auth/me', undefined, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(profile);
      localStorage.setItem('honeychain_user', JSON.stringify(profile));
      return profile;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: string): Promise<User> => {
    setIsLoading(true);
    try {
      const newUser = await api.post<User>('/api/v1/auth/register', { name, email, password, role });
      // Auto login after registration
      await login(email, password);
      return newUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('honeychain_token');
    localStorage.removeItem('honeychain_user');
    setUser(null);
    setToken(null);
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isBeekeeper = () => user?.role === 'BEEKEEPER';
  const isProcessor = () => user?.role === 'PROCESSOR';
  const isLab = () => user?.role === 'LAB';
  const isCollector = () => user?.role === 'COLLECTOR';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        isAdmin,
        isBeekeeper,
        isProcessor,
        isLab,
        isCollector,
      }}
    >
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
