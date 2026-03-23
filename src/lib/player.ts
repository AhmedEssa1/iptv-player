import Hls from 'hls.js';

export function isHlsUrl(url: string): boolean {
  return (
    url.includes('.m3u8') ||
    url.includes('type=m3u') ||
    !!url.match(/\.(m3u8?|ts)(\?|$)/)
  );
}

export function createHls(
  url: string,
  video: HTMLVideoElement,
  onError: (msg: string) => void,
): Hls {
  const hls = new Hls({
    enableWorker:   true,
    lowLatencyMode: true,
    maxBufferLength:    15,
    maxMaxBufferLength: 40,
  });
  hls.loadSource(url);
  hls.attachMedia(video);
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play().catch(() => onError('اضغط للتشغيل'));
  });
  hls.on(Hls.Events.ERROR, (_, data) => {
    if (data.fatal) onError('القناة غير متاحة أو الرابط منتهي');
  });
  return hls;
}
