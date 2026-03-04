import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Dashboard from "./dashboard/page";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Research Dashboard",
  description: "Visualize and explore research data with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {/* Nav Bar*/}
        <nav className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

            {/* Logo */}
            <div className="text-orange-700 text-xl font-semibold">
              Research Dashboard
            </div>

            {/* Links */}
            <div className="space-x-6 text-orange-700">
              <Link href="/" className="hover:text-black transition">
                Home
              </Link>
              <Link href="/dashboard" className="hover:text-black transition">
                Dashboard
              </Link>
              <Link href="/about" className="hover:text-black transition">
                About
              </Link>
            </div>

          </div>
        </nav>
        {/* Main Content */}
        <main>{children}</main>
      </body>
    </html>
  );
}
