import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MoonWitness",
    template: "%s | MoonWitness",
  },
  description: "Ruang kerja AI MoonWitness.",
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
      <body>{children}</body>
    </html>
  );
}
