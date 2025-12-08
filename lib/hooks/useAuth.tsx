'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { auth, type AuthUser } from '../auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: {
    firstName?: string;
    lastName?: string;
    company?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Get initial user
    auth.getCurrentUser().then((user) => {
      setUser(user);
      setLoading(false);
    }).catch((error) => {
      console.error('Error getting current user:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const subscription = auth.onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await auth.signIn(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, userData?: {
    firstName?: string;
    lastName?: string;
    company?: string;
  }) => {
    setLoading(true);
    try {
      await auth.signUp(email, password, userData);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const updatedProfile = await auth.updateProfile(updates);
      if (user) {
        setUser({
          ...user,
          profile: { ...user.profile, ...updatedProfile },
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}