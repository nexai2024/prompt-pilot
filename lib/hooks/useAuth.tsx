'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { createBrowserClient } from '../supabase-browser';
import { auth, type AuthUser } from '../auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, userData?: {
    firstName?: string;
    lastName?: string;
    company?: string;
  }) => Promise<any>;
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

    const supabase = createBrowserClient();

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        auth.getCurrentUser().then((user) => {
          setUser(user);
          setLoading(false);
        }).catch((error) => {
          console.error('Error getting current user:', error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] Auth state changed:', event, !!session);

      if (session?.user) {
        const user = await auth.getCurrentUser();
        setUser(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log('[useAuth] Starting sign in...');
      const result = await auth.signIn(email, password);
      console.log('[useAuth] Sign in successful, getting user data...');

      // Wait a moment for the session to be fully set
      await new Promise(resolve => setTimeout(resolve, 100));

      const user = await auth.getCurrentUser();
      console.log('[useAuth] User data retrieved:', { hasUser: !!user, userId: user?.id });

      setUser(user);
      setLoading(false);

      console.log('[useAuth] Sign in complete');
      return result;
    } catch (error) {
      console.error('[useAuth] Sign in error:', error);
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
      console.log('[useAuth] Starting sign up...');
      const result = await auth.signUp(email, password, userData);
      console.log('[useAuth] Sign up successful, getting user data...');

      // Wait a moment for the session to be fully set
      await new Promise(resolve => setTimeout(resolve, 100));

      const user = await auth.getCurrentUser();
      console.log('[useAuth] User data retrieved:', { hasUser: !!user, userId: user?.id });

      setUser(user);
      setLoading(false);

      console.log('[useAuth] Sign up complete');
      return result;
    } catch (error) {
      console.error('[useAuth] Sign up error:', error);
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