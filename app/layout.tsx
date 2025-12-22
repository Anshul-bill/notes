
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";
import Spotlight from "@/components/Spotlight";
export const metadata: Metadata = {
  title: "QuickNote",
  description: "Shareable Secure Notes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Spotlight />
          <div className="flex h-screen overflow-hidden bg-background text-foreground">
            {/* The Sidebar stays fixed on the left */}
            <Sidebar />
            
            {/* The Main Content area scrolls independently */}
            <main className="flex-1 overflow-auto relative">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}