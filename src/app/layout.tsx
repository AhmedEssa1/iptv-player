import './globals.css';

export const metadata = {
  title: 'IPTV Player',
  description: 'مشغل IPTV احترافي',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
