import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Sidebar from '@/components/Sidebar';

export const metadata: Metadata = {
  title: 'AyurAgent — Ayurveda Knowledge Graph',
  description: 'Ayurvedic botanical, phytochemical, and pharmacological intelligence platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0b0f14] text-[#e6edf3]">
        <Providers>
          <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f14]">
            <Sidebar />
            <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden pt-14 md:pt-0">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
