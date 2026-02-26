import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: { default: "قطر ستاندرد | Qatar Standard", template: "%s | Qatar Standard" },
  description: "موقع إخباري متخصص في الشأن القطري والخليجي والدبلوماسية الإقليمية",
  metadataBase: new URL("https://qatar-standard.com"),
  openGraph: {
    title: "قطر ستاندرد | Qatar Standard",
    description: "أخبار قطر والخليج والدبلوماسية",
    siteName: "Qatar Standard",
    locale: "ar_QA",
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
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-gray-50">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
