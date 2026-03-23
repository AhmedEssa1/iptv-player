export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
