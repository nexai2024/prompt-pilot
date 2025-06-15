import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  profile?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    company?: string;
  };
}

export const auth = {
  // Sign up with email and password
  async signUp(email: string, password: string, userData?: {
    firstName?: string;
    lastName?: string;
    company?: string;
  }) {
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

      // Create default organization for the user
      const orgSlug = `${userData?.firstName?.toLowerCase() || 'user'}-${Date.now()}`;
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: userData?.company || `${userData?.firstName}'s Organization`,
          slug: orgSlug,
          created_by: data.user.id,
        })
        .select()
        .single();

      if (!orgError && orgData) {
        // Add user as owner of the organization
        await supabase
          .from('organization_members')
          .insert({
            organization_id: orgData.id,
            user_id: data.user.id,
            role: 'owner',
          });
      }
    }

    return data;
  },

  // Sign in with email and password
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  // Sign out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
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
  },

  // Reset password
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  },

  // Update password
  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) throw error;
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser();
        callback(user);
      } else {
        callback(null);
      }
    });

    return subscription;
  },
};