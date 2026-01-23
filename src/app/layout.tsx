import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { plPL } from "@clerk/localizations";
import "./globals.css";
import Navigation from "@/components/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Order Simulation System",
  description: "System symulujący obsługę zamówień z Azure Service Bus",
};

const customLocalization = {
  ...plPL,
  unstable__errors: {
    ...plPL.unstable__errors,
    form_identifier_not_found: 'To konto nie istnieje. Zaloguj sie kontem uczelnianym @akademiabialska.pl',
    form_password_incorrect: 'Niepoprawne haslo. Sprobuj ponownie.',
    form_identifier_exists: 'To konto juz istnieje.',
    not_allowed_access: 'Wymagane konto uczelniane @akademiabialska.pl',
    form_param_format_invalid: 'Wymagane konto uczelniane @akademiabialska.pl. Uzyj adresu e-mail z domeny @akademiabialska.pl lub @stud.akademiabialska.pl',
    form_password_not_strong_enough: 'Haslo jest za slabe.',
    form_param_nil: 'Wymagane konto uczelniane @akademiabialska.pl',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={customLocalization}>
      <html lang="pl">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white min-h-screen`}
        >
          <Navigation />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
