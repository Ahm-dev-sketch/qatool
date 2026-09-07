import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "QATOOL — QA Automation Dashboard",
  description: "Test execution reports, analytics, flaky leaderboard, and step introspection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <div className="flex flex-1 flex-col pl-0 md:pl-64">
              <Header />
              <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
