import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Shared feed',
  description: 'Create, edit, and share text posts in one simple feed.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-background text-foreground min-h-full font-sans">
        <a
          href="#main-content"
          className="rounded-control bg-card text-primary focus:outline-ring sr-only z-50 p-4 focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:outline-2"
        >
          Skip to content
        </a>
        <header className="border-primary bg-card border-t-4 shadow-sm">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-4">
            <p className="font-heading text-primary text-lg font-semibold tracking-tight">
              Shared feed
            </p>
            <span className="text-muted-foreground text-xs">No sign-in required</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
