import type { Metadata } from "next";
import { Press_Start_2P, Orbitron, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "../components/navbar";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
});

const displayFont = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Neon Cabinet - Retro Arcade",
  description:
    "A virtual web arcade for retro-style games. Play classics like Space Defender and more.",
  icons: { icon: "/assets/neon-cabinet-favicon.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${pixelFont.variable} ${displayFont.variable} ${sansFont.variable}`}
    >
      <body className="arcade-bg min-h-screen antialiased">
        <Navbar />
        <main className="relative min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  );
}
