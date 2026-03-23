import type { Channel } from '@/types/iptv';

export function parseM3U(text: string): Channel[] {
  const result: Channel[] = [];
  const lines = text.split('\n');
  const seen  = new Set<string>();
  let cur: Partial<Channel> = {};

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('#EXTINF:')) {
      const info = t.substring(8);
      cur = {
        name:     (info.match(/,(.+)$/)               || [])[1]?.trim() || 'Unknown',
        logo:     (info.match(/tvg-logo="([^"]*)"/)   || [])[1] || undefined,
        category: (info.match(/group-title="([^"]*)"/) || [])[1] || undefined,
      };
    } else if (t && !t.startsWith('#') && cur.name) {
      cur.url = t;
      const base = btoa(encodeURIComponent(t)).substring(0, 12);
      let key = base; let n = 0;
      while (seen.has(key)) key = `${base}_${++n}`;
      seen.add(key);
      cur.id = key;
      result.push(cur as Channel);
      cur = {};
    }
  }
  return result;
}
