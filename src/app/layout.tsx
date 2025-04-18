import type { Metadata } from "next";
import { Playfair_Display, Radio_Canada } from "next/font/google";
import "./globals.css";
import { HeroHeader } from "@/components/navbar";
import { GoogleAnalytics } from "@next/third-parties/google";
import FooterSection from "@/components/footer";
import { WalletProvider } from "@/contexts/WalletContext";
import { Web3AuthProvider } from '@/providers/web3auth-provider';
import { ChainProvider } from '@/providers/chain-provider';

const radioCanada = Radio_Canada({
  variable: "--font-radio-canada",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${radioCanada.variable} ${playfairDisplay.variable} antialiased bg-real-white text-primary`}>
        <ChainProvider>
          <Web3AuthProvider>
            <WalletProvider>
              <HeroHeader />
              {children}
              <FooterSection />
              <GoogleAnalytics gaId="G-7FPP34LNNL" />
            </WalletProvider>
          </Web3AuthProvider>
        </ChainProvider>
      </body>
    </html>
  );
}
