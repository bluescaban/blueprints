import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BluePrints by Blue",
  description: "FigJam/Figma MCP workflows, specs, and Mermaid user flows",
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
      </body>
    </html>
  );
}
