import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Helpdesk",
  description: "Personal helpdesk ticketing system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 flex flex-col">{children}</body>
    </html>
  );
}
