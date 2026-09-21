import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The One SaaS — FanzoftheOne",
  description: "Multi-vertical SaaS command surface by FanzoftheOne",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0b1117", color: "#f5f5f5" }}>
        {children}
      </body>
    </html>
  );
}
