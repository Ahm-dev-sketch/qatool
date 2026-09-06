import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "QATOOL — Test Engine Reporting Dashboard",
  description: "Test execution reports, analytics, flaky leaderboard, and step introspection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased flex min-h-screen">
        <Providers>
          <Sidebar />
          <main className="flex-1 overflow-x-hidden min-h-screen flex flex-col">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
