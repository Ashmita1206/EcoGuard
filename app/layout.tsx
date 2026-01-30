import React from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EchoGuard',
  description:
    'AI-powered quality assurance and coaching platform for call centers',
  generator: 'Team',
  icons: {
    icon: [
      {
        url: '/EchoGuard.jpeg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/EchoGuard.jpeg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/EchoGuard.jpeg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/EchoGuard.jpeg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
