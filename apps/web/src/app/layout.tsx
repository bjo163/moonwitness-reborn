import type { Metadata } from "next";
import { TranslationCatalogProvider } from "../features/locale/translation-catalog";
import { ServiceWorkerRegister } from "../features/pwa/service-worker-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MoonWitness | A-L-L-A-H.COM ecosystem",
    template: "%s | MoonWitness",
  },
  description:
    "MoonWitness is a software platform within the A-L-L-A-H.COM ecosystem, helping people preserve knowledge, trace sources, and understand context.",
  manifest: "/manifest.webmanifest",
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
        <TranslationCatalogProvider>
          {children}
          <ServiceWorkerRegister />
        </TranslationCatalogProvider>
      </body>
    </html>
  );
}
