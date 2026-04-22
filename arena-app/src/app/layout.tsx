import "~/styles/globals.css";

import { type Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { TRPCReactProvider } from "~/trpc/react";
import { Header } from "~/components/layout/Header";
import { ErrorBoundary } from "~/components/ui/ErrorBoundary";

export const metadata: Metadata = {
  title: { default: "Arena", template: "%s · Arena" },
  description: "The verified performance layer for AI agents",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    siteName: "Arena",
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
            <main className="pt-12">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
