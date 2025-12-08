import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  profile?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    company?: string;
    bio?: string;
    timezone?: string;
    email_notifications?: boolean;
    marketing_notifications?: boolean;
  };
}

export const auth = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData?: {
    firstName?: string;
    lastName?: string;
    company?: string;
  }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: userData?.firstName,
            last_name: userData?.lastName,
            company: userData?.company,
          }
        }
      });

      if (error) throw error;

      // Create profile record
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            first_name: userData?.firstName,
            last_name: userData?.lastName,
            company: userData?.company,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        // Note: Default organization is created automatically by database trigger
      }

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) return null;

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        ...user,
        profile,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Update user profile
  async updateProfile(updates: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    company?: string;
    bio?: string;
    timezone?: string;
    email_notifications?: boolean;
    marketing_notifications?: boolean;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  // Reset password
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  // Update password
  async updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (session?.user) {
          const user = await auth.getCurrentUser();
          callback(user);
        } else {
          callback(null);
        }
      })();
    });

    return subscription;
  },
};