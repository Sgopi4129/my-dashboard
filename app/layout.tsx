// app/layout.tsx
import '../styles/globals.css'; // Correct path to styles/globals.css

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

export const metadata = {
  title: 'My Dashboard',
  description: 'A dashboard for insights and analytics',
};