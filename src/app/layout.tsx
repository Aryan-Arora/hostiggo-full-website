import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ListingFilterProvider } from '@/context/ListingFilterContext';
import { Toaster } from 'sonner';
// import { Analytics } from '@vercel/analytics/next';

// Figma "Website Guest UI/UX" uses Poppins (Regular/Medium/SemiBold/Bold)
// throughout -- this replaces the never-actually-loaded "Inter" fallback.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

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
    <html lang="en" className={poppins.variable} data-scroll-behavior="smooth">
      <body className={poppins.className}>
        <AuthProvider>
          <ListingFilterProvider>
            <Toaster position="top-center" richColors closeButton />
            {children}
          </ListingFilterProvider>
        </AuthProvider>
        {/* <Analytics /> */}
      </body>
    </html>
  );
}
