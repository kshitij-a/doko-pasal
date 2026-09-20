import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Nunito } from "next/font/google";
import "./globals.css";
import UserChatWidget from '../components/UserChatWidget';
import MobileBottomBar from '../components/MobileBottomBar';
import Analytics from '../components/Analytics';
import { getBaseUrl, SITE_NAME } from "../lib/site";

// Storefront fonts only. Admin keeps its own CSS vars (--admin-font-ui/mono
// in globals.css, falling back to system fonts) — untouched.
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const body = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  alternates: { canonical: '/' },
  title: "Doko Pasal - Nepal's Favourite Clothing Store",
  description: "Shop the best clothing in Nepal. Men, Women and Kids wear. Fast delivery across Nepal. Premium quality ethnic and modern fashion.",
  keywords: ["nepal clothing", "doko pasal", "nepali dress", "men wear nepal", "women wear nepal", "kids wear nepal", "daura suruwal", "kurti", "saree"],
  openGraph: {
    title: "Doko Pasal - Nepal's Favourite Clothing Store",
    description: "Shop the best clothing in Nepal. Men, Women and Kids wear. Fast delivery across Nepal.",
    type: "website",
    locale: "en_US",
    siteName: "Doko Pasal",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#1E1A16',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: baseUrl,
  };
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen flex flex-col">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
        <Analytics />
        {children}
        <MobileBottomBar />
        <UserChatWidget />
      </body>
    </html>
  );
}
