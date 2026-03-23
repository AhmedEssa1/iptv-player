'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Hls from 'hls.js';

interface Channel {
  id: string;
  name: string;
  logo?: string;
  url: string;
  country?: string;
  category?: string;
}

interface M3USource {
  id: string;
  name: string;
  url: string;
  hasAuth?: boolean;
  isDefault?: boolean;
}

const DEFAULT_SOURCES: M3USource[] = [
  {
    id: 'falcon',
    name: 'Falcon IPTV Pro',
    url: 'http://falconiptvpro.xyz:8080/get.php?username={username}&password={password}&type=m3u_plus&output=ts',
    hasAuth: true,
    isDefault: true,
  },
  {
    id: 'osn-bein',
    name: 'OSN, beIN, ART, Fox, Sky',
    url: 'https://raw.githubusercontent.com/gigoplast/iptv-1/master/OSN%20%2C%20BEIN%20%2CART%20%2CFOX%20%2C%20SKY.m3u8',
    isDefault: true,
  },
  {
    id: 'iptv-org',
    name: 'iptv-org — الكل (Worldwide)',
    url: 'https://iptv-org.github.io/iptv/index.m3u',
    isDefault: true,
  },
  {
    id: 'iptv-org-arabic',
    name: 'iptv-org — عربي (Arabic)',
    url: 'https://iptv-org.github.io/iptv/languages/ara.m3u',
    isDefault: true,
  },
  {
    id: 'iptv-org-news',
    name: 'iptv-org — أخبار (News)',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    isDefault: true,
  },
  {
    id: 'iptv-org-sports',
    name: 'iptv-org — رياضة (Sports)',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    isDefault: true,
  },
  {
    id: 'iptv-org-arab-region',
    name: 'iptv-org — منطقة عربية (Arab Region)',
    url: 'https://iptv-org.github.io/iptv/regions/arab.m3u',
    isDefault: true,
  },
  {
    id: 'iptv-org-entertainment',
    name: 'iptv-org — ترفيه (Entertainment)',
    url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u',
    isDefault: true,
  },
];

const CHANNELS_PER_PAGE = 100;
const STORAGE_KEY = 'iptv-player-v2';

interface StoredData {
  favorites: string[];
  hidden: string[];
  customSources: M3USource[];
  credentials: Record<string, { username: string; password: string }>;
  sourceUrlOverrides: Record<string, string>;
}

function loadStoredData(): StoredData {
  if (typeof window === 'undefined') return { favorites: [], hidden: [], customSources: [], credentials: {}, sourceUrlOverrides: {} };
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : { favorites: [], hidden: [], customSources: [], credentials: {}, sourceUrlOverrides: {} };
  } catch {
    return { favorites: [], hidden: [], customSources: [], credentials: {}, sourceUrlOverrides: {} };
  }
}

function saveStoredData(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function Home() {
  const [allChannels, setAllChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditSource, setShowEditSource] = useState<string | null>(null);
  
  // Stored data
  const [storedData, setStoredData] = useState<StoredData>({ favorites: [], hidden: [], customSources: [], credentials: {}, sourceUrlOverrides: {} });
  
  // Edit source form
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  
  const [channelStatuses, setChannelStatuses] = useState<Record<string, 'checking' | 'ok' | 'dead' | 'timeout'>>({});
  const [checkingAll, setCheckingAll] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Load stored data on mount
  useEffect(() => {
    const data = loadStoredData();
    setStoredData(data);
  }, []);

  // All sources (default + custom)
  const allSources = useMemo(() => {
    const custom = (storedData.customSources || []).map(s => ({ ...s, isDefault: false }));
    return [...DEFAULT_SOURCES, ...custom];
  }, [storedData.customSources]);

  // Get selected source
  const selectedSource = useMemo(() => {
    return allSources.find(s => s.id === selectedSourceId);
  }, [allSources, selectedSourceId]);

  // Get effective URL (with override if set)
  const getEffectiveUrl = useCallback((source: M3USource) => {
    const override = storedData.sourceUrlOverrides[source.id];
    return override || source.url;
  }, [storedData.sourceUrlOverrides]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(allChannels.map(ch => ch.category || 'أخرى'))] as string[];
    return ['all', ...cats.sort()];
  }, [allChannels]);

  // Filter channels
  const filteredChannels = useMemo(() => {
    let filtered = allChannels.filter(ch => !storedData.hidden.includes(ch.id));
    
    if (showFavorites) {
      filtered = filtered.filter(ch => storedData.favorites.includes(ch.id));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(ch => 
        ch.name.toLowerCase().includes(searchLower) ||
        ch.category?.toLowerCase().includes(searchLower)
      );
    }
    if (category !== 'all') {
      filtered = filtered.filter(ch => (ch.category || 'أخرى') === category);
    }
    return filtered;
  }, [allChannels, search, category, showFavorites, storedData]);

  // Paginated channels
  const displayedChannels = useMemo(() => {
    return filteredChannels.slice(0, page * CHANNELS_PER_PAGE);
  }, [filteredChannels, page]);

  const hasMore = displayedChannels.length < filteredChannels.length;

  // Parse M3U
  const parseM3U = useCallback((content: string): Channel[] => {
    const channels: Channel[] = [];
    const lines = content.split('\n');
    let currentChannel: Partial<Channel> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#EXTINF:')) {
        const info = trimmed.substring(8);
        const nameMatch = info.match(/,(.+)$/);
        const name = nameMatch ? nameMatch[1].trim() : 'Unknown';
        
        const logoMatch = info.match(/tvg-logo="([^"]*)"/);
        const categoryMatch = info.match(/group-title="([^"]*)"/);
        
        currentChannel = {
          name,
          logo: logoMatch ? logoMatch[1] : undefined,
          category: categoryMatch ? categoryMatch[1] : undefined,
        };
      } else if (trimmed && !trimmed.startsWith('#') && currentChannel.name) {
        currentChannel.url = trimmed;
        currentChannel.id = btoa(encodeURIComponent(trimmed)).substring(0, 16);
        channels.push(currentChannel as Channel);
        currentChannel = {};
      }
    }
    return channels;
  }, []);

  // Load M3U source
  const loadSource = useCallback(async (source: M3USource) => {
    if (!source) return;
    
    try {
      setLoading(true);
      setError(null);
      setAllChannels([]);
      setPage(1);
      
      // Get effective URL
      let finalUrl = getEffectiveUrl(source);
      
      // Replace credentials if needed
      if (finalUrl.includes('{username}')) {
        const creds = storedData.credentials[source.id] || {};
        finalUrl = finalUrl
          .replace('{username}', creds.username || '')
          .replace('{password}', creds.password || '');
      }
      
      const res = await fetch(`/api/proxy?url=${encodeURIComponent(finalUrl)}`);
      if (!res.ok) throw new Error('فشل تحميل القائمة');
      
      const text = await res.text();
      const channels = parseM3U(text);
      
      if (channels.length === 0) {
        setError('لم يتم العثور على قنوات');
        return;
      }
      
      setAllChannels(channels);
    } catch (err) {
      setError('فشل تحميل القنوات');
    } finally {
      setLoading(false);
    }
  }, [parseM3U, storedData.credentials, getEffectiveUrl]);

  // Auto-load when source changes
  useEffect(() => {
    if (selectedSource) {
      loadSource(selectedSource);
    }
  }, [selectedSourceId, loadSource]);

  // Toggle favorite
  const toggleFavorite = useCallback((channelId: string) => {
    setStoredData(prev => {
      const newData = {
        ...prev,
        favorites: prev.favorites.includes(channelId)
          ? prev.favorites.filter(id => id !== channelId)
          : [...prev.favorites, channelId],
      };
      saveStoredData(newData);
      return newData;
    });
  }, []);

  // Hide channel
  const hideChannel = useCallback((channelId: string) => {
    setStoredData(prev => {
      const newData = {
        ...prev,
        hidden: [...prev.hidden, channelId],
      };
      saveStoredData(newData);
      return newData;
    });
  }, []);

  // Open edit source modal
  const openEditSource = useCallback((source: M3USource) => {
    setEditName(source.name);
    setEditUrl(getEffectiveUrl(source));
    const creds = storedData.credentials[source.id] || {};
    setEditUsername(creds.username || '');
    setEditPassword(creds.password || '');
    setShowEditSource(source.id);
  }, [storedData.credentials, getEffectiveUrl]);

  // Save source edits
  const saveSourceEdits = useCallback(() => {
    if (!showEditSource) return;
    
    const source = allSources.find(s => s.id === showEditSource);
    if (!source) return;
    
    setStoredData(prev => {
      const newData = {
        ...prev,
        sourceUrlOverrides: {
          ...prev.sourceUrlOverrides,
          [showEditSource]: editUrl,
        },
        credentials: {
          ...prev.credentials,
          [showEditSource]: { username: editUsername, password: editPassword },
        },
        customSources: !source.isDefault
          ? prev.customSources.map(s =>
              s.id === showEditSource ? { ...s, name: editName } : s
            )
          : prev.customSources,
      };
      saveStoredData(newData);
      return newData;
    });

    setShowEditSource(null);
  }, [showEditSource, editUrl, editUsername, editPassword, editName, allSources]);

  // Add new source
  const addNewSource = useCallback(() => {
    const id = 'custom-' + Date.now();
    const newSource: M3USource = {
      id,
      name: editName || 'مصدر جديد',
      url: editUrl,
      hasAuth: editUrl.includes('{username}'),
      isDefault: false,
    };
    
    setStoredData(prev => {
      const newData = {
        ...prev,
        customSources: [...prev.customSources, newSource],
        credentials: {
          ...prev.credentials,
          [id]: { username: editUsername, password: editPassword },
        },
      };
      saveStoredData(newData);
      return newData;
    });
    
    setEditName('');
    setEditUrl('');
    setEditUsername('');
    setEditPassword('');
    setShowEditSource(null);
    setSelectedSourceId(id);
  }, [editName, editUrl, editUsername, editPassword]);

  // Delete custom source
  const deleteSource = useCallback((sourceId: string) => {
    setStoredData(prev => {
      const newData = {
        ...prev,
        customSources: prev.customSources.filter(s => s.id !== sourceId),
        credentials: Object.fromEntries(Object.entries(prev.credentials).filter(([k]) => k !== sourceId)),
        sourceUrlOverrides: Object.fromEntries(Object.entries(prev.sourceUrlOverrides).filter(([k]) => k !== sourceId)),
      };
      saveStoredData(newData);
      return newData;
    });
    if (selectedSourceId === sourceId) {
      setSelectedSourceId('');
    }
  }, [selectedSourceId]);

  // Check single channel status
  const checkChannel = useCallback(async (channel: Channel) => {
    setChannelStatuses(prev => ({ ...prev, [channel.id]: 'checking' }));
    try {
      const res = await fetch(`/api/check?url=${encodeURIComponent(channel.url)}`);
      const data = await res.json();
      setChannelStatuses(prev => ({ ...prev, [channel.id]: data.status }));
    } catch {
      setChannelStatuses(prev => ({ ...prev, [channel.id]: 'dead' }));
    }
  }, []);

  // Check all visible channels (concurrency limited to 5)
  const checkAllChannels = useCallback(async () => {
    if (checkingAll) return;
    setCheckingAll(true);
    const toCheck = [...filteredChannels];
    setChannelStatuses(prev => {
      const next = { ...prev };
      toCheck.forEach(ch => { next[ch.id] = 'checking'; });
      return next;
    });
    const CONCURRENCY = 5;
    for (let i = 0; i < toCheck.length; i += CONCURRENCY) {
      const batch = toCheck.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map(async (ch) => {
        try {
          const res = await fetch(`/api/check?url=${encodeURIComponent(ch.url)}`);
          const data = await res.json();
          setChannelStatuses(prev => ({ ...prev, [ch.id]: data.status }));
        } catch {
          setChannelStatuses(prev => ({ ...prev, [ch.id]: 'dead' }));
        }
      }));
    }
    setCheckingAll(false);
  }, [checkingAll, filteredChannels]);

  // Play channel
  const playChannel = useCallback((channel: Channel) => {
    setSelectedChannel(channel);
    setPlayerError(null);
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    const isHls = channel.url.includes('.m3u8') ||
                  channel.url.includes('type=m3u') ||
                  !!channel.url.match(/\.(m3u8?|ts)(\?|$)/);
    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 10,
          maxMaxBufferLength: 30,
        });
        hls.loadSource(channel.url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => setPlayerError('اضغط للتشغيل'));
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setPlayerError('القناة غير متاحة');
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = channel.url;
        video.play().catch(() => setPlayerError('اضغط للتشغيل'));
      } else {
        setPlayerError('المتصفح لا يدعم HLS');
      }
    } else {
      video.src = channel.url;
      video.play().catch(() => setPlayerError('اضغط للتشغيل'));
    }
  }, []);

  const closePlayer = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = '';
    }
    setSelectedChannel(null);
  }, []);

  return (
    <div style={{ minHeight: '100vh', direction: 'rtl', background: '#0f172a' }}>
      {/* Header */}
      <header style={{ 
        background: '#1e293b', 
        padding: '12px 16px',
        borderBottom: '1px solid #334155',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '18px', color: '#38bdf8' }}>📺 IPTV</h1>
          
          <select
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#fff',
              fontSize: '12px',
              minWidth: '150px',
            }}
          >
            <option value="">اختر مصدر</option>
            {allSources.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          
          {selectedSource && (
            <>
              <button
                onClick={() => loadSource(selectedSource)}
                disabled={loading}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#22c55e',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? '⏳' : '🔄'} تحميل
              </button>
              <button
                onClick={() => openEditSource(selectedSource)}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                ✏️ تعديل
              </button>
            </>
          )}
          
          <button
            onClick={() => setShowFavorites(!showFavorites)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: showFavorites ? 'none' : '1px solid #334155',
              background: showFavorites ? '#f59e0b' : 'transparent',
              color: showFavorites ? '#000' : '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            {showFavorites ? '⭐' : '☆'}
          </button>
          
          <button
            onClick={() => { setEditName(''); setEditUrl(''); setEditUsername(''); setEditPassword(''); setShowEditSource('new'); }}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: 'transparent',
              color: '#94a3b8',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ➕
          </button>
          
          <span style={{ color: '#64748b', fontSize: '11px' }}>
            {allChannels.length > 0 && `${filteredChannels.length}/${allChannels.length}`}
          </span>
        </div>
      </header>

      {/* Edit Source Modal */}
      {showEditSource && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '20px',
            width: '100%',
            maxWidth: '500px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#38bdf8' }}>
                {showEditSource === 'new' ? '➕ إضافة مصدر جديد' : '✏️ تعديل المصدر'}
              </h3>
              <button
                onClick={() => setShowEditSource(null)}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                }}
              >✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>اسم المصدر</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  placeholder="مثال: Falcon IPTV"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                  رابط M3U (استخدم {'{username}'} و {'{password}'} للمصادر المحمية)
                </label>
                <input
                  type="text"
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    background: '#0f172a',
                    color: '#fff',
                    fontSize: '12px',
                    direction: 'ltr',
                    textAlign: 'right',
                    boxSizing: 'border-box',
                  }}
                  placeholder="http://example.com/get.php?username={username}&password={password}&type=m3u"
                />
              </div>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>اسم المستخدم</label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #334155',
                      background: '#0f172a',
                      color: '#fff',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="اختياري"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>كلمة المرور</label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid #334155',
                      background: '#0f172a',
                      color: '#fff',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="اختياري"
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {showEditSource !== 'new' && allSources.find(s => s.id === showEditSource)?.isDefault === false && (
                  <button
                    onClick={() => { deleteSource(showEditSource!); setShowEditSource(null); }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    🗑️ حذف
                  </button>
                )}
                <button
                  onClick={showEditSource === 'new' ? addNewSource : saveSourceEdits}
                  disabled={!editUrl}
                  style={{
                    flex: 2,
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    background: editUrl ? '#22c55e' : '#334155',
                    color: '#fff',
                    fontSize: '13px',
                    cursor: editUrl ? 'pointer' : 'not-allowed',
                  }}
                >
                  ✅ حفظ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      {allChannels.length > 0 && (
        <div style={{ 
          padding: '10px 16px',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          position: 'sticky',
          top: 48,
          zIndex: 99,
        }}>
          <input
            type="text"
            placeholder="🔍 بحث..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#fff',
              fontSize: '12px',
            }}
          />
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: '#0f172a',
              color: '#fff',
              fontSize: '12px',
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat === 'all' ? 'الكل' : cat}</option>
            ))}
          </select>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #334155',
            borderTopColor: '#38bdf8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 12px'
          }} />
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>جاري التحميل...</p>
        </div>
      )}

      {/* Channel Grid */}
      {!loading && displayedChannels.length > 0 && (
        <div style={{
          padding: '8px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '6px',
        }}>
          {displayedChannels.map((ch) => (
            <div
              key={ch.id}
              style={{
                background: '#1e293b',
                border: storedData.favorites.includes(ch.id) ? '1px solid #f59e0b' : '1px solid #334155',
                borderRadius: '8px',
                padding: '8px',
                position: 'relative',
              }}
            >
              <button
                onClick={() => playChannel(ch)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'right',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: 0,
                }}
              >
                {ch.logo ? (
                  <img src={ch.logo} alt="" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '4px' }} />
                ) : (
                  <div style={{ width: '28px', height: '28px', background: '#38bdf8', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>📺</div>
                )}
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>{ch.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '9px', color: '#64748b' }}>{ch.category}</p>
                </div>
              </button>
              <div style={{ position: 'absolute', top: '4px', left: '4px', display: 'flex', gap: '2px' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(ch.id); }}
                  style={{
                    background: storedData.favorites.includes(ch.id) ? '#f59e0b' : 'rgba(0,0,0,0.5)',
                    border: 'none',
                    borderRadius: '4px',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    fontSize: '10px',
                  }}
                >
                  {storedData.favorites.includes(ch.id) ? '⭐' : '☆'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); hideChannel(ch.id); }}
                  style={{
                    background: 'rgba(0,0,0,0.5)',
                    border: 'none',
                    borderRadius: '4px',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#ef4444',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div style={{ padding: '12px', textAlign: 'center' }}>
          <button
            onClick={() => setPage(p => p + 1)}
            style={{
              background: '#334155',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            تحميل المزيد ({filteredChannels.length - displayedChannels.length})
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && allChannels.length === 0 && !error && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📺</p>
          <p style={{ fontSize: '13px' }}>اختر مصدر القنوات للبدء</p>
        </div>
      )}

      {showFavorites && filteredChannels.length === 0 && allChannels.length > 0 && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <p style={{ fontSize: '24px', margin: '0 0 8px' }}>☆</p>
          <p style={{ fontSize: '13px' }}>لا توجد قنوات مفضلة</p>
        </div>
      )}

      {/* Player Modal */}
      {selectedChannel && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.95)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <header style={{
            background: '#1e293b',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flex: 1 }}>
              {selectedChannel.logo && (
                <img src={selectedChannel.logo} alt="" style={{ height: '28px' }} />
              )}
              <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                {selectedChannel.name}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => toggleFavorite(selectedChannel.id)}
                style={{
                  background: storedData.favorites.includes(selectedChannel.id) ? '#f59e0b' : '#334155',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: storedData.favorites.includes(selectedChannel.id) ? '#000' : '#fff',
                }}
              >
                {storedData.favorites.includes(selectedChannel.id) ? '⭐ مفضلة' : '☆ أضف'}
              </button>
              <button
                onClick={closePlayer}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >✕</button>
            </div>
          </header>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <video
              ref={videoRef}
              controls
              autoPlay
              playsInline
              style={{
                width: '100%',
                maxHeight: '100%',
                background: '#000',
                display: 'block',
              }}
            />
            {playerError && (
              <div
                style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.6)',
                  cursor: 'pointer',
                }}
                onClick={() => { setPlayerError(null); videoRef.current?.play(); }}
              >
                <p style={{ fontSize: '32px', margin: '0 0 8px' }}>⚠️</p>
                <p style={{ color: '#fbbf24', fontSize: '14px' }}>{playerError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}
