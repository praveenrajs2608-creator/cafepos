import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Premium Cafe POS System",
  description: "Next-gen Point of Sale, KDS, and self-ordering platform for modern cafes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-500 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
