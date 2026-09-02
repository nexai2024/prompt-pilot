'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { labelForPath, rememberPage } from '@/lib/recents';

export function RecentTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const label = labelForPath(pathname);
    if (!label) return;
    rememberPage(pathname, label);
  }, [pathname]);

  return null;
}
