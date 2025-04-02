import React from 'react';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Space_Mono } from 'next/font/google';

const spaceMono = Space_Mono({ 
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap' 
});

export const metadata: Metadata = {
  title: 'ImageTweaker',
  description: 'Brutalist image manipulation app',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ImageTweaker',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={spaceMono.className}>{children}</body>
    </html>
  );
} 