import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crescent | Quotation Repository",
  description: "Centralised quotation requests, vendor rates and price analysis for Crescent Contractors.",
  icons: { icon: "https://skyblue-sandpiper-962282.hostingersite.com/wp-content/uploads/2026/10/CRESCENT-Logo.webp", shortcut: "https://skyblue-sandpiper-962282.hostingersite.com/wp-content/uploads/2026/10/CRESCENT-Logo.webp" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}