import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { CADProvider } from '@/hooks/CADContext';
import { ConvexClientProvider } from '@/providers/convex-client-provider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BNA CAD',
  description: 'AI CAD for everyone',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <ConvexClientProvider>
        <CADProvider>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            {children}
          </body>
        </CADProvider>
      </ConvexClientProvider>
    </html>
  );
}
