'use client';

import { useEffect } from 'react';

export default function AuthCallbackPage() {
  useEffect(() => {
    async function finishAuth() {
      try {
        const response = await fetch('/api/tenant/context', { credentials: 'include' });
        const data = await response.json();

        if (response.ok && data.tenant?.tenantAppUrl) {
          window.location.replace(`${data.tenant.tenantAppUrl}/dashboard`);
          return;
        }
      } catch {
        // fall through to default
      }

      window.location.replace('/dashboard');
    }

    void finishAuth();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Authenticating...
    </div>
  );
}
