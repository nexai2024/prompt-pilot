'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { readStore, writeStore } from '@/lib/local-store';

interface AppNotification {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  href?: string;
  createdAt: string;
}

const READ_KEY = 'pp-notifications-read';

export function NotificationCenter() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', { credentials: 'include' });
      if (!response.ok) return;
      const data = await response.json();
      setItems(Array.isArray(data.notifications) ? data.notifications : []);
      setReadIds(readStore<string[]>(READ_KEY, []));
    } catch {
      // header still works without notifications
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60000);
    return () => window.clearInterval(timer);
  }, [load]);

  const unread = items.filter((item) => !readIds.includes(item.id));

  const markAllRead = () => {
    const next = items.map((item) => item.id);
    setReadIds(next);
    writeStore(READ_KEY, next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-1.5">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">Alerts</span>
          {unread.length > 0 ? (
            <span className="rounded-full bg-violet-600 px-1.5 text-[10px] font-semibold text-white">
              {unread.length}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unread.length > 0 ? (
            <button
              type="button"
              className="text-xs font-normal text-muted-foreground hover:text-foreground"
              onClick={markAllRead}
            >
              Mark all read
            </button>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <div className="px-2 py-6 text-center text-sm text-muted-foreground">
            No alerts yet. Failed API calls, deploys, and score drops show up here.
          </div>
        ) : (
          items.slice(0, 8).map((item) => (
            <DropdownMenuItem key={item.id} asChild className="cursor-pointer">
              <Link href={item.href || '/dashboard'} className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">{item.title}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{item.message}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
