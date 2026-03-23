import type { StoredData } from '@/types/iptv';
import { STORAGE_KEY, EMPTY_STORED } from './constants';

export function loadStored(): StoredData {
  if (typeof window === 'undefined') return EMPTY_STORED;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...EMPTY_STORED, ...JSON.parse(raw) } : EMPTY_STORED;
  } catch {
    return EMPTY_STORED;
  }
}

export function saveStored(d: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}
