import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeCraft",
  description: "Luxury event invitation platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
