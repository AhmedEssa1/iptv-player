'use client';

import { useState, useCallback } from 'react';
import type { Channel, ChStatus } from '@/types/iptv';

export const statusColor = (s?: ChStatus) =>
  s === 'ok' ? 'var(--green)' : s === 'dead' ? 'var(--red)' : s === 'timeout' ? 'var(--amber)' : 'var(--border)';

export const statusLabel = (s?: ChStatus) =>
  s === 'ok' ? 'يعمل' : s === 'dead' ? 'متوقف' : s === 'timeout' ? 'بطيء' : s === 'checking' ? 'جاري الفحص' : '';

export function useStatusCheck(filtered: Channel[]) {
  const [statuses,    setStatuses]    = useState<Record<string, ChStatus>>({});
  const [checkingAll, setCheckingAll] = useState(false);

  const checkOne = useCallback(async (ch: Channel) => {
    setStatuses(p => ({ ...p, [ch.id]: 'checking' }));
    try {
      const r = await fetch(`/api/check?url=${encodeURIComponent(ch.url)}`);
      const d = await r.json();
      setStatuses(p => ({ ...p, [ch.id]: d.status }));
    } catch {
      setStatuses(p => ({ ...p, [ch.id]: 'dead' }));
    }
  }, []);

  const checkAll = useCallback(async () => {
    if (checkingAll) return;
    setCheckingAll(true);
    const list = [...filtered];
    setStatuses(p => {
      const n = { ...p };
      list.forEach(ch => { n[ch.id] = 'checking'; });
      return n;
    });
    for (let i = 0; i < list.length; i += 5) {
      await Promise.all(list.slice(i, i + 5).map(async ch => {
        try {
          const r = await fetch(`/api/check?url=${encodeURIComponent(ch.url)}`);
          const d = await r.json();
          setStatuses(p => ({ ...p, [ch.id]: d.status }));
        } catch {
          setStatuses(p => ({ ...p, [ch.id]: 'dead' }));
        }
      }));
    }
    setCheckingAll(false);
  }, [checkingAll, filtered]);

  const clearStatuses = useCallback(() => setStatuses({}), []);

  return { statuses, checkingAll, checkOne, checkAll, clearStatuses };
}
