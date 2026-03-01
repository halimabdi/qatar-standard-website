import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import BreakingBanner from "@/components/BreakingBanner";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/contexts/LanguageContext";
import OneSignalInit from "@/components/OneSignalInit";
import Image from "next/image";
import Script from "next/script";

export const metadata: Metadata = {
  title: { default: "Qatar Standard | قطر ستاندرد", template: "%s | Qatar Standard" },
  description: "Qatar news, Gulf diplomacy, and Middle East analysis — in Arabic and English",
  metadataBase: new URL("https://qatar-standard.com"),
  alternates: {
    canonical: "https://qatar-standard.com",
    languages: {
      en: "https://qatar-standard.com",
      ar: "https://qatar-standard.com",
      "x-default": "https://qatar-standard.com",
    },
  },
  openGraph: {
    title: "Qatar Standard | قطر ستاندرد",
    description: "Qatar news, Gulf diplomacy, and Middle East analysis",
    siteName: "Qatar Standard",
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_QA",
    images: [{ url: "/qatar-standard-logo.png", width: 500, height: 500 }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@QatarStandard",
  },
  icons: {
    icon: "/qatar-standard-logo.png",
    apple: "/qatar-standard-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Organization schema */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'NewsMediaOrganization',
          name: 'Qatar Standard',
          alternateName: 'قطر ستاندرد',
          url: 'https://qatar-standard.com',
          logo: { '@type': 'ImageObject', url: 'https://qatar-standard.com/qatar-standard-logo.png', width: 500, height: 500 },
          sameAs: ['https://twitter.com/QatarStandard'],
        }) }} />
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6753180364525256"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased bg-gray-50 font-sans">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-maroon-800 focus:text-white focus:px-4 focus:py-2 focus:rounded">
          Skip to content
        </a>
        {/* Twitter banner masthead — scrolls away, not sticky */}
        <div className="w-full overflow-hidden bg-maroon-900" style={{ height: '120px' }}>
          <Image
            src="/twitter-banner.jpg"
            alt="Qatar Standard"
            width={1500}
            height={500}
            className="w-full h-full object-cover"
            style={{ objectPosition: 'center 65%' }}
            priority
            unoptimized
          />
        </div>
        <LanguageProvider>
          <OneSignalInit />
          <BreakingBanner />
          <Header />
          <main id="main-content" className="min-h-screen">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
