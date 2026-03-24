'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { StoredData, M3USource } from '@/types/iptv';
import { DEFAULT_SOURCES } from '@/lib/constants';
import { loadStored, saveStored } from '@/lib/storage';

export function useStore() {
  const [stored, setStored] = useState<StoredData>({
    favorites: [], hidden: [], hiddenSources: [],
    customSources: [], credentials: {}, sourceUrlOverrides: {},
  });

  useEffect(() => { setStored(loadStored()); }, []);

  const mutate = useCallback((updater: (prev: StoredData) => StoredData) => {
    setStored(prev => {
      const next = updater(prev);
      saveStored(next);
      return next;
    });
  }, []);

  const allSources = useMemo<M3USource[]>(() => [
    ...DEFAULT_SOURCES.filter(s => !(stored.hiddenSources || []).includes(s.id)),
    ...(stored.customSources || []).map(s => ({ ...s, isDefault: false as const })),
  ], [stored.customSources, stored.hiddenSources]);

  const getSourceUrl = useCallback((src: M3USource) =>
    stored.sourceUrlOverrides[src.id] || src.url,
  [stored.sourceUrlOverrides]);

  const toggleFav = useCallback((id: string) => {
    mutate(p => ({
      ...p,
      favorites: p.favorites.includes(id)
        ? p.favorites.filter(x => x !== id)
        : [...p.favorites, id],
    }));
  }, [mutate]);

  const hideCh = useCallback((id: string) => {
    mutate(p => ({ ...p, hidden: [...p.hidden, id] }));
  }, [mutate]);

  const addSource = useCallback((name: string, url: string, username: string, password: string, icon = '📡') => {
    const id = 'custom-' + Date.now();
    mutate(p => ({
      ...p,
      customSources: [...p.customSources, { id, name: name || 'مصدر جديد', url, icon, hasAuth: url.includes('{username}'), isDefault: false }],
      credentials: { ...p.credentials, [id]: { username, password } },
    }));
    return id;
  }, [mutate]);

  const saveSourceEdit = useCallback((id: string, name: string, url: string, username: string, password: string, icon?: string) => {
    const isDefault = DEFAULT_SOURCES.some(s => s.id === id);
    mutate(p => ({
      ...p,
      sourceUrlOverrides: { ...p.sourceUrlOverrides, [id]: url },
      credentials:        { ...p.credentials,        [id]: { username, password } },
      customSources: !isDefault
        ? p.customSources.map(s => s.id === id ? { ...s, name, ...(icon ? { icon } : {}) } : s)
        : p.customSources,
    }));
  }, [mutate]);

  const deleteSource = useCallback((id: string) => {
    const isDefault = DEFAULT_SOURCES.some(s => s.id === id);
    mutate(p =>
      isDefault
        ? { ...p, hiddenSources: [...(p.hiddenSources || []), id] }
        : {
            ...p,
            customSources:      p.customSources.filter(s => s.id !== id),
            credentials:        Object.fromEntries(Object.entries(p.credentials).filter(([k]) => k !== id)),
            sourceUrlOverrides: Object.fromEntries(Object.entries(p.sourceUrlOverrides).filter(([k]) => k !== id)),
          }
    );
  }, [mutate]);

  const restoreDefaultSources = useCallback(() => {
    mutate(p => ({ ...p, hiddenSources: [] }));
  }, [mutate]);

  return {
    stored, allSources, getSourceUrl,
    toggleFav, hideCh,
    addSource, saveSourceEdit, deleteSource, restoreDefaultSources,
  };
}
