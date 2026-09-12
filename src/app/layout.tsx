import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Купить/продать патент на изобретение или полезную модель в России",
  description:
    "Биржа патентов РФ — купите или продайте патент на изобретение или полезную модель. Актуальные объявления 2023-2026, проверка по реестру Роспатента, юридическое сопровождение сделки.",
  keywords: [
    "купить патент",
    "продать патент",
    "патент на изобретение",
    "полезная модель",
    "биржа патентов",
    "торговля патентами",
    "лицензионный договор",
    "договор отчуждения патента",
    "патенты России",
    "Роспатент",
  ],
  authors: [{ name: "Ipat.su" }],
  openGraph: {
    title: "Купить/продать патент на изобретение или полезную модель в России",
    description:
      "Биржа патентов РФ. Актуальные объявления о продаже патентов 2023-2026. Юридическое сопровождение сделок.",
    type: "website",
    locale: "ru_RU",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
