import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import Nav from "./components/Nav";
import "./globals.css";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "maitelier. — Workshop schedule",
  description: "A hand-picked index of workshops across the five boroughs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${newsreader.variable} ${inter.variable} antialiased flex flex-col min-h-screen`}>
        <Nav />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-stone-warm/20 bg-claret-deep">
          <div className="mx-auto max-w-6xl px-6 md:px-10 h-14 flex items-center justify-between">
            <span className="italic text-xs text-cream-soft">© {new Date().getFullYear()} maitelier.</span>
            <div className="flex items-center gap-4">
              <a href="https://instagram.com/find.maitelier" target="_blank" rel="noopener noreferrer" className="font-sans text-xs text-cream-soft hover:text-cream transition">@find.maitelier</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
