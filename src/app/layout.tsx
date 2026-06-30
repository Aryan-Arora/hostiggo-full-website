import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider as CustomAuthProvider } from '@/context/AuthContext';
import { ListingFilterProvider } from '@/context/ListingFilterContext';
import { Toaster } from 'sonner';
import SupabaseAuthProvider from '@/components/providers/AuthProvider';

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
        <SupabaseAuthProvider>
          <CustomAuthProvider>
            <ListingFilterProvider>
              <Toaster position="top-center" richColors closeButton />
              {children}
            </ListingFilterProvider>
          </CustomAuthProvider>
        </SupabaseAuthProvider>
      </body>
    </html>
  );
}
