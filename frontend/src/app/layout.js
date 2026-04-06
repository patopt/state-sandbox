import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/context/user-context';
import { Geist_Mono, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'State Sandbox — AI Grand Strategy',
  description:
    'An AI-powered alternate history grand strategy game. Control a nation, command armies, forge diplomacy, and simulate history.',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} antialiased`}>
        <UserProvider>
          {children}
          <Toaster />
        </UserProvider>
      </body>
    </html>
  );
}
