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
        <Analytics />
      </body>
    </html>
  );
}
