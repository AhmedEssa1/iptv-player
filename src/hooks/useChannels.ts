'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Channel, M3USource, StoredData } from '@/types/iptv';
import { PAGE_SIZE } from '@/lib/constants';
import { parseM3U } from '@/lib/parser';

interface Options {
  stored: StoredData;
  getSourceUrl: (src: M3USource) => string;
}

export interface XtreamCat { id: string; name: string; }

function extractXtreamHost(url: string): string | undefined {
  if (url.includes('/get.php?username={username}')) {
    return url.split('/get.php')[0];
  }
  return undefined;
}

export function useChannels({ stored, getSourceUrl }: Options) {
  const [srcId,       setSrcId]       = useState('');
  const [channels,    setChannels]    = useState<Channel[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [loadErr,     setLoadErr]     = useState<string | null>(null);
  const [search,      setSearch]      = useState('');
  const [category,    setCategory]    = useState('all');
  const [onlyFavs,    setOnlyFavs]    = useState(false);
  const [page,        setPage]        = useState(1);
  const [xtreamCats,  setXtreamCats]  = useState<XtreamCat[]>([]);
  const [xtreamCatId, setXtreamCatId] = useState('');

  const loadSource = useCallback(async (src: M3USource) => {
    setLoading(true);
    setLoadErr(null);
    setChannels([]);
    setXtreamCats([]);
    setXtreamCatId('');
    setPage(1);
    try {
      const rawUrl     = getSourceUrl(src);
      const xtreamHost = extractXtreamHost(rawUrl);

      if (xtreamHost) {
        // Xtream Codes API mode: load categories list only (fast)
        const creds  = stored.credentials[src.id] || {};
        const apiUrl = `${xtreamHost}/player_api.php?username=${encodeURIComponent(creds.username || '')}&password=${encodeURIComponent(creds.password || '')}&action=get_live_categories`;
        const res    = await fetch(`/api/proxy?url=${encodeURIComponent(apiUrl)}`);
        if (!res.ok) throw new Error();
        const cats = await res.json() as { category_id: string; category_name: string }[];
        if (!Array.isArray(cats) || !cats.length) { setLoadErr('لم يتم العثور على فئات في هذا المصدر'); return; }
        setXtreamCats(cats.map(c => ({ id: c.category_id, name: c.category_name })));
      } else {
        // Standard M3U mode
        let url = rawUrl;
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
      }
    } catch {
      setLoadErr('فشل تحميل القنوات. تحقق من الاتصال أو بيانات الاعتماد.');
    } finally {
      setLoading(false);
    }
  }, [getSourceUrl, stored.credentials]);

  const loadXtreamCat = useCallback(async (src: M3USource, catId: string, cats: XtreamCat[]) => {
    setLoading(true);
    setLoadErr(null);
    setChannels([]);
    setXtreamCatId(catId);
    setPage(1);
    try {
      const rawUrl     = getSourceUrl(src);
      const xtreamHost = extractXtreamHost(rawUrl);
      if (!xtreamHost) return;
      const creds  = stored.credentials[src.id] || {};
      const apiUrl = `${xtreamHost}/player_api.php?username=${encodeURIComponent(creds.username || '')}&password=${encodeURIComponent(creds.password || '')}&action=get_live_streams&category_id=${catId}`;
      const res    = await fetch(`/api/proxy?url=${encodeURIComponent(apiUrl)}`);
      if (!res.ok) throw new Error();
      const streams = await res.json() as { stream_id: number; name: string; stream_icon?: string }[];
      if (!Array.isArray(streams) || !streams.length) { setLoadErr('لا توجد قنوات في هذه الفئة'); return; }
      const catName = cats.find(c => c.id === catId)?.name;
      const list: Channel[] = streams.map(s => ({
        id:       String(s.stream_id),
        name:     s.name,
        logo:     s.stream_icon || undefined,
        url:      `${xtreamHost}/live/${creds.username}/${creds.password}/${s.stream_id}.m3u8`,
        category: catName,
      }));
      setChannels(list);
    } catch {
      setLoadErr('فشل تحميل القنوات. تحقق من الاتصال أو بيانات الاعتماد.');
    } finally {
      setLoading(false);
    }
  }, [getSourceUrl, stored.credentials]);

  const backToXtreamCats = useCallback(() => {
    setChannels([]);
    setXtreamCatId('');
    setLoadErr(null);
    setPage(1);
  }, []);

  const cats = useMemo(() =>
    ['all', ...[...new Set(channels.map(ch => ch.category || 'أخرى'))].sort()],
  [channels]);

  const filtered = useMemo(() => {
    let r = channels.filter(ch => !stored.hidden.includes(ch.id));
    if (onlyFavs)           r = r.filter(ch => stored.favorites.includes(ch.id));
    if (search)             { const s = search.toLowerCase(); r = r.filter(ch => ch.name.toLowerCase().includes(s) || ch.category?.toLowerCase().includes(s)); }
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
    xtreamCats, xtreamCatId, loadXtreamCat, backToXtreamCats,
  };
}
