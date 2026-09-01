import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SettingsProvider } from "@/components/SettingsContext";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SIMMAS — Sistem Informasi Manajemen Magang Siswa",
  description:
    "Platform manajemen magang siswa SMK yang menghubungkan sekolah, guru pembimbing, dan dunia usaha dalam satu sistem terpadu.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${jakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <SettingsProvider>
            {children}
          </SettingsProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
