import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BluePrints by Blue',
  description:
    'A powerful tool for generating specs, plans, tasks, and Mermaid user flows from FigJam/Figma workflows',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
