'use client';

import type { Channel, ChStatus, M3USource, StoredData } from '@/types/iptv';
import ChannelItem from './ChannelItem';

interface Props {
  open: boolean;
  onClose: () => void;

  // Sources
  allSources: M3USource[];
  srcId: string;
  loadingSrc: boolean;
  hiddenSourceCount: number;
  onSelectSource: (id: string) => void;
  onEditSource: (src: M3USource) => void;
  onRestoreDefaults: () => void;

  // Filters
  channels: Channel[];
  search: string; onSearch: (v: string) => void;
  category: string; onCategory: (v: string) => void;
  cats: string[];
  onlyFavs: boolean; onToggleFavs: () => void;
  checkingAll: boolean; onCheckAll: () => void;

  // Channel list
  loading: boolean;
  loadErr: string | null;
  displayed: Channel[];
  filtered: Channel[];
  hasMore: boolean;
  onLoadMore: () => void;
  onRetryLoad: () => void;

  // State + actions
  stored: StoredData;
  statuses: Record<string, ChStatus>;
  playing: Channel | null;
  onPlay: (ch: Channel) => void;
  onFav: (id: string) => void;
  onCheck: (ch: Channel) => void;
  onHide: (id: string) => void;
}

export default function Sidebar(p: Props) {
  return (
    <>
      {/* Mobile overlay */}
      {p.open && (
        <div className="sidebar-overlay" onClick={p.onClose} />
      )}

      <aside className={`sidebar${p.open ? ' sidebar--open' : ''}`}>

        {/* ── Sources ── */}
        <div className="sidebar-section sidebar-section--sources">
          <div className="section-header">
            <span className="section-label">المصادر</span>
            {p.hiddenSourceCount > 0 && (
              <button className="restore-btn" onClick={p.onRestoreDefaults}>
                ↺ استعادة ({p.hiddenSourceCount})
              </button>
            )}
          </div>

          <div className="source-list">
            {p.allSources.map(src => (
              <div
                key={src.id}
                className={`source-item${p.srcId === src.id ? ' source-item--active' : ''}`}
                onClick={() => p.onSelectSource(src.id)}
              >
                <span className="source-icon">{src.icon || '📡'}</span>
                <span className="source-name">{src.name}</span>
                {p.loadingSrc && p.srcId === src.id && (
                  <span className="spinner" style={{ width: 12, height: 12, flexShrink: 0 }} />
                )}
                <button
                  className="source-edit-btn"
                  onClick={e => { e.stopPropagation(); p.onEditSource(src); }}
                  title="تعديل"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filters ── */}
        {p.channels.length > 0 && (
          <div className="sidebar-section sidebar-section--filters">
            <input
              className="search-input"
              type="text"
              value={p.search}
              onChange={e => { p.onSearch(e.target.value); }}
              placeholder="بحث في القنوات..."
            />
            <div className="filter-row">
              <select
                className="cat-select"
                value={p.category}
                onChange={e => p.onCategory(e.target.value)}
              >
                {p.cats.map(c => (
                  <option key={c} value={c}>{c === 'all' ? 'كل الفئات' : c}</option>
                ))}
              </select>
              <button
                className={`filter-btn${p.onlyFavs ? ' filter-btn--active-fav' : ''}`}
                onClick={p.onToggleFavs}
                title={p.onlyFavs ? 'إظهار الكل' : 'المفضلة فقط'}
              >
                {p.onlyFavs
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                }
              </button>
              <button
                className={`filter-btn filter-btn--check${p.checkingAll ? ' filter-btn--active' : ''}`}
                onClick={p.onCheckAll}
                disabled={p.checkingAll}
                title={p.checkingAll ? 'جاري الفحص...' : 'فحص جميع القنوات الظاهرة'}
              >
                {p.checkingAll
                  ? <span className="spinner" style={{ width: 12, height: 12 }} />
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                }
              </button>
            </div>
          </div>
        )}

        {/* ── Channel list ── */}
        <div className="channel-list">

          {/* Loading */}
          {p.loading && (
            <div className="list-state">
              <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
              <span className="list-state-text">جاري التحميل...</span>
            </div>
          )}

          {/* Error */}
          {p.loadErr && !p.loading && (
            <div className="list-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{p.loadErr}</span>
              {p.srcId && (
                <button className="btn btn--primary btn--sm" onClick={p.onRetryLoad}>إعادة المحاولة</button>
              )}
            </div>
          )}

          {/* No source */}
          {!p.loading && !p.loadErr && !p.srcId && (
            <div className="list-state">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round"><path d="M4 10v10h16V10"/><path d="M2 10l10-7 10 7"/><path d="M9 21v-6h6v6"/></svg>
              <span className="list-state-text">اختر مصدراً للبدء</span>
            </div>
          )}

          {/* No favs */}
          {!p.loading && p.onlyFavs && p.filtered.length === 0 && p.channels.length > 0 && (
            <div className="list-state">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--border)" strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              <span className="list-state-text">لا توجد قنوات مفضلة</span>
            </div>
          )}

          {/* Channels */}
          {p.displayed.map(ch => (
            <ChannelItem
              key={ch.id}
              channel={ch}
              isPlaying={p.playing?.id === ch.id}
              isFav={p.stored.favorites.includes(ch.id)}
              status={p.statuses[ch.id]}
              onPlay={p.onPlay}
              onFav={p.onFav}
              onCheck={p.onCheck}
              onHide={p.onHide}
            />
          ))}

          {/* Load more */}
          {p.hasMore && (
            <div className="load-more-wrap">
              <button className="load-more-btn" onClick={p.onLoadMore}>
                تحميل المزيد — {(p.filtered.length - p.displayed.length).toLocaleString()} قناة
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
