'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../supabase';

export function useOrganization() {
  const { user } = useAuth();
  const [currentOrganization, setCurrentOrganization] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    } else {
      setCurrentOrganization(null);
      setOrganizations([]);
      setLoading(false);
    }
  }, [user]);

  const loadOrganizations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: memberOrgs, error } = await supabase
        .from('organization_members')
        .select(`
          role,
          organization:organizations(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const orgs = memberOrgs?.map((m: any) => ({
        ...m.organization,
        user_role: m.role
      })) || [];

      setOrganizations(orgs);

      // Set the first organization as current if none is selected
      if (orgs.length > 0 && !currentOrganization) {
        setCurrentOrganization(orgs[0]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = (org: any) => {
    setCurrentOrganization(org);
    localStorage.setItem('currentOrgId', org.id);
  };

  const createOrganization = async (orgData: {
    name: string;
    slug: string;
    description?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert([{
        ...orgData,
        created_by: user.id,
      }])
      .select()
      .single();

    if (createError) throw createError;

    // Add user as owner
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert([{
        organization_id: newOrg.id,
        user_id: user.id,
        role: 'owner'
      }]);

    if (memberError) throw memberError;

    await loadOrganizations();
    setCurrentOrganization(newOrg);
    return newOrg;
  };

  return {
    currentOrganization,
    organizations,
    loading,
    switchOrganization,
    createOrganization,
    refreshOrganizations: loadOrganizations,
  };
}