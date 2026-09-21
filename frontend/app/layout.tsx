import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FanzSpot Labs — The One SaaS",
  description: "Multi-vertical operating system by FanzSpot Labs / FanzoftheOne",
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
