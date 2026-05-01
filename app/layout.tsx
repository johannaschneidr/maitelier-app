import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Nav from "./components/Nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "maitelier — Workshop schedule",
  description: "One place for workshops. Filter by when you're free, then book on the host site.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <Nav />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="mx-auto max-w-6xl px-6 md:px-10 h-14 flex items-center justify-between">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">© {new Date().getFullYear()} maitelier</span>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition">Instagram</a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition">Twitter</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
