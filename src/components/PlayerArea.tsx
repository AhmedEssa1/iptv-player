'use client';

import { RefObject } from 'react';

interface Props {
  videoRef: RefObject<HTMLVideoElement | null>;
  playerErr: string | null;
  onRetry: () => void;
}

export default function PlayerArea({ videoRef, playerErr, onRetry }: Props) {
  return (
    <div className="player-area" onClick={playerErr ? onRetry : undefined} style={{ cursor: playerErr ? 'pointer' : 'default' }}>
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        className="player-video"
      />
      {playerErr && (
        <div className="player-error-overlay">
          <div className="player-error-content">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="player-error-msg">{playerErr}</p>
            <p className="player-error-sub">اضغط في أي مكان لإعادة المحاولة</p>
            <button className="btn btn--primary" onClick={e => { e.stopPropagation(); onRetry(); }}>
              إعادة التشغيل
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
