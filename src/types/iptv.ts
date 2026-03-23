export interface Channel {
  id: string;
  name: string;
  logo?: string;
  url: string;
  category?: string;
}

export interface M3USource {
  id: string;
  name: string;
  url: string;
  icon?: string;
  hasAuth?: boolean;
  isDefault?: boolean;
}

export type ChStatus = 'checking' | 'ok' | 'dead' | 'timeout';

export interface StoredData {
  favorites: string[];
  hidden: string[];
  hiddenSources: string[];
  customSources: M3USource[];
  credentials: Record<string, { username: string; password: string }>;
  sourceUrlOverrides: Record<string, string>;
}
