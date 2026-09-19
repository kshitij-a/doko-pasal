import type { Metadata, Viewport } from "next";
import "./globals.css";
import UserChatWidget from '../components/UserChatWidget';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://doko-pasal.vercel.app';

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
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col">
        {children}
        <UserChatWidget />
      </body>
    </html>
  );
}