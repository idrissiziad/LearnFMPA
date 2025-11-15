import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LearnFMPA - Révisez efficacement les annales de médecine au Maroc",
  description: "Accédez à des milliers de questions corrigées de la 1ère à la 7ème année, avec des explications détaillées par des experts et des outils pour suivre votre progression.",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  themeColor: "#0d4f3c",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
