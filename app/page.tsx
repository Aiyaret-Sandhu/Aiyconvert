import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen p-8 flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to FileConvertor!</h1>
      <Link
        href="/convert"
        className="text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
      >
        Convert DOCX to PDF
      </Link>
    </main>
  );
}
