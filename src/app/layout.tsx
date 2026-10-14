import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crescent | Quotation Repository",
  description: "Centralised quotation requests, vendor rates and price analysis for Crescent Contractors."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}