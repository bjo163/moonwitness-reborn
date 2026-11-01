import type { Metadata } from "next";
import { TranslationCatalogProvider } from "../features/locale/translation-catalog";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MoonWitness | A-L-L-A-H.COM ecosystem",
    template: "%s | MoonWitness",
  },
  description:
    "MoonWitness is a software platform within the A-L-L-A-H.COM ecosystem, helping people preserve knowledge, trace sources, and understand context.",
  // A reset link opened from email must not leak its token to a third-party referrer.
  referrer: "same-origin",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <TranslationCatalogProvider>{children}</TranslationCatalogProvider>
      </body>
    </html>
  );
}
