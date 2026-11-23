import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Administration — District Wear",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <body className="bg-cream-100 text-ink-900 min-h-dvh antialiased">{children}</body>
    </html>
  );
}
