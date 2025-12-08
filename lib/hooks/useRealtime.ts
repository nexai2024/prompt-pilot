'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeSubscription<T>(
  table: string,
  filter?: { column: string; value: any }
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        let query = supabase.from(table).select('*');

        if (filter) {
          query = query.eq(filter.column, filter.value);
        }

        const { data: initialData, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        setData((initialData as T[]) || []);
        setLoading(false);

        channel = supabase
          .channel(`${table}-changes`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: filter ? `${filter.column}=eq.${filter.value}` : undefined,
            },
            (payload) => {
              if (payload.eventType === 'INSERT') {
                setData((current) => [payload.new as T, ...current]);
              } else if (payload.eventType === 'UPDATE') {
                setData((current) =>
                  current.map((item: any) =>
                    item.id === (payload.new as any).id ? (payload.new as T) : item
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setData((current) =>
                  current.filter((item: any) => item.id !== (payload.old as any).id)
                );
              }
            }
          )
          .subscribe();
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, filter?.column, filter?.value]);

  return { data, loading, error, setData };
}

export function useRealtimeRecord<T>(table: string, id: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel;

    const setupSubscription = async () => {
      try {
        const { data: initialData, error: fetchError } = await supabase
          .from(table)
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        setData(initialData as T);
        setLoading(false);

        channel = supabase
          .channel(`${table}-${id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: table,
              filter: `id=eq.${id}`,
            },
            (payload) => {
              if (payload.eventType === 'UPDATE') {
                setData(payload.new as T);
              } else if (payload.eventType === 'DELETE') {
                setData(null);
              }
            }
          )
          .subscribe();
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [table, id]);

  return { data, loading, error, setData };
}
