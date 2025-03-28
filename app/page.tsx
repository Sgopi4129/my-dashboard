// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Link href="/dashboard">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Go to Dashboard
        </button>
      </Link>
    </div>
  );
}