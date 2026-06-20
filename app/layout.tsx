import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import UserChatWidget from '../components/UserChatWidget';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col`}>
        {children}
        <UserChatWidget />
      </body>
    </html>
  );
}