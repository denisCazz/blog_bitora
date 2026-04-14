import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="text-8xl font-bold text-gray-800 mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-4">
          Articolo non trovato
        </h1>
        <p className="text-gray-400 mb-8">
          L&apos;articolo che stai cercando non esiste o è stato rimosso.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
        >
          Torna alla Home
        </Link>
      </div>
    </div>
  );
}
