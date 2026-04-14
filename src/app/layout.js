import "./globals.css";

export const metadata = {
  title: "Antigravity Roulette",
  description: "Plataforma de ruletas interactivas para eventos en vivo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
