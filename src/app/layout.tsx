import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteHarbor",
  description: "A private portal for routing visitors to managed websites.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
