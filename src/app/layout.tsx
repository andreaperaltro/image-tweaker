import React from 'react';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/context/ThemeContext';
import Head from 'next/head';
import Script from 'next/script';

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
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: '/icons/icon-192x192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0000FF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className="h-full dark:bg-gray-900 dark:text-white transition-colors duration-200">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        
        {/* PayPal Donation Button Script */}
        <Script
          id="paypal-donate"
          strategy="lazyOnload"
          src="https://www.paypalobjects.com/donate/sdk/donate-sdk.js"
          onLoad={() => {
            // @ts-ignore - PayPal is loaded globally
            if (typeof window !== 'undefined' && window.PayPal && window.PayPal.Donation) {
              // @ts-ignore - PayPal is loaded globally
              window.PayPal.Donation.Button({
                env: 'production',
                hosted_button_id: 'BNU8J2MRNS4D4',
                image: {
                  src: 'https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif',
                  alt: 'Donate with PayPal button',
                  title: 'PayPal - The safer, easier way to pay online!',
                }
              }).render('#donate-button');
            }
          }}
        />
      </body>
    </html>
  );
} 