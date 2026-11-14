import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "FINN · Investor intelligence",
  description:
    "Primary-source financial research, portfolio signals and a promise ledger.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
