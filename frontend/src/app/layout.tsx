import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BacPipes - BACnet to MQTT Pipeline",
  description: "BACnet device discovery, configuration, and MQTT publishing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
