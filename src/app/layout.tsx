import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ConfirmProvider } from '@/context/ConfirmContext';

import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'DKVN Admin',
  description: 'Trang quản trị hệ thống fanbase DKVN',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

const outfit = Outfit({
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <ConfirmProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </ConfirmProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
