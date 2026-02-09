import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "@/styles/globals.css";

const inter = Plus_Jakarta_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CSL Management | Universitas  Prasetiya Mulya",
  description: "Collaborative STEM Laboratory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>{children}</body>
    </html>
  );
}
