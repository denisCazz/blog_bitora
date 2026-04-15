"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SpaceBackground from "@/components/SpaceBackground";
import { LogoText } from "@/components/Logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore durante il login");
        return;
      }

      if (!data.user.onboardingComplete) {
        router.push("/registrati");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[80vh] flex items-center justify-center px-4 py-16 overflow-hidden">
      <SpaceBackground density="light" />
      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <LogoText className="text-2xl" />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Accedi</h1>
          <p className="text-gray-500 text-sm">
            Entra nel tuo account Blog Bitora
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-800/60 p-6 space-y-4"
          style={{ background: "rgba(3,5,14,0.85)", backdropFilter: "blur(12px)" }}
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="la.tua@email.com"
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="La tua password"
              className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email.trim() || !password.trim()}
            className="w-full px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Accesso..." : "Accedi"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Non hai un account?{" "}
            <Link
              href="/registrati"
              className="text-blue-400 hover:text-blue-300"
            >
              Registrati
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
