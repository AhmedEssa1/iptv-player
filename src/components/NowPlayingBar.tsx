'use client';

import type { Channel, ChStatus } from '@/types/iptv';
import { statusColor, statusLabel } from '@/hooks/useStatusCheck';

interface Props {
  channel: Channel;
  isFav: boolean;
  status?: ChStatus;
  onFav: (id: string) => void;
  onCheck: (ch: Channel) => void;
  onStop: () => void;
}

export default function NowPlayingBar({ channel, isFav, status, onFav, onCheck, onStop }: Props) {
  return (
    <div className="now-playing-bar">
      {channel.logo && (
        <img
          src={channel.logo}
          alt=""
          className="np-logo"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}

      <div className="np-info">
        <span className="np-name">{channel.name}</span>
        {channel.category && <span className="np-cat">{channel.category}</span>}
      </div>

      {status && (
        <div className="np-status">
          <div
            className={`status-dot${status === 'checking' ? ' status-dot--pulse' : ''}`}
            style={{ background: statusColor(status) }}
          />
          <span className="np-status-label">{statusLabel(status)}</span>
        </div>
      )}

      <div className="np-actions">
        <button
          className={`btn btn--sm${isFav ? ' btn--fav-active' : ' btn--ghost'}`}
          onClick={() => onFav(channel.id)}
        >
          {isFav
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          }
          {isFav ? 'مفضلة' : 'أضف'}
        </button>

        <button className="btn btn--sm btn--ghost" onClick={() => onCheck(channel)} title="فحص الرابط">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          فحص
        </button>

        <button className="btn btn--sm btn--danger" onClick={onStop}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          إيقاف
        </button>
      </div>
    </div>
  );
}
