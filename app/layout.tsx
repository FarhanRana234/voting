import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blossom Events — Tando Adam Eat Festival",
  description:
    "Vote for your favorite food stalls and participants at the Tando Adam Eat Festival by Blossom Events.",
};

export const viewport: Viewport = {
  themeColor: "#faf3ee",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}