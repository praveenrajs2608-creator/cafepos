import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Savora Atlas",
  description: "Next-gen Point of Sale, KDS, and self-ordering platform by Savora Atlas.",
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
        <Script 
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" 
          strategy="afterInteractive" 
        />
        <Script id="onesignal-init" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "b59d1190-00c3-4405-bbfe-1b5b8f641519",
              });
            });
          `}
        </Script>
      </body>
    </html>
  );
}
