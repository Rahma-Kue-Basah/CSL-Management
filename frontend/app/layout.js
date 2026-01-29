import { Poppins, Inter } from "next/font/google";
import "@/styles/globals.css";
// import "antd/dist/reset.css";
import { Toaster } from "@/components/ui/sonner";

const poppins = Inter({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
// const poppins = Poppins({
//   variable: "--font-poppins",
//   subsets: ["latin"],
//   weight: ["300", "400", "500", "600", "700"],
// });

export const metadata = {
  title: "CSL USE 2026",
  description: "PM Laboratorium",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
