import type { Metadata } from "next";
import { Tenor_Sans } from "next/font/google";
import localFont from "next/font/local";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import "./globals.css";

// Body font — Tenor Sans (400 only; single-weight font)
const tenorSans = Tenor_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-tenor-sans",
  display: "swap",
});

// Display / heading font — Canter (local .otf files)
const canter = localFont({
  src: [
    {
      path: "../../public/fonts/Canter Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Canter Bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-canter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Titunge — ERP for tailoring businesses",
  description:
    "Track orders, measurements, inventory, and payments for your tailoring or garment business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${tenorSans.variable} ${canter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
        </ThemeProvider>
      </body>
    </html>
  );
}
