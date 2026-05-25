import type { Metadata, Viewport } from "next";
import { SitePreloader } from "@/components/layout/SitePreloader";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const SITE_DESCRIPTION =
  "Квіткова студія Floret у Полтаві — авторські букети, оформлення весіль і подій, доставка по Полтаві та самовивіз. Працюємо з 2015 року.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Floret Poltava — квіткова студія в Полтаві",
    template: "%s · Floret Poltava",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Floret Poltava",
  keywords: [
    "квіткова студія Полтава",
    "букети Полтава",
    "доставка квітів Полтава",
    "весільні букети",
    "флорист Полтава",
    "Floret",
  ],
  openGraph: {
    type: "website",
    siteName: "Floret Poltava",
    locale: "uk_UA",
    url: SITE_URL,
    title: "Floret Poltava — квіткова студія в Полтаві",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/images/hero.jpg",
        width: 1024,
        height: 683,
        alt: "Авторський букет Floret",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Floret Poltava — квіткова студія в Полтаві",
    description: SITE_DESCRIPTION,
    images: ["/images/hero.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${cormorant.variable} min-h-screen bg-bg font-sans text-ink antialiased [text-size-adjust:100%]`}
      >
        <SitePreloader />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function hide(){var el=document.getElementById("site-preloader");if(el)el.style.setProperty("display","none","important");}setTimeout(hide,3000);})();`,
          }}
        />
        {children}
        <noscript>
          <style>{`#site-preloader{display:none!important}`}</style>
        </noscript>
      </body>
    </html>
  );
}
