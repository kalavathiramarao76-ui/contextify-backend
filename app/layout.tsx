import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contextify API',
  description: 'AI-powered text analysis proxy for Contextify',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: '2rem', background: '#0f0f0f', color: '#e0e0e0' }}>
        {children}
      </body>
    </html>
  );
}
