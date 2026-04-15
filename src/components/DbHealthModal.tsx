"use client";

import { useState, useEffect, useCallback } from "react";

interface HealthState {
  ok: boolean;
  latency?: number;
  error?: string;
  checked: boolean;
}

export default function DbHealthModal() {
  const [health, setHealth] = useState<HealthState>({ ok: true, checked: false });
  const [isAdmin, setIsAdmin] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [secret, setSecret] = useState("");
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState("");
  const [logError, setLogError] = useState("");

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/db-health");
      const data = await res.json();
      setHealth({ ok: data.ok, latency: data.latency, error: data.error, checked: true });
      // Reset dismiss if DB comes back online
      if (data.ok) {
        setDismissed(false);
        setLog("");
        setLogError("");
      }
    } catch {
      setHealth({ ok: false, error: "Server non raggiungibile", checked: true });
    }
  }, []);

  useEffect(() => {
    // Try to detect admin (best-effort — might fail if DB is down)
    fetch("/api/auth")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.user?.role === "ADMIN") setIsAdmin(true); })
      .catch(() => {});

    checkHealth();
    const id = setInterval(checkHealth, 30_000);
    return () => clearInterval(id);
  }, [checkHealth]);

  const runMigrate = async () => {
    if (running || !secret.trim()) return;
    setRunning(true);
    setLog("");
    setLogError("");
    try {
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { "x-migrate-secret": secret.trim() },
      });
      const data = await res.json();
      if (data.ok) {
        setLog(data.stdout || "✓ Schema sincronizzato con successo");
        checkHealth();
      } else {
        setLogError(data.stderr || data.error || "Errore sconosciuto");
      }
    } catch {
      setLogError("Errore di connessione");
    } finally {
      setRunning(false);
    }
  };

  // Only render when DB is down, checked, and not dismissed
  if (!health.checked || health.ok || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setDismissed(true)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f0a1a 0%, #03050e 100%)" }}>

        {/* Top accent */}
        <div className="h-0.5 w-full bg-gradient-to-r from-red-500/60 via-orange-500/40 to-red-500/60" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}>
                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Database non raggiungibile</h3>
                <p className="text-red-400/70 text-xs mt-0.5 font-mono">{health.error}</p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-gray-600 hover:text-gray-400 transition-colors p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-400 text-sm mb-5 leading-relaxed">
            {isAdmin
              ? "Usa il pannello Database in dashboard per sincronizzare lo schema, oppure inserisci il secret admin qui sotto per un fix rapido."
              : "Il sito potrebbe non funzionare correttamente. Se sei l'amministratore, inserisci il secret per avviare la migrazione."}
          </p>

          {/* Secret input + run button */}
          {!log && (
            <div className="space-y-3">
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runMigrate()}
                placeholder="Admin secret (CRON_SECRET)"
                className="w-full bg-gray-900/80 border border-gray-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500/50 transition-colors"
              />
              <button
                onClick={runMigrate}
                disabled={running || !secret.trim()}
                className="w-full px-4 py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-sm font-semibold rounded-xl border border-orange-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {running ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Sincronizzazione schema...
                  </span>
                ) : "🗄️ Sincronizza schema DB"}
              </button>
            </div>
          )}

          {/* Log output */}
          {log && (
            <div className="mt-3 rounded-xl bg-green-500/10 border border-green-500/20 p-4">
              <p className="text-green-400 text-xs font-mono whitespace-pre-wrap">{log}</p>
              <button
                onClick={checkHealth}
                className="mt-3 text-xs text-green-400/70 hover:text-green-400 underline"
              >
                Verifica connessione
              </button>
            </div>
          )}

          {logError && (
            <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-red-400 text-xs font-mono whitespace-pre-wrap">{logError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
