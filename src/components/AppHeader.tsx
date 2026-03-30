'use client';

import { useState, useRef, useEffect } from 'react';
import type { Theme } from '@/hooks/useTheme';

const APP_VERSION = '1.0';
const SITE_URL    = 'https://mysoftware-solution.blogspot.com/';

interface Props {
  sidebarOpen: boolean;
  onToggle: () => void;
  channelCount: number;
  filteredCount: number;
  loading: boolean;
  hasActiveSource: boolean;
  onReload: () => void;
  onAddSource: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export default function AppHeader({
  sidebarOpen, onToggle,
  channelCount, filteredCount,
  loading, hasActiveSource,
  onReload, onAddSource,
  theme, onToggleTheme,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [menuOpen]);

  return (
    <header className="app-header">
      <button className="icon-btn" onClick={onToggle} title={sidebarOpen ? 'إخفاء الشريط' : 'إظهار الشريط'} aria-label="Toggle sidebar">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="2" y1="4.5" x2="16" y2="4.5"/>
          <line x1="2" y1="9"   x2="16" y2="9"/>
          <line x1="2" y1="13.5" x2="16" y2="13.5"/>
        </svg>
      </button>

      <div className="header-logo">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="7" width="20" height="13" rx="2" fill="none" stroke="var(--accent)" strokeWidth="1.8"/>
          <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="var(--accent)" strokeWidth="1.8"/>
          <circle cx="12" cy="13.5" r="2.5" fill="var(--accent)"/>
        </svg>
        <span className="header-title">IPTV Player</span>
      </div>

      <div style={{ flex: 1 }} />

      {channelCount > 0 && (
        <span className="channel-badge">
          {filteredCount.toLocaleString()} / {channelCount.toLocaleString()}
        </span>
      )}

      {hasActiveSource && (
        <button
          className={`icon-btn ${loading ? 'icon-btn--loading' : 'icon-btn--success'}`}
          onClick={onReload}
          disabled={loading}
          title="إعادة تحميل المصدر"
        >
          {loading
            ? <span className="spinner" style={{ width: 14, height: 14 }} />
            : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            )
          }
        </button>
      )}

      <button className="icon-btn icon-btn--accent" onClick={onAddSource} title="إضافة مصدر جديد">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5"  y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {/* ── Theme toggle ── */}
      <button
        className="icon-btn"
        onClick={onToggleTheme}
        title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          /* Sun icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1"  x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1"  y1="12" x2="3"  y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        ) : (
          /* Moon icon */
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        )}
      </button>

      {/* ── Menu ── */}
      <div ref={menuRef} style={{ position: 'relative' }}>
        <button
          className={`icon-btn${menuOpen ? ' icon-btn--active' : ''}`}
          onClick={() => setMenuOpen(v => !v)}
          title="القائمة"
          aria-label="Menu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5"  r="1.5"/>
            <circle cx="12" cy="12" r="1.5"/>
            <circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>

        {menuOpen && (
          <div className="header-menu">
            {/* App info */}
            <div className="header-menu-info">
              <div className="header-menu-logo">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="7" width="20" height="13" rx="2.5" stroke="var(--accent)" strokeWidth="1.6"/>
                  <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="var(--accent)" strokeWidth="1.6"/>
                  <circle cx="12" cy="13.5" r="2.5" fill="var(--accent)"/>
                </svg>
                <div>
                  <span className="header-menu-appname">IPTV Player</span>
                  <span className="header-menu-version">v{APP_VERSION}</span>
                </div>
              </div>
            </div>

            <div className="header-menu-divider" />

            {/* Site link */}
            <a
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="header-menu-item"
              onClick={() => setMenuOpen(false)}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2"  y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              موقعنا الإلكتروني
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: 'auto', opacity: .4 }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>

            <div className="header-menu-divider" />

            {/* Version row */}
            <div className="header-menu-meta">
              <span>الإصدار</span>
              <span className="header-menu-meta-val">v{APP_VERSION}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
