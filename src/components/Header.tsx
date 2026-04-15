"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Logo, { LogoText } from "@/components/Logo";

interface UserInfo {
  id: string;
  name: string;
  role: string;
  onboardingComplete: boolean;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  const isCreator = user?.role === "CREATOR";
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={34} className="transition-transform group-hover:scale-105" />
            <LogoText className="text-xl" />
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            <Link
              href="/"
              className="px-3 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Home
            </Link>
            <div className="w-px h-5 bg-gray-800 mx-2" />
            <a
              href="https://bitora.it"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 transition-all"
            >
              Bitora.it ↗
            </a>

            {user ? (
              <div className="relative ml-2">
                {(isCreator || isAdmin) && (
                  <Link
                    href="/crea"
                    className="px-3 py-1.5 text-sm text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/20 transition-all mr-2"
                  >
                    + Crea articolo
                  </Link>
                )}
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-400">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50">
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/dashboard?tab=admin"
                        className="block px-4 py-2.5 text-sm text-orange-400 hover:text-orange-300 hover:bg-white/5"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-gray-800" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-500 hover:text-white hover:bg-white/5"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  Accedi
                </Link>
                <Link
                  href="/registrati"
                  className="px-3 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-400 rounded-lg transition-colors font-medium"
                >
                  Registrati
                </Link>
              </div>
            )}
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <nav className="md:hidden pb-4 border-t border-gray-800/60 pt-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5"
              onClick={() => setMenuOpen(false)}
            >
              Home
            </Link>
            <a
              href="https://bitora.it"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2.5 text-sm text-blue-400 hover:text-blue-300 rounded-lg hover:bg-white/5"
            >
              Bitora.it ↗
            </a>
            <div className="border-t border-gray-800/60 my-2" />
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {(isCreator || isAdmin) && (
                  <Link
                    href="/crea"
                    className="block px-3 py-2.5 text-sm text-purple-400 hover:text-purple-300 rounded-lg hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    + Crea articolo
                  </Link>
                )}
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2.5 text-sm text-gray-500 hover:text-white rounded-lg hover:bg-white/5"
                >
                  Logout ({user.name})
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2.5 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Accedi
                </Link>
                <Link
                  href="/registrati"
                  className="block px-3 py-2.5 text-sm text-blue-400 hover:text-blue-300 rounded-lg hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  Registrati
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
