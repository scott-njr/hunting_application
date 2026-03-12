import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, Inter, Geist_Mono } from "next/font/google";
import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import "./globals.css";

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://praevius.com'),
  title: {
    template: '%s | Lead the Wild by Praevius',
    default: 'Lead the Wild by Praevius — Outdoor Skills Platform',
  },
  description: 'Structured paths, mentors, and AI-powered tools for hunting, archery, firearms, fishing, and fitness. Join the outdoor community.',
  openGraph: {
    type: 'website',
    siteName: 'Lead the Wild by Praevius',
    locale: 'en_US',
    images: [{ url: '/images/exploring/bear_lake_2.JPG', width: 1200, height: 630, alt: 'Lead the Wild by Praevius — Outdoor Skills Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Praevius',
              url: 'https://praevius.com',
              logo: 'https://praevius.com/logo.png',
              description: 'Lead the Wild — a multi-module outdoor skills platform for hunting, archery, firearms, fishing, fitness, and more.',
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Lead the Wild',
              url: 'https://praevius.com',
            }),
          }}
        />
      </head>
      <body
        className={`${barlowCondensed.variable} ${inter.variable} ${geistMono.variable} antialiased`}
      >
        <AuthModalProvider>
          {children}
        </AuthModalProvider>
      </body>
    </html>
  );
}
