
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { FavoritesProvider } from '@/hooks/use-favorites';
import { CartProvider } from '@/hooks/use-cart';
import { ThemeProvider } from '@/components/theme-provider';
import Script from 'next/script';
import { getSettings } from '@/lib/database';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: {
    default: 'IronAwe - Metal Sculptures by Jade | Dorset Artist',
    template: '%s | IronAwe',
  },
  description: 'Hand-forged metal sculptures and custom welding services by Jade, a Dorset-based artist. Discover unique, hand-forged metal art. Each piece tells a story of fire, steel, and artistry.',
  keywords: ['metal sculpture', 'welding', 'custom fabrication', 'art', 'steel art', 'Jade', 'Dorset artist', 'IronAwe'],
  authors: [{ name: 'Jade at IronAwe' }],
  openGraph: {
    title: 'IronAwe - Metal Sculptures & Welding by Jade',
    description: 'Discover hand-forged metal sculptures and custom welding services by Dorset-based artist, Jade.',
    url: new URL(defaultUrl),
    siteName: 'IronAwe',
    locale: 'en_GB',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const ALL_THEMES = [
    'theme-forged', 
    'theme-blueprint', 
    'theme-welders-arc',
    'theme-molten-core',
    'theme-graphite',
    'theme-oxidized',
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings();
  const defaultTheme = settings?.defaultTheme || 'theme-forged';
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          storageKey="ironawe-theme"
          themes={ALL_THEMES}
          disableTransitionOnChange
        >
          <CartProvider>
            <FavoritesProvider>
              <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster />
            </FavoritesProvider>
          </CartProvider>
        </ThemeProvider>
        <Script src="https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js" strategy="beforeInteractive" />
        <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
        <Script src="https://media-editor.cloudinary.com/all.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
