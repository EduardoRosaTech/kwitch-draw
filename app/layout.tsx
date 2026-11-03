import type { ReactNode } from "react";
import "./style.css";
export const metadata = {
  title: "Kwitch Draw • Seu ritual criativo",
  description: "Pequenos desenhos. Grandes encantamentos.",
};
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content="#271b31" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icon.svg" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
