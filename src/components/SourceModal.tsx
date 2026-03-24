'use client';

import { useState, useEffect } from 'react';
import type { M3USource } from '@/types/iptv';
import { DEFAULT_SOURCES } from '@/lib/constants';

interface Props {
  mode: null | 'add' | string;  // null=closed, 'add'=new, string=sourceId to edit
  source?: M3USource;           // populated when editing
  storedUrl?: string;
  storedCredentials?: { username: string; password: string };
  onClose: () => void;
  onSave: (name: string, url: string, username: string, password: string) => void;
  onDelete: (id: string) => void;
}

function buildXtreamUrl(host: string) {
  const base = host.replace(/\/+$/, '');
  return `${base}/get.php?username={username}&password={password}&type=m3u_plus&output=ts`;
}

function isXtreamUrl(url: string) {
  return url.includes('/get.php?username={username}');
}

function extractXtreamHost(url: string) {
  try { return new URL(url).origin; } catch { return url.split('/get.php')[0]; }
}

export default function SourceModal({ mode, source, storedUrl, storedCredentials, onClose, onSave, onDelete }: Props) {
  const [name,     setName]     = useState('');
  const [url,      setUrl]      = useState('');
  const [user,     setUser]     = useState('');
  const [pass,     setPass]     = useState('');
  const [isXtream, setIsXtream] = useState(false);
  const [host,     setHost]     = useState('');

  useEffect(() => {
    if (mode === 'add') {
      setName(''); setUrl(''); setUser(''); setPass(''); setIsXtream(false); setHost('');
    } else if (source) {
      const resolvedUrl = storedUrl || source.url;
      const xtream = isXtreamUrl(resolvedUrl);
      setName(source.name);
      setUrl(resolvedUrl);
      setUser(storedCredentials?.username || '');
      setPass(storedCredentials?.password || '');
      setIsXtream(xtream);
      setHost(xtream ? extractXtreamHost(resolvedUrl) : '');
    }
  }, [mode, source, storedUrl, storedCredentials]);

  if (!mode) return null;

  const isEdit    = mode !== 'add';
  const isDefault = isEdit && DEFAULT_SOURCES.some(s => s.id === mode);
  const canDelete = isEdit;
  const finalUrl  = isXtream ? buildXtreamUrl(host) : url;
  const canSave   = isXtream ? (host.trim().length > 0 && user.trim().length > 0) : url.trim().length > 0;

  return (
    <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'add' ? 'إضافة مصدر جديد' : 'تعديل المصدر'}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6"  x2="6"  y2="18"/>
              <line x1="6"  y1="6"  x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <label className="field">
            <span className="field-label">اسم المصدر</span>
            <input
              className="field-input"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: قنواتي"
            />
          </label>

          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isXtream}
              onChange={e => { setIsXtream(e.target.checked); setUrl(''); setHost(''); }}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--accent)' }}
            />
            <span className="field-label" style={{ marginBottom: 0 }}>Xtream Codes / IPTV Panel</span>
          </label>

          {isXtream ? (
            <label className="field">
              <span className="field-label">عنوان السيرفر (Host)</span>
              <input
                className="field-input"
                type="text"
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="http://example.com"
                dir="ltr"
                style={{ textAlign: 'left' }}
              />
              {host.trim() && (
                <span className="field-hint" dir="ltr" style={{ textAlign: 'left', fontSize: '11px', opacity: 0.6 }}>
                  {buildXtreamUrl(host).replace('{username}', user || 'USER').replace('{password}', pass || 'PASS')}
                </span>
              )}
            </label>
          ) : (
            <label className="field">
              <span className="field-label">رابط M3U / M3U8</span>
              <input
                className="field-input"
                type="text"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="http://..."
                dir="ltr"
                style={{ textAlign: 'left' }}
              />
              {url.includes('{username}') && (
                <span className="field-hint">هذا المصدر يتطلب اسم مستخدم وكلمة مرور</span>
              )}
            </label>
          )}

          <div className="field-row">
            <label className="field" style={{ flex: 1 }}>
              <span className="field-label">اسم المستخدم</span>
              <input className="field-input" type="text"     value={user} onChange={e => setUser(e.target.value)} placeholder={isXtream ? 'مطلوب' : 'اختياري'} />
            </label>
            <label className="field" style={{ flex: 1 }}>
              <span className="field-label">كلمة المرور</span>
              <input className="field-input" type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder={isXtream ? 'مطلوب' : 'اختياري'} />
            </label>
          </div>
        </div>

        <div className="modal-footer">
          {canDelete && (
            <button
              className="btn btn--danger"
              onClick={() => onDelete(mode)}
              title={isDefault ? 'إخفاء هذا المصدر الافتراضي' : 'حذف هذا المصدر'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
              {isDefault ? 'إخفاء' : 'حذف'}
            </button>
          )}
          <button
            className="btn btn--primary"
            style={{ flex: 1 }}
            disabled={!canSave}
            onClick={() => { onSave(name, finalUrl, user, pass); }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}
