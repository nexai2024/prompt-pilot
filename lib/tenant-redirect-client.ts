/** Client-side redirect to the tenant vanity workspace after auth. */
export async function resolveTenantRedirectUrl(
  fallbackPath: string
): Promise<string> {
  try {
    const response = await fetch('/api/tenant/context', { credentials: 'include' });
    const data = await response.json();
    if (response.ok && data.tenant?.tenantAppUrl) {
      const path = fallbackPath.startsWith('/') ? fallbackPath : `/${fallbackPath}`;
      return `${data.tenant.tenantAppUrl}${path}`;
    }
  } catch {
    // fall through
  }
  return fallbackPath;
}

export async function navigateAfterAuth(
  fallbackPath: string,
  router: { push: (path: string) => void; refresh: () => void }
): Promise<void> {
  const destination = await resolveTenantRedirectUrl(fallbackPath);
  if (destination.startsWith('http')) {
    window.location.href = destination;
    return;
  }
  router.push(destination);
  router.refresh();
}
