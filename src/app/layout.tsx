import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LearnFMPA - Révisez efficacement les annales de médecine au Maroc",
  description: "Accédez à des milliers de questions corrigées de la 1ère à la 7ème année, avec des explications détaillées par des experts et des outils pour suivre votre progression.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0d4f3c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <SpeedInsights />
        {process.env.NODE_ENV === 'production' && (
          <div id="analytics-container"></div>
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.location.hostname !== 'localhost') {
                setTimeout(() => {
                  const script = document.createElement('script');
                  script.src = '/_vercel/insights/script.js';
                  script.defer = true;
                  script.id = 'vercel-analytics';
                  document.getElementById('analytics-container')?.appendChild(script);
                }, 3000);
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
