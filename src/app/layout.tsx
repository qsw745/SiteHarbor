import type { Metadata } from "next";
import localFont from "next/font/local";
import { getActiveDictionary } from "@/lib/locale";
import "./globals.css";

const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-inter",
});

const fraunces = localFont({
  src: "./fonts/fraunces-latin.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-fraunces",
});

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getActiveDictionary();
  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
    icons: {
      icon: "/icon.png",
      apple: "/apple-icon.png",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getActiveDictionary();
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} className={`${inter.variable} ${fraunces.variable}`}>
      <body>{children}</body>
    </html>
  );
}
