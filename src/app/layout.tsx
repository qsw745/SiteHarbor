import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getActiveDictionary } from "@/lib/locale";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export async function generateMetadata(): Promise<Metadata> {
  const { dict } = await getActiveDictionary();
  return {
    title: dict.metadata.title,
    description: dict.metadata.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getActiveDictionary();
  return (
    <html lang={locale === "zh" ? "zh-CN" : "en"} className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
