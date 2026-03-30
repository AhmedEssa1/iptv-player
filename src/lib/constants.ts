import type { M3USource, StoredData } from '@/types/iptv';

export const STORAGE_KEY = 'iptv-v3';
export const PAGE_SIZE   = 80;

export const EMPTY_STORED: StoredData = {
  favorites: [], hidden: [], hiddenSources: [],
  customSources: [], credentials: {}, sourceUrlOverrides: {},
};

export const DEFAULT_SOURCES: M3USource[] = [
  { id: 'iptv-org',            icon: '🌍', name: 'iptv-org Worldwide',     url: 'https://iptv-org.github.io/iptv/index.m3u', isDefault: true },
  { id: 'iptv-org-arabic',     icon: '🇸🇦', name: 'Arabic Channels',      url: 'https://iptv-org.github.io/iptv/languages/ara.m3u', isDefault: true },
  { id: 'iptv-org-news',       icon: '📰', name: 'News',                   url: 'https://iptv-org.github.io/iptv/categories/news.m3u', isDefault: true },
  { id: 'iptv-org-sports',     icon: '⚽', name: 'Sports',                 url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', isDefault: true },
  { id: 'iptv-org-arab-region',icon: '🌙', name: 'Arab Region',            url: 'https://iptv-org.github.io/iptv/regions/arab.m3u', isDefault: true },
  { id: 'iptv-org-entertain',  icon: '🎬', name: 'Entertainment',          url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u', isDefault: true },
];
