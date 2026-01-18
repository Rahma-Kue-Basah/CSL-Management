import { Poppins } from "next/font/google";
import "@/styles/globals.css";
import { Toaster } from "@/components/ui/sonner";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata = {
  title: "CSL USE 2026",
  description: "PM Laboratorium",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
