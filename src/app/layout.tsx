import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "IMPACT — Eastwood Montreux International School",
    template: "%s · IMPACT",
  },
  description:
    "The project learning platform for the IMPACT programme at Eastwood Montreux International School.",
  applicationName: "IMPACT",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#000077",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
