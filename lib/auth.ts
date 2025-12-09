import { createBrowserClient } from './supabase-browser';
import type { User } from '@supabase/supabase-js';

const supabase = createBrowserClient();

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
      console.log('Attempting sign up for:', email);

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

      console.log('Sign up response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error ? {
          message: error.message,
          status: error.status,
          name: error.name
        } : null
      });

      if (error) {
        const errorMessage = this.getReadableErrorMessage(error);
        throw new Error(errorMessage);
      }

      // Create profile record
      if (data.user) {
        console.log('Creating profile for user:', data.user.id);

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
          // Don't throw here, profile might already exist from trigger
        }

        // Note: Default organization is created automatically by database trigger
      }

      return data;
    } catch (error: any) {
      console.error('Sign up error details:', {
        message: error?.message,
        status: error?.status,
        name: error?.name,
        error: error
      });
      throw error;
    }
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      console.log('Attempting sign in for:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in response:', {
        hasData: !!data,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        error: error ? {
          message: error.message,
          status: error.status,
          name: error.name
        } : null
      });

      if (error) {
        const errorMessage = this.getReadableErrorMessage(error);
        throw new Error(errorMessage);
      }

      if (!data.user || !data.session) {
        throw new Error('Sign in failed - no user session created');
      }

      return data;
    } catch (error: any) {
      console.error('Sign in error details:', {
        message: error?.message,
        status: error?.status,
        name: error?.name,
        error: error
      });
      throw error;
    }
  },

  // Helper to get readable error messages
  getReadableErrorMessage(error: any): string {
    if (!error) return 'An unknown error occurred';

    const message = error.message || error.msg || '';

    // Map common Supabase errors to user-friendly messages
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }
    if (message.includes('User not found')) {
      return 'No account found with this email address.';
    }
    if (message.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }
    if (message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (error.status === 400) {
      return 'Invalid request. Please check your email and password.';
    }
    if (error.status === 429) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (error.status === 500) {
      return 'Server error. Please try again later.';
    }

    // Return the original message if no mapping found
    return message || 'Sign in failed. Please try again.';
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