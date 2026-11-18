import type { Metadata } from "next";
import { Geist, Geist_Mono, Libre_Baskerville } from "next/font/google";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-display",
});

const SEO_KEYWORDS = [
  "Guild Wars 2",
  "GW2",
  "GW2 helper",
  "GW2 guide",
  "GW2 roadmap",
  "Guild Wars 2 progress tracker",
  "GW2 Ascended",
  "GW2 mastery",
  "GW2 world boss timer",
  "GW2 meta events",
  "GW2 Wizard's Vault",
  "GW2 crafting",
  "GW2 legendary",
  "GW2 PvP",
  "GW2 WvW",
  "GW2 story guide",
  "Visions of Eternity",
  "Janthir Wilds",
  "Secrets of the Obscure",
  "End of Dragons",
  "Path of Fire",
  "Heart of Thorns",
  "GW2 API helper",
  "Tyria",
  "Fabio Monreal",
];

export const metadata: Metadata = {
  metadataBase: new URL("https://gw2-helper.vercel.app"),
  title: {
    default: "GW2 Helper - plano PvE, história, Ascended e WvW",
    template: "%s · GW2 Helper",
  },
  description:
    "Helper local de Guild Wars 2: o que fazer agora na sua conta - eventos, Ascended, masteries, crafting, história, Vault, PvP e WvW, com wiki e teleport.",
  keywords: SEO_KEYWORDS,
  authors: [{ name: "Fabio Monreal", url: "https://fabio-monreal.vercel.app/" }],
  creator: "Fabio Monreal",
  applicationName: "GW2 Helper",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "GW2 Helper",
    title: "GW2 Helper - seu plano em Tyria",
    description:
      "Progresso Guild Wars 2 adaptado ao seu estágio: F2P até Visions of Eternity. Eventos, Ascended, história, PvP/WvW.",
    url: "https://gw2-helper.vercel.app",
  },
  twitter: {
    card: "summary",
    title: "GW2 Helper",
    description:
      "Helper de progresso GW2: roadmap, eventos, Ascended, masteries, história e WvW.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }, { url: "/icon-512.jpg" }],
    apple: [{ url: "/apple-touch-icon.jpg" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Nav />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-cyan-500/10 py-4 text-center text-xs text-slate-500">
          <Link href="/info" className="neon-link hover:underline">
            Sobre o GW2 Helper
          </Link>
          {" · "}
          Fabio Monreal
        </footer>
      </body>
    </html>
  );
}
