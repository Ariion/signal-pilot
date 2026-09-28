import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SignalPilot — AI Visibility Autopilot",
  description: "Mesurez, comprenez et améliorez la visibilité de votre entreprise dans les moteurs IA."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body>{children}</body></html>;
}
