import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Image from "next/image";

export const metadata: Metadata = {
  title: { default: "Qatar Standard | قطر ستاندرد", template: "%s | Qatar Standard" },
  description: "Qatar news, Gulf diplomacy, and Middle East analysis — in Arabic and English",
  metadataBase: new URL("https://qatar-standard.com"),
  openGraph: {
    title: "Qatar Standard | قطر ستاندرد",
    description: "Qatar news, Gulf diplomacy, and Middle East analysis",
    siteName: "Qatar Standard",
    type: "website",
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
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-REPLACE_WITH_YOUR_PUB_ID"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased bg-gray-50 font-sans">
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
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
