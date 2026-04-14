"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CATEGORIES } from "@/lib/utils";

type Step = 1 | 2 | 3;

export default function RegistratiPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2
  const [selectedRole, setSelectedRole] = useState<"READER" | "CREATOR">("READER");
  const [creatorSlots, setCreatorSlots] = useState<number | null>(null);

  // Step 3
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");

    if (name.trim().length < 2) {
      setError("Il nome deve avere almeno 2 caratteri");
      return;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Inserisci un'email valida");
      return;
    }
    if (password.length < 8) {
      setError("La password deve avere almeno 8 caratteri");
      return;
    }
    if (password !== confirmPassword) {
      setError("Le password non corrispondono");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore durante la registrazione");
        return;
      }

      // Fetch creator count for step 2
      try {
        const countRes = await fetch("/api/creators/count");
        if (countRes.ok) {
          const countData = await countRes.json();
          setCreatorSlots(50 - (countData.count || 0));
        }
      } catch {
        // non-blocking
      }

      setStep(2);
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = () => {
    setStep(3);
  };

  const handleStep3 = async () => {
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          preferredCategories: selectedCategories,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore durante il setup");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Errore di connessione");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-blue-500" : "bg-gray-800"
                }`}
              />
            </div>
          ))}
          <span className="text-xs text-gray-500 ml-2">
            {step}/3
          </span>
        </div>

        {/* Step 1: Account */}
        {step === 1 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                Crea il tuo account
              </h1>
              <p className="text-gray-500 text-sm">
                Unisciti alla community di Blog Bitora
              </p>
            </div>

            <form
              onSubmit={handleStep1}
              className="bg-gray-900/50 rounded-2xl border border-gray-800/60 p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Il tuo nome"
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="la.tua@email.com"
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 8 caratteri"
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Conferma Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ripeti la password"
                  className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Creazione account..." : "Continua"}
              </button>

              <p className="text-center text-sm text-gray-500">
                Hai già un account?{" "}
                <Link
                  href="/login"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Accedi
                </Link>
              </p>
            </form>
          </div>
        )}

        {/* Step 2: User type */}
        {step === 2 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                Come vuoi usare Bitora?
              </h1>
              <p className="text-gray-500 text-sm">
                Puoi sempre cambiare in seguito
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <button
                type="button"
                onClick={() => setSelectedRole("READER")}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  selectedRole === "READER"
                    ? "bg-blue-500/10 border-blue-500/40"
                    : "bg-gray-900/50 border-gray-800/60 hover:border-gray-700"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">📖</div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Lettore</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Leggi e cerca articoli, genera fino a 2 articoli
                      personalizzati al giorno con l&apos;AI
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("CREATOR")}
                className={`w-full text-left p-5 rounded-2xl border transition-all ${
                  selectedRole === "CREATOR"
                    ? "bg-purple-500/10 border-purple-500/40"
                    : "bg-gray-900/50 border-gray-800/60 hover:border-gray-700"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-2xl">✍️</div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">
                      Creator
                      {creatorSlots !== null && (
                        <span className="ml-2 text-xs font-normal text-purple-400">
                          {creatorSlots} posti rimasti
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Crea e pubblica articoli con l&apos;aiuto dell&apos;AI,
                      fino a 12 al mese. Gratis per i primi 50 Creator!
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center mb-4">{error}</p>
            )}

            <button
              onClick={handleStep2}
              className="w-full px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-400 transition-colors"
            >
              Continua
            </button>
          </div>
        )}

        {/* Step 3: Categories */}
        {step === 3 && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white mb-2">
                I tuoi interessi
              </h1>
              <p className="text-gray-500 text-sm">
                Seleziona le categorie che preferisci
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                    selectedCategories.includes(cat)
                      ? "bg-blue-500/15 border-blue-500/40 text-blue-300"
                      : "bg-gray-900/50 border-gray-800/60 text-gray-400 hover:border-gray-700 hover:text-gray-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center mb-4">{error}</p>
            )}

            <button
              onClick={handleStep3}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Completamento..." : "Completa registrazione"}
            </button>

            <button
              onClick={handleStep3}
              disabled={loading}
              className="w-full mt-3 px-4 py-2.5 text-gray-500 text-sm rounded-lg hover:text-gray-300 transition-colors"
            >
              Salta per ora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
