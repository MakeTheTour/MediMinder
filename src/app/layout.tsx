import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { BottomNavbar } from '@/components/bottom-navbar';

export const metadata: Metadata = {
  title: 'MediMinder',
  description: 'Your personal medication and appointment assistant.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full bg-background">
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow pb-20">
            {children}
          </main>
          <BottomNavbar />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
