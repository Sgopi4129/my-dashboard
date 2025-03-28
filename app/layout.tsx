// app/layout.tsx
import '../styles/globals.css'; // Correct path to styles/globals.css

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}