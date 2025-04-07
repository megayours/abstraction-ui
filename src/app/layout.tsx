import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HeroHeader } from "@/components/navbar";
import { GoogleAnalytics } from "@next/third-parties/google";
import FooterSection from "@/components/footer";
import { WalletProvider } from "@/contexts/WalletContext";
import { Web3AuthProvider } from '@/providers/web3auth-provider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MegaYours",
  description: "Reimagining the world's digital assets beyond ownership",
  openGraph: {
    title: "MegaYours",
    description: "Reimagining the world's digital assets beyond ownership",
    url: "https://megayours.com/",
    type: "website",
    images: ["/logo-image1.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MegaYours",
    description: "Reimagining the world's digital assets beyond ownership",
    images: ["/logo-image1.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3AuthProvider>
          <WalletProvider>
            <HeroHeader />
            {children}
            <FooterSection />
            <GoogleAnalytics gaId="G-7FPP34LNNL" />
          </WalletProvider>
        </Web3AuthProvider>
      </body>
    </html>
  );
}
