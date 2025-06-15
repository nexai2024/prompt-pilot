'use client';

import { useState, useEffect } from 'react';
import { organizations } from '../database';
import { useAuth } from './useAuth';

export function useOrganization() {
  const { user } = useAuth();
  const [currentOrg, setCurrentOrg] = useState<any>(null);
  const [userOrgs, setUserOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrganizations();
    } else {
      setCurrentOrg(null);
      setUserOrgs([]);
      setLoading(false);
    }
  }, [user]);

  const loadOrganizations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const orgs = await organizations.getByUserId(user.id);
      setUserOrgs(orgs);
      
      // Set the first organization as current if none is selected
      if (orgs.length > 0 && !currentOrg) {
        setCurrentOrg(orgs[0]);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = (org: any) => {
    setCurrentOrg(org);
  };

  const createOrganization = async (orgData: {
    name: string;
    slug: string;
    description?: string;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const newOrg = await organizations.create({
      ...orgData,
      created_by: user.id,
    });

    // Add user as owner
    // This would be handled by the organization creation logic
    
    await loadOrganizations();
    setCurrentOrg(newOrg);
    return newOrg;
  };

  return {
    currentOrg,
    userOrgs,
    loading,
    switchOrganization,
    createOrganization,
    refreshOrganizations: loadOrganizations,
  };
}