import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Formedible - Schema-Driven Forms Made Simple",
  description:
    "A powerful React hook that wraps TanStack Form with shadcn/ui components. Features schema validation, multi-page support, component overrides, and custom wrappers.",
  openGraph: {
    title: "Formedible - Schema-Driven Forms Made Simple",
    description:
      "A powerful React hook that wraps TanStack Form with shadcn/ui components. Features schema validation, multi-page support, component overrides, and custom wrappers.",
    images: ["/og.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Formedible - Schema-Driven Forms Made Simple",
    description:
      "A powerful React hook that wraps TanStack Form with shadcn/ui components. Features schema validation, multi-page support, component overrides, and custom wrappers.",
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://cdn.counter.dev/script.js"
          data-id="154c6878-7558-4eff-90f9-bd4904015df1"
          data-utcoffset="1"
        ></script>
        <script
          src="https://cdn.databuddy.cc/databuddy.js"
          data-client-id="jIFbt2Gic1qWpMO1W16OO"
          data-enable-batching="true"
          crossOrigin="anonymous"
          async
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <Header />
          {children}
        </Providers>
        <script
          src="https://tasu.ai/widget/v1.js"
          data-company="formedible-dev"
          data-color="#F7931A"
          async
        ></script>
      </body>
    </html>
  );
}
