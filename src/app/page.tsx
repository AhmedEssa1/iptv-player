'use client';

import { useState, useCallback, useEffect } from 'react';
import type { M3USource } from '@/types/iptv';

import { useStore }       from '@/hooks/useStore';
import { useChannels }    from '@/hooks/useChannels';
import { usePlayer }      from '@/hooks/usePlayer';
import { useStatusCheck } from '@/hooks/useStatusCheck';

import AppHeader     from '@/components/AppHeader';
import Sidebar       from '@/components/Sidebar';
import PlayerArea    from '@/components/PlayerArea';
import NowPlayingBar from '@/components/NowPlayingBar';
import WelcomeScreen from '@/components/WelcomeScreen';
import SourceModal   from '@/components/SourceModal';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [modal, setModal] = useState<null | 'add' | string>(null); // null | 'add' | sourceId

  /* ── Core hooks ── */
  const store    = useStore();
  const channels = useChannels({ stored: store.stored, getSourceUrl: store.getSourceUrl });
  const player   = usePlayer();
  const checker  = useStatusCheck(channels.filtered);

  /* ── Sync srcId → loadSource ── */
  useEffect(() => {
    const src = store.allSources.find(s => s.id === channels.srcId);
    if (src) channels.loadSource(src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels.srcId]);

  /* ── Source modal helpers ── */
  const openEditModal = useCallback((src: M3USource) => setModal(src.id), []);
  const openAddModal  = useCallback(() => setModal('add'), []);
  const closeModal    = useCallback(() => setModal(null), []);

  const handleSave = useCallback((name: string, url: string, username: string, password: string, icon: string) => {
    if (modal === 'add') {
      const id = store.addSource(name, url, username, password, icon);
      channels.setSrcId(id);
    } else if (modal) {
      store.saveSourceEdit(modal, name, url, username, password, icon);
    }
    closeModal();
  }, [modal, store, channels, closeModal]);

  const handleDelete = useCallback((id: string) => {
    store.deleteSource(id);
    closeModal();
  }, [store, closeModal]);

  /* ── Editing source data for modal ── */
  const editingSrc   = modal && modal !== 'add' ? store.allSources.find(s => s.id === modal) : undefined;
  const editingUrl   = modal && modal !== 'add' ? store.getSourceUrl(editingSrc!) : undefined;
  const editingCreds = modal && modal !== 'add' ? store.stored.credentials[modal] : undefined;

  const hiddenSourceCount = (store.stored.hiddenSources || []).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', direction: 'rtl' }}>

      <AppHeader
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(v => !v)}
        channelCount={channels.channels.length}
        filteredCount={channels.filtered.length}
        loading={channels.loading}
        hasActiveSource={!!channels.srcId}
        onReload={() => {
          const src = store.allSources.find(s => s.id === channels.srcId);
          if (src) channels.loadSource(src);
        }}
        onAddSource={openAddModal}
      />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          // sources
          allSources={store.allSources}
          srcId={channels.srcId}
          loadingSrc={channels.loading}
          hiddenSourceCount={hiddenSourceCount}
          onSelectSource={channels.setSrcId}
          onEditSource={openEditModal}
          onRestoreDefaults={store.restoreDefaultSources}
          // filters
          channels={channels.channels}
          search={channels.search}       onSearch={v => { channels.setSearch(v); channels.setPage(1); }}
          category={channels.category}   onCategory={v => { channels.setCategory(v); channels.setPage(1); }}
          cats={channels.cats}
          onlyFavs={channels.onlyFavs}   onToggleFavs={() => { channels.setOnlyFavs(v => !v); channels.setPage(1); }}
          checkingAll={checker.checkingAll} onCheckAll={checker.checkAll}
          xtreamCats={channels.xtreamCats}
          xtreamCatId={channels.xtreamCatId}
          onSelectXtreamCat={catId => {
            if (!catId) { channels.backToXtreamCats(); return; }
            const src = store.allSources.find(s => s.id === channels.srcId);
            if (src) channels.loadXtreamCat(src, catId, channels.xtreamCats);
          }}
          // channel list
          loading={channels.loading}
          loadErr={channels.loadErr}
          displayed={channels.displayed}
          filtered={channels.filtered}
          hasMore={channels.hasMore}
          onLoadMore={() => channels.setPage(p => p + 1)}
          onRetryLoad={() => {
            const src = store.allSources.find(s => s.id === channels.srcId);
            if (src) channels.loadSource(src);
          }}
          // state
          stored={store.stored}
          statuses={checker.statuses}
          playing={player.playing}
          onPlay={player.play}
          onFav={store.toggleFav}
          onCheck={checker.checkOne}
          onHide={store.hideCh}
        />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
          {player.playing ? (
            <>
              <PlayerArea
                videoRef={player.videoRef}
                playerErr={player.playerErr}
                onRetry={player.retryPlay}
              />
              <NowPlayingBar
                channel={player.playing}
                isFav={store.stored.favorites.includes(player.playing.id)}
                status={checker.statuses[player.playing.id]}
                onFav={store.toggleFav}
                onCheck={checker.checkOne}
                onStop={player.stopPlayer}
              />
            </>
          ) : (
            <WelcomeScreen
              hasSource={!!channels.srcId && channels.channels.length > 0}
              onSelectSource={channels.setSrcId}
            />
          )}
        </main>
      </div>

      <SourceModal
        mode={modal}
        source={editingSrc}
        storedUrl={editingUrl}
        storedCredentials={editingCreds}
        onClose={closeModal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
