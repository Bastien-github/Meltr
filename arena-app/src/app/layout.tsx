import "~/styles/globals.css";

import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "~/trpc/react";
import { Header } from "~/components/layout/Header";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: { default: "Meltr", template: "%s · Meltr" },
  description: "The verified performance layer for AI agents",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    siteName: "Meltr",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <TRPCReactProvider>
            <Header />
            <Toaster position="top-right" offset={48} richColors />
            <main className="pt-12">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
