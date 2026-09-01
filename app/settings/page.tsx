'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft,
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Key,
  Globe,
  Trash2,
  Save,
  Upload,
  Copy,
  Eye,
  EyeOff,
  Plus,
  AlertTriangle,
  Loader2,
  Users
} from 'lucide-react';

interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt?: string | null;
  createdAt?: string | null;
}

interface TeamMemberRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
}

interface ProfileRecord {
  first_name?: string | null;
  last_name?: string | null;
  email?: string;
  company?: string | null;
  bio?: string | null;
  timezone?: string | null;
  avatar_url?: string | null;
  email_notifications?: boolean | number | null;
  marketing_notifications?: boolean | number | null;
}

interface SubscriptionRecord {
  plan_name?: string | null;
  status?: string | null;
  current_period_end?: string | null;
}

interface DnsRecordInstructions {
  type: string;
  host: string;
  hostRelative: string;
  target?: string;
  value?: string;
  required?: boolean;
  purpose?: string;
}

interface DomainSettings {
  vanitySubdomain: string | null;
  customDomain: string | null;
  customDomainVerified: boolean;
  verificationToken: string | null;
  txtVerificationHost: string | null;
  baseDomain: string;
  cnameTarget: string;
  dns: {
    domain: string;
    cname: DnsRecordInstructions;
    txt: DnsRecordInstructions;
  } | null;
  previews: {
    production: string;
    staging: string;
    development: string;
  } | null;
}

export default function SettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberRecord[]>([]);
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('utc+0');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingNotifications, setMarketingNotifications] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [domains, setDomains] = useState<DomainSettings | null>(null);
  const [vanitySubdomainInput, setVanitySubdomainInput] = useState('');
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [savingDomains, setSavingDomains] = useState(false);
  const [verifyingDns, setVerifyingDns] = useState(false);
  const [dnsCheckStatus, setDnsCheckStatus] = useState<string | null>(null);
  const [creatingApiKey, setCreatingApiKey] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [newApiKeyName, setNewApiKeyName] = useState('Production API Key');
  const [revokingKeyId, setRevokingKeyId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: false,
    alerts: true,
    marketing: false
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const response = await fetch('/api/settings', { credentials: 'include' });
        const data = await response.json();

        if (response.ok) {
          setApiKeys(data.apiKeys || []);
          setTeamMembers(data.teamMembers || []);
          setProfile(data.profile || null);
          setSubscription(data.subscription || null);
          setUserEmail(data.user?.email || '');
          setUserName(data.user?.name || '');
          const nameParts = String(data.user?.name || '')
            .trim()
            .split(/\s+/);
          setFirstName(data.profile?.first_name || nameParts[0] || '');
          setLastName(data.profile?.last_name || nameParts.slice(1).join(' ') || '');
          setProfileEmail(data.profile?.email || data.user?.email || '');
          setCompany(data.profile?.company || '');
          setBio(data.profile?.bio || '');
          const loadedTimezone = String(data.profile?.timezone || 'utc+0');
          setTimezone(
            loadedTimezone === 'UTC' || loadedTimezone === 'utc' ? 'utc+0' : loadedTimezone
          );
          setEmailNotifications(
            data.profile?.email_notifications !== false &&
              data.profile?.email_notifications !== 0
          );
          setMarketingNotifications(Boolean(data.profile?.marketing_notifications));
          setNotifications((current) => ({
            ...current,
            email:
              data.profile?.email_notifications !== false &&
              data.profile?.email_notifications !== 0,
            marketing: Boolean(data.profile?.marketing_notifications),
          }));
        }

        const domainsResponse = await fetch('/api/organizations/domains', {
          credentials: 'include',
        });
        const domainsData = await domainsResponse.json();
        if (domainsResponse.ok) {
          setDomains({
            vanitySubdomain: domainsData.organization?.vanitySubdomain || null,
            customDomain: domainsData.organization?.customDomain || null,
            customDomainVerified: domainsData.organization?.customDomainVerified || false,
            verificationToken: domainsData.organization?.verificationToken || null,
            txtVerificationHost: domainsData.organization?.txtVerificationHost || null,
            baseDomain: domainsData.baseDomain,
            cnameTarget: domainsData.cnameTarget,
            dns: domainsData.dns || null,
            previews: domainsData.previews || null,
          });
          setVanitySubdomainInput(domainsData.organization?.vanitySubdomain || '');
          setCustomDomainInput(domainsData.organization?.customDomain || '');
        }
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const saveProfile = async () => {
    if (!profileEmail.trim()) {
      toast.error('Email is required');
      return;
    }

    setSavingProfile(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: profileEmail,
          company,
          bio,
          timezone,
          email_notifications: emailNotifications,
          marketing_notifications: marketingNotifications,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }
      setProfile(data.profile || null);
      toast.success('Profile saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const saveVanitySubdomain = async () => {
    setSavingDomains(true);
    try {
      const response = await fetch('/api/organizations/domains', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vanity_subdomain: vanitySubdomainInput }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save subdomain');

      setDomains((current) =>
        current
          ? {
              ...current,
              vanitySubdomain: data.organization.vanitySubdomain,
              previews: data.previews,
            }
          : current
      );
      toast.success('Vanity subdomain saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save subdomain');
    } finally {
      setSavingDomains(false);
    }
  };

  const saveCustomDomain = async () => {
    setSavingDomains(true);
    try {
      const response = await fetch('/api/organizations/domains', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom_domain: customDomainInput,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save custom domain');

      setDomains((current) =>
        current
          ? {
              ...current,
              customDomain: data.organization.customDomain,
              customDomainVerified: data.organization.customDomainVerified,
              verificationToken: data.organization.verificationToken,
              txtVerificationHost: data.organization.txtVerificationHost,
              dns: data.dns || null,
            }
          : current
      );
      toast.success('Custom domain saved. Configure DNS, then verify.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save custom domain');
    } finally {
      setSavingDomains(false);
    }
  };

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  };

  const checkDnsPropagation = async () => {
    setDnsCheckStatus('Checking DNS records...');
    try {
      const response = await fetch('/api/tenant/context', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (data.verified) {
        setDnsCheckStatus(`Found via ${data.method?.toUpperCase() || 'DNS'} — ready to verify`);
      } else {
        setDnsCheckStatus(data.error || 'Records not detected yet. Wait for propagation and try again.');
      }
    } catch {
      setDnsCheckStatus('Could not check DNS status');
    }
  };

  const verifyCustomDomainDns = async () => {
    setVerifyingDns(true);
    try {
      const response = await fetch('/api/organizations/domains/verify', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok && data.verified) {
        setDomains((current) =>
          current
            ? { ...current, customDomainVerified: true }
            : current
        );
        toast.success(`Domain verified via ${data.method?.toUpperCase() || 'DNS'}`);
        return;
      }

      if (data.verification || data.dns) {
        setDomains((current) =>
          current
            ? {
                ...current,
                dns: data.dns || current.dns,
                verificationToken: data.verification?.txtValue || current.verificationToken,
                txtVerificationHost: data.verification?.txtHost || current.txtVerificationHost,
              }
            : current
        );
      }

      throw new Error(data.error || 'DNS verification failed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'DNS verification failed');
    } finally {
      setVerifyingDns(false);
    }
  };

  const createApiKey = async () => {
    setCreatingApiKey(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newApiKeyName.trim() || 'Production API Key' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to create API key');

      setNewApiKey(data.apiKey);
      const keysResponse = await fetch('/api/api-keys', { credentials: 'include' });
      const keysData = await keysResponse.json();
      if (keysResponse.ok) {
        setApiKeys(keysData.apiKeys || []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create API key');
    } finally {
      setCreatingApiKey(false);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    setRevokingKeyId(keyId);
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to revoke API key');

      setApiKeys((keys) => keys.filter((key) => key.id !== keyId));
      toast.success('API key revoked');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke API key');
    } finally {
      setRevokingKeyId(null);
    }
  };

  const profileInitials = [firstName, lastName]
    .filter(Boolean)
    .map((part) => String(part)[0])
    .join('') || userName?.split(' ').map((part) => part[0]).join('') || userEmail?.[0]?.toUpperCase() || '?';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={!!newApiKey} onOpenChange={(open) => !open && setNewApiKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your new API key</DialogTitle>
            <DialogDescription>
              Copy this key now. It will not be shown again. Use it for production gateway requests.
            </DialogDescription>
          </DialogHeader>
          {newApiKey && (
            <code className="block break-all rounded bg-gray-100 p-3 text-sm">{newApiKey}</code>
          )}
          <Button
            onClick={() => {
              if (newApiKey) {
                void navigator.clipboard.writeText(newApiKey);
                toast.success('API key copied');
              }
            }}
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy key
          </Button>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center space-x-2">
                <Settings className="w-6 h-6 text-gray-600" />
                <h1 className="text-xl font-bold text-gray-900">Settings</h1>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => void saveProfile()}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="domains">Domains</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your account profile information and email address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-6">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback>{profileInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Change Avatar
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      JPG, GIF or PNG. 1MB max.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input
                      id="first-name"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input
                      id="last-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileEmail}
                      onChange={(event) => setProfileEmail(event.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      value={company}
                      onChange={(event) => setCompany(event.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    className="mt-1"
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger id="timezone" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                      <SelectItem value="utc-7">Mountain Time (UTC-7)</SelectItem>
                      <SelectItem value="utc-6">Central Time (UTC-6)</SelectItem>
                      <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                      <SelectItem value="utc+0">UTC</SelectItem>
                      <SelectItem value="utc+1">Central European Time (UTC+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => void saveProfile()} disabled={savingProfile}>
                    {savingProfile ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {savingProfile ? 'Saving...' : 'Save profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Preferences</CardTitle>
                <CardDescription>
                  Configure your account preferences and default settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive email notifications for important updates</p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={(checked) => {
                      setEmailNotifications(checked);
                      setNotifications((current) => ({ ...current, email: checked }));
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Marketing Communications</Label>
                    <p className="text-sm text-gray-500">Receive emails about new features and updates</p>
                  </div>
                  <Switch
                    checked={marketingNotifications}
                    onCheckedChange={(checked) => {
                      setMarketingNotifications(checked);
                      setNotifications((current) => ({ ...current, marketing: checked }));
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Usage Analytics</Label>
                    <p className="text-sm text-gray-500">Help improve our service by sharing usage data</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Vanity Subdomain
                </CardTitle>
                <CardDescription>
                  Your tenant workspace URL. After login you are redirected here automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vanity-subdomain">Subdomain</Label>
                  <div className="flex mt-1 gap-2">
                    <Input
                      id="vanity-subdomain"
                      value={vanitySubdomainInput}
                      onChange={(e) => setVanitySubdomainInput(e.target.value)}
                      placeholder="your-company"
                    />
                    <span className="flex items-center text-sm text-gray-500 whitespace-nowrap">
                      .{domains?.baseDomain || 'beta.promptpilot.run'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    App URL: <code>{domains?.previews?.production || `https://${vanitySubdomainInput}.${domains?.baseDomain || 'beta.promptpilot.run'}`}</code>
                  </p>
                  <p className="text-sm text-gray-500">
                    Production, staging, and development each get their own host under this subdomain.
                  </p>
                </div>
                {domains?.previews && (
                  <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
                    <p className="font-medium text-gray-900">Environment URLs</p>
                    <p><span className="text-gray-500">Production:</span> {domains.previews.production}</p>
                    <p><span className="text-gray-500">Staging:</span> {domains.previews.staging}</p>
                    <p><span className="text-gray-500">Development:</span> {domains.previews.development}</p>
                  </div>
                )}
                <Button onClick={() => void saveVanitySubdomain()} disabled={savingDomains}>
                  {savingDomains ? 'Saving...' : 'Save Subdomain'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Domain</CardTitle>
                <CardDescription>
                  Bring your own domain for production deployments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="custom-domain">Domain</Label>
                  <Input
                    id="custom-domain"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    placeholder="api.yourcompany.com"
                    className="mt-1"
                  />
                </div>
                {customDomainInput && (domains?.dns || domains?.verificationToken) && (
                  <div className="rounded-lg border p-4 text-sm space-y-4 bg-gray-50">
                    <p className="font-medium text-gray-900">DNS records</p>
                    <p className="text-gray-600 text-xs">
                      Add these in your DNS provider. CNAME routes traffic; TXT proves ownership.
                      Propagation can take up to 48 hours.
                    </p>

                    <div className="rounded-md border bg-white p-3 space-y-1">
                      <p className="font-medium text-gray-800">
                        1. CNAME <span className="text-red-600">*</span> (required for routing)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mt-2">
                        <div>
                          <span className="text-gray-500">Type</span>
                          <p className="font-mono">CNAME</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Name / Host</span>
                          <p className="font-mono break-all">
                            {domains?.dns?.cname.hostRelative || customDomainInput.split('.')[0]}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Target / Value</span>
                          <p className="font-mono break-all">{domains?.cnameTarget}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Full hostname: <code>{customDomainInput}</code> →{' '}
                        <code>{domains?.cnameTarget}</code>
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() =>
                          void copyToClipboard(domains?.cnameTarget || '', 'CNAME target')
                        }
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy target
                      </Button>
                    </div>

                    <div className="rounded-md border bg-white p-3 space-y-1">
                      <p className="font-medium text-gray-800">2. TXT (ownership verification)</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mt-2">
                        <div>
                          <span className="text-gray-500">Type</span>
                          <p className="font-mono">TXT</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Name / Host</span>
                          <p className="font-mono break-all">
                            {domains?.dns?.txt.hostRelative || '_promptpilot-challenge'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Value</span>
                          <p className="font-mono break-all text-[11px]">
                            {domains?.dns?.txt.value ||
                              (domains?.verificationToken
                                ? `promptpilot-site-verification=${domains.verificationToken}`
                                : 'Save domain to generate')}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        FQDN: <code>{domains?.txtVerificationHost || `_promptpilot-challenge.${customDomainInput}`}</code>
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-xs"
                        onClick={() =>
                          void copyToClipboard(
                            domains?.dns?.txt.value ||
                              (domains?.verificationToken
                                ? `promptpilot-site-verification=${domains.verificationToken}`
                                : ''),
                            'TXT value'
                          )
                        }
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy TXT value
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500">
                      Either TXT or CNAME verification succeeds. CNAME is required for live API traffic
                      on your custom domain.
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void saveCustomDomain()}
                    disabled={savingDomains}
                  >
                    Save Domain
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void checkDnsPropagation()}
                    disabled={!customDomainInput}
                  >
                    Check DNS
                  </Button>
                  <Button
                    onClick={() => void verifyCustomDomainDns()}
                    disabled={verifyingDns || !customDomainInput}
                  >
                    {verifyingDns ? 'Checking DNS...' : 'Verify DNS'}
                  </Button>
                </div>
                {dnsCheckStatus && (
                  <p className="text-xs text-gray-600">{dnsCheckStatus}</p>
                )}
                {domains?.customDomainVerified && domains.customDomain && (
                  <Badge className="bg-green-100 text-green-800">
                    Verified: {domains.customDomain}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  API Keys
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={() => void createApiKey()}
                    disabled={creatingApiKey}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {creatingApiKey ? 'Creating...' : 'Create New Key'}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage your API keys for accessing Prompt Pilot services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newApiKeyName}
                    onChange={(e) => setNewApiKeyName(e.target.value)}
                    placeholder="Key name (e.g. Production API Key)"
                    className="max-w-xs"
                  />
                </div>
                <div className="space-y-4">
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Key className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p>No API keys yet. Create one to access Prompt Pilot programmatically.</p>
                    </div>
                  ) : (
                    apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{apiKey.name}</h4>
                          <div className="flex space-x-1">
                            {apiKey.permissions.map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                            {showApiKey ? apiKey.keyPrefix : `${apiKey.keyPrefix}${'•'.repeat(12)}`}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {apiKey.createdAt && <span>Created {new Date(apiKey.createdAt).toLocaleDateString()}</span>}
                          {apiKey.lastUsedAt && (
                            <>
                              <span>•</span>
                              <span>Last used {new Date(apiKey.lastUsedAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          disabled={revokingKeyId === apiKey.id}
                          onClick={() => void revokeApiKey(apiKey.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Usage Guidelines</CardTitle>
                <CardDescription>
                  Important information about using your API keys securely.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Keep your keys secure</h4>
                      <p className="text-sm text-gray-600">Never share your API keys publicly or commit them to version control.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Key className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Use environment variables</h4>
                      <p className="text-sm text-gray-600">Store API keys in environment variables or secure configuration files.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Globe className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-gray-900">Production gateway auth</h4>
                      <p className="text-sm text-gray-600">
                        Pass your key as <code>Authorization: Bearer pp_live_...</code> or{' '}
                        <code>X-API-Key</code> when calling production deployment URLs.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to be notified about important events.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Notification Channels</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Email Notifications</Label>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={notifications.email}
                        onCheckedChange={(checked) => {
                          setEmailNotifications(checked);
                          setNotifications({ ...notifications, email: checked });
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Push Notifications</Label>
                        <p className="text-sm text-gray-500">Receive browser push notifications</p>
                      </div>
                      <Switch
                        checked={notifications.push}
                        onCheckedChange={(checked) => setNotifications({...notifications, push: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">SMS Notifications</Label>
                        <p className="text-sm text-gray-500">Receive critical alerts via SMS</p>
                      </div>
                      <Switch
                        checked={notifications.sms}
                        onCheckedChange={(checked) => setNotifications({...notifications, sms: checked})}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Notification Types</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">System Alerts</Label>
                        <p className="text-sm text-gray-500">API downtime, errors, and performance issues</p>
                      </div>
                      <Switch
                        checked={notifications.alerts}
                        onCheckedChange={(checked) => setNotifications({...notifications, alerts: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Usage Notifications</Label>
                        <p className="text-sm text-gray-500">Rate limit warnings and quota updates</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Billing Notifications</Label>
                        <p className="text-sm text-gray-500">Payment confirmations and billing updates</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Marketing Communications</Label>
                        <p className="text-sm text-gray-500">Product updates and feature announcements</p>
                      </div>
                      <Switch
                        checked={notifications.marketing}
                        onCheckedChange={(checked) => {
                          setMarketingNotifications(checked);
                          setNotifications({ ...notifications, marketing: checked });
                        }}
                      />
                    </div>
                  </div>
                </div>

                {notifications.sms && (
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Required for SMS notifications
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  Manage your subscription and billing information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscription ? (
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {String(subscription.plan_name || subscription.status || 'Active Plan')}
                    </h3>
                    {subscription.current_period_end && (
                      <p className="text-sm text-gray-500 mt-1">
                        Current period ends: {new Date(String(subscription.current_period_end)).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">{String(subscription.status || 'active')}</Badge>
                  </div>
                </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CreditCard className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>No active subscription. Billing will appear here once you subscribe to a plan.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>
                  Update your payment information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p>No payment method on file.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
                <CardDescription>
                  View your past invoices and payments.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>No billing history yet.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage This Month</CardTitle>
                <CardDescription>
                  Track your current usage against plan limits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>Usage metrics will appear here once you start using the platform.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Team Members
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Member
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage team members and their permissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p>No team members yet. Invite colleagues to collaborate.</p>
                    </div>
                  ) : (
                    teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={member.avatarUrl || undefined} />
                          <AvatarFallback>{member.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{member.role}</Badge>
                        {member.role !== 'owner' && member.role !== 'Owner' && (
                          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  )))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Permissions</CardTitle>
                <CardDescription>
                  Configure what team members can access and modify.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Admin Permissions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Manage team members</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Access billing information</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Modify account settings</span>
                        <Switch />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Developer Permissions</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Create and edit APIs</span>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Deploy to production</span>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Access analytics</span>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password & Authentication</CardTitle>
                <CardDescription>
                  Manage your password and authentication settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" className="mt-1" />
                </div>
                <Button>Update Password</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Authenticator App</h4>
                    <p className="text-sm text-gray-500">Use an authenticator app to generate verification codes</p>
                  </div>
                  <Button variant="outline">
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Login Sessions</CardTitle>
                <CardDescription>
                  Manage your active login sessions across devices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <p>No active sessions to display.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that will affect your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <h4 className="font-medium text-red-900">Delete Account</h4>
                    <p className="text-sm text-red-700">Permanently delete your account and all associated data</p>
                  </div>
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}