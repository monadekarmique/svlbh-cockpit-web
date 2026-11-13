import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, DM_Sans, Crimson_Pro } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fonts de la charte doctrine cockpit (DEC Patrick 2026-06-03 v4 — charte
// topnav Palette de Lumière). Utilisées par <PageBreadcrumb> et par les
// articles HTML statiques (via fallback CSS sur 'DM Sans' / 'Crimson Pro').
// Sans liste de graisses : la police VARIABLE (100–1000), servie par Google en un fichier .woff2.
// Avec la liste 400/500/600/700, Google répond par moments par des adresses « /l/font?kit=…&skey=… »
// que Next 16.4.1 (Turbopack) ne sait pas lire : « next/font/google queries have exactly one entry »,
// build Render en échec deux fois le 13.11.2026 (mesuré : 2 réponses « kit » sur 35 depuis le Mac, 0 sur 25 en variable).
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const crimsonPro = Crimson_Pro({
  variable: "--font-crimson-pro",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "SVLBH Cockpit",
  description: "Cockpit Routines Cercle de Lumière — membres du Cercle (ST2+, choisi·es par le Cercle, droit de veto Patrick)",
  appleWebApp: {
    capable: true,
    title: "SVLBH Cockpit",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#000099",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${dmSans.variable} ${crimsonPro.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
