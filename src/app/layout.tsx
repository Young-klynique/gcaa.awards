import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Awards & Dinner Night 2026 | Vote & Nominate",
  description: "Nominate and vote for your favorite candidates across various award categories. Join us for an unforgettable Awards & Dinner Night celebration.",
  keywords: ["awards", "voting", "nomination", "dinner night", "ceremony"],
  openGraph: {
    title: "Awards & Dinner Night 2026",
    description: "Nominate and vote for your favorite candidates across various award categories.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
              color: '#e2e8f0',
              backdropFilter: 'blur(20px)',
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
