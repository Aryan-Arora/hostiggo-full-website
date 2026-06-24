import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ListingFilterProvider } from '@/context/ListingFilterContext';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Hostiggo - Find Your Perfect Stay',
  description: 'Discover unique homestays and stays across India',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ListingFilterProvider>
            <Toaster position="top-center" richColors closeButton />
            {children}
          </ListingFilterProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
