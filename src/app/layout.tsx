import type { Metadata, Viewport } from "next";
import "./globals.css";
import { googleFontsUrl } from "@/lib/fontFamilies";
import { Providers } from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: { default: "CakeVerse — Design Your Cake in 3D", template: "%s · CakeVerse" },
  description: "Design your perfect celebration cake in an immersive 3D studio. Shapes, tiers, flavours, chocolate roses, figurines and personalised messages — delivered fresh.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0907" },
    { media: "(prefers-color-scheme: light)", color: "#fbf5ef" },
  ],
};

const themeScript = `try{var p=JSON.parse(localStorage.getItem('cakeverse:prefs')||'{}');var t=(p.state&&p.state.theme)||'dark';document.documentElement.classList.toggle('dark',t==='dark')}catch(e){document.documentElement.classList.add('dark')}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={googleFontsUrl} rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <Providers>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] btn btn-primary px-4 py-2">
            Skip to content
          </a>
          <Navbar />
          <main id="main" className="min-h-[70vh]">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
