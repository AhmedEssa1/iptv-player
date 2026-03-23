'use client';

import { useState, useRef, useCallback } from 'react';
import Hls from 'hls.js';
import type { Channel } from '@/types/iptv';
import { isHlsUrl, createHls } from '@/lib/player';

export function usePlayer() {
  const [playing,   setPlaying]   = useState<Channel | null>(null);
  const [playerErr, setPlayerErr] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef   = useRef<Hls | null>(null);

  const play = useCallback((ch: Channel) => {
    setPlaying(ch);
    setPlayerErr(null);
    hlsRef.current?.destroy();
    hlsRef.current = null;
    const video = videoRef.current;
    if (!video) return;

    if (isHlsUrl(ch.url)) {
      if (Hls.isSupported()) {
        hlsRef.current = createHls(ch.url, video, setPlayerErr);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = ch.url;
        video.play().catch(() => setPlayerErr('اضغط للتشغيل'));
      } else {
        setPlayerErr('المتصفح لا يدعم HLS');
      }
    } else {
      video.src = ch.url;
      video.play().catch(() => setPlayerErr('اضغط للتشغيل'));
    }
  }, []);

  const stopPlayer = useCallback(() => {
    hlsRef.current?.destroy();
    hlsRef.current = null;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.src = ''; }
    setPlaying(null);
    setPlayerErr(null);
  }, []);

  const retryPlay = useCallback(() => {
    if (!playing) return;
    setPlayerErr(null);
    play(playing);
  }, [playing, play]);

  return { playing, playerErr, videoRef, play, stopPlayer, retryPlay };
}
