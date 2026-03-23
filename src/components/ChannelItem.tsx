'use client';

import type { Channel, ChStatus } from '@/types/iptv';
import { statusColor, statusLabel } from '@/hooks/useStatusCheck';

interface Props {
  channel:   Channel;
  isPlaying: boolean;
  isFav:     boolean;
  status?:   ChStatus;
  onPlay:    (ch: Channel) => void;
  onFav:     (id: string) => void;
  onCheck:   (ch: Channel) => void;
  onHide:    (id: string) => void;
}

export default function ChannelItem({ channel: ch, isPlaying, isFav, status, onPlay, onFav, onCheck, onHide }: Props) {
  return (
    <div
      className={`channel-item${isPlaying ? ' channel-item--active' : ''}`}
      onClick={() => onPlay(ch)}
    >
      {/* Logo */}
      <div className="ch-logo">
        {ch.logo
          ? <img src={ch.logo} alt="" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M8 7V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/></svg>
        }
      </div>

      {/* Info */}
      <div className="ch-info">
        <span className={`ch-name${isPlaying ? ' ch-name--active' : ''}`}>{ch.name}</span>
        {ch.category && <span className="ch-cat">{ch.category}</span>}
      </div>

      {/* Status dot */}
      {status && (
        <div
          className={`status-dot${status === 'checking' ? ' status-dot--pulse' : ''}`}
          style={{ background: statusColor(status) }}
          title={statusLabel(status)}
        />
      )}

      {/* Actions */}
      <div className="ch-actions" onClick={e => e.stopPropagation()}>
        <button
          className={`ch-action-btn${isFav ? ' ch-action-btn--fav' : ''}`}
          onClick={() => onFav(ch.id)}
          title={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
        >
          {isFav
            ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          }
        </button>
        <button
          className="ch-action-btn ch-action-btn--check"
          onClick={() => onCheck(ch)}
          title="فحص الرابط"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <button
          className="ch-action-btn ch-action-btn--hide"
          onClick={() => onHide(ch.id)}
          title="إخفاء القناة"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}
