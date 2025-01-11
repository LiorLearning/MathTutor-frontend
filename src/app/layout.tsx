import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from '@/components/themeContext';  // adjust path as needed
import "./globals.css";
import { Toaster } from "@/components/ui/toaster"
import { ThemeScript } from '@/components/bolt/theme-script';
import { ThemeListener } from '@/components/bolt/theme-listener';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MathKraft",
  description: "MathKraft by Lior Learning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      <html lang="en">
        <head>
          <ThemeScript />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeListener />
          <main>{children}</main>
          <Toaster />
        </body>
      </html>
    </ThemeProvider>
  );
}
