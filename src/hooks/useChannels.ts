'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Channel, M3USource, StoredData } from '@/types/iptv';
import { PAGE_SIZE } from '@/lib/constants';
import { parseM3U } from '@/lib/parser';

interface Options {
  stored: StoredData;
  getSourceUrl: (src: M3USource) => string;
}

export function useChannels({ stored, getSourceUrl }: Options) {
  const [srcId,    setSrcId]    = useState('');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [loadErr,  setLoadErr]  = useState<string | null>(null);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('all');
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [page,     setPage]     = useState(1);

  const loadSource = useCallback(async (src: M3USource) => {
    setLoading(true);
    setLoadErr(null);
    setChannels([]);
    setPage(1);
    try {
      let url = getSourceUrl(src);
      if (url.includes('{username}')) {
        const c = stored.credentials[src.id] || {};
        url = url.replace('{username}', c.username || '').replace('{password}', c.password || '');
      }
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error();
      const text = await res.text();
      const list = parseM3U(text);
      if (!list.length) { setLoadErr('لم يتم العثور على قنوات في هذا المصدر'); return; }
      setChannels(list);
    } catch {
      setLoadErr('فشل تحميل القنوات. تحقق من الاتصال أو بيانات الاعتماد.');
    } finally {
      setLoading(false);
    }
  }, [getSourceUrl, stored.credentials]);

  // Active source object is resolved by the page from allSources
  // We expose srcId and let the page pass the source object back for loading
  const cats = useMemo(() =>
    ['all', ...[...new Set(channels.map(ch => ch.category || 'أخرى'))].sort()],
  [channels]);

  const filtered = useMemo(() => {
    let r = channels.filter(ch => !stored.hidden.includes(ch.id));
    if (onlyFavs)         r = r.filter(ch => stored.favorites.includes(ch.id));
    if (search)           { const s = search.toLowerCase(); r = r.filter(ch => ch.name.toLowerCase().includes(s) || ch.category?.toLowerCase().includes(s)); }
    if (category !== 'all') r = r.filter(ch => (ch.category || 'أخرى') === category);
    return r;
  }, [channels, stored, search, category, onlyFavs]);

  const displayed = useMemo(() => filtered.slice(0, page * PAGE_SIZE), [filtered, page]);
  const hasMore   = displayed.length < filtered.length;

  const resetFilters = useCallback(() => {
    setSearch(''); setCategory('all'); setOnlyFavs(false); setPage(1);
  }, []);

  return {
    srcId, setSrcId,
    channels, loading, loadErr, loadSource,
    search, setSearch, category, setCategory,
    onlyFavs, setOnlyFavs, page, setPage,
    cats, filtered, displayed, hasMore,
    resetFilters,
  };
}
