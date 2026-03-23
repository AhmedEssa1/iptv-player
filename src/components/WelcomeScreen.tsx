'use client';

import type { M3USource } from '@/types/iptv';
import { DEFAULT_SOURCES } from '@/lib/constants';

interface Props {
  hasSource: boolean;
  onSelectSource: (id: string) => void;
}

export default function WelcomeScreen({ hasSource, onSelectSource }: Props) {
  return (
    <div className="welcome-screen">
      <div className="welcome-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="7" width="20" height="13" rx="2.5" stroke="url(#wg)" strokeWidth="1.5"/>
          <path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" stroke="url(#wg)" strokeWidth="1.5"/>
          <circle cx="9.5" cy="13.5" r="1.5" fill="url(#wg)" opacity="0.6"/>
          <circle cx="14.5" cy="13.5" r="1.5" fill="url(#wg)"/>
          <defs>
            <linearGradient id="wg" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60a5fa"/>
              <stop offset="1" stopColor="#a78bfa"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <h1 className="welcome-title">IPTV Player</h1>
      <p className="welcome-sub">
        {hasSource ? 'اختر قناة من القائمة على اليسار' : 'اختر مصدراً للبدء في المشاهدة'}
      </p>

      {!hasSource && (
        <div className="welcome-sources">
          {DEFAULT_SOURCES.map((src: M3USource) => (
            <button
              key={src.id}
              className="welcome-source-card"
              onClick={() => onSelectSource(src.id)}
            >
              <span className="welcome-source-icon">{src.icon || '📡'}</span>
              <span className="welcome-source-name">{src.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
