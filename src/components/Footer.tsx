import Logo, { LogoText } from "@/components/Logo";
import { CATEGORIES } from "@/lib/utils";

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Logo size={30} />
              <LogoText className="text-lg" />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Notizie e approfondimenti tech generati con intelligenza artificiale, 
              con fonti verificate e aggiornamenti quotidiani.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Categorie
            </h3>
            <ul className="space-y-2.5">
              {CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat}>
                  <a
                    href={`/?category=${encodeURIComponent(cat)}`}
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    {cat}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Link
            </h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="/"
                  className="text-gray-500 hover:text-white text-sm transition-colors"
                >
                  Ultime Notizie
                </a>
              </li>
              <li>
                <a
                  href="https://bitora.it"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-blue-400 text-sm transition-colors"
                >
                  Bitora.it
                </a>
              </li>
            </ul>
          </div>

          {/* Bitora */}
          <div>
            <h3 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">
              Bitora
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-3">
              Bitora è un&apos;azienda italiana specializzata in sviluppo software, 
              consulenza IT, soluzioni cloud e automazione digitale per aziende 
              e professionisti.
            </p>
            <a
              href="https://bitora.it"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
            >
              Scopri i servizi →
            </a>
          </div>
        </div>

        <div className="border-t border-gray-800/60 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} blog Bitora — Articoli generati con AI, fonti verificate
          </p>
          <p className="text-gray-600 text-xs">
            Un progetto{" "}
            <a
              href="https://bitora.it"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-blue-400 transition-colors"
            >
              Bitora
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
