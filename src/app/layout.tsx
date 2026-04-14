import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blog Bitora - Notizie Tech powered by AI",
  description:
    "Il blog tech italiano powered by AI. Notizie, trend e approfondimenti dal mondo della tecnologia.",
  metadataBase: new URL("https://blog.bitora.it"),
  openGraph: {
    title: "Blog Bitora - Notizie Tech powered by AI",
    description:
      "Il blog tech italiano powered by AI. Notizie, trend e approfondimenti dal mondo della tecnologia.",
    siteName: "Blog Bitora",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-950 text-white font-[family-name:var(--font-inter)]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
