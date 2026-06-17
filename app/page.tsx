"use client";
import { useState } from "react";

interface CardEntry { qty: number; name: string; }
interface Wildcards { C: number; U: number; R: number; M: number; }

function parseDeck(text: string) {
  const lines = text.trim().split("\n");
  const mainboard: CardEntry[] = [];
  const sideboard: CardEntry[] = [];
  let inSide = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { inSide = true; continue; }
    if (/^(sideboard|réserve|reserve)/i.test(trimmed)) { inSide = true; continue; }
    if (/^(deck|maindeck)/i.test(trimmed)) { inSide = false; continue; }
    const match = trimmed.match(/^(\d+)\s+(.+?)(?:\s+\([\w\d]+\)\s+\d+)?$/);
    if (match) {
      const entry = { qty: parseInt(match[1]), name: match[2].trim() };
      if (inSide) sideboard.push(entry); else mainboard.push(entry);
    }
  }
  return { mainboard, sideboard };
}

function renderAnalysis(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <h2 key={i} className="text-base font-bold mt-6 mb-2 text-amber-400 border-b border-amber-900/40 pb-1">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="font-bold mt-3 mb-1 text-amber-300 text-sm">{line.slice(4)}</h3>;
    if (line.startsWith("- ❌")) return <p key={i} className="ml-3 my-0.5 text-red-400 text-xs">{line.slice(2)}</p>;
    if (line.startsWith("- ✅")) return <p key={i} className="ml-3 my-0.5 text-green-400 text-xs">{line.slice(2)}</p>;
    if (line.startsWith("- ")) return <p key={i} className="ml-3 my-0.5 text-slate-300 text-xs" dangerouslySetInnerHTML={{ __html: "• " + line.slice(2).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />;
    if (!line.trim()) return <div key={i} className="h-1" />;
    return <p key={i} className="text-slate-300 text-xs my-0.5 leading-relaxed" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, "<strong class='text-slate-100'>$1</strong>") }} />;
  });
}

export default function Home() {
  const [step, setStep] = useState(1);
  const [deckText, setDeckText] = useState("");
  const [parsedDeck, setParsedDeck] = useState<{ mainboard: CardEntry[]; sideboard: CardEntry[] } | null>(null);
  const [wildcards, setWildcards] = useState<Wildcards>({ C: 0, U: 0, R: 0, M: 0 });
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleParse() {
    const deck = parseDeck(deckText);
    if (deck.mainboard.length === 0) { setError("Format non reconnu. Utilise l'export Arena (ex: «4 Lightning Bolt»)."); return; }
    setError(""); setParsedDeck(deck); setStep(2);
  }

  async function handleAnalyze() {
    if (!parsedDeck) return;
    setLoading(true); setError(""); setAnalysis("");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deck: parsedDeck.mainboard, sideboard: parsedDeck.sideboard, wildcards }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis); setStep(3);
    } catch { setError("Erreur lors de l'analyse."); }
    finally { setLoading(false); }
  }

  function reset() { setStep(1); setDeckText(""); setParsedDeck(null); setAnalysis(""); setError(""); setWildcards({ C: 0, U: 0, R: 0, M: 0 }); }

  const total = parsedDeck?.mainboard.reduce((s, c) => s + c.qty, 0) ?? 0;
  const sideTotal = parsedDeck?.sideboard.reduce((s, c) => s + c.qty, 0) ?? 0;

  return (
    <main className="min-h-screen bg-[#0a0e1a] text-slate-100">
      <div className="bg-gradient-to-b from-[#0d1420] to-[#0a0e1a] border-b border-amber-900/30 px-4 py-8 text-center">
        <div className="text-4xl mb-2">⚔️</div>
        <h1 className="text-2xl font-bold tracking-widest text-amber-400" style={{ textShadow: "0 0 30px rgba(201,168,76,0.3)" }}>MTG Deck Analyzer</h1>
        <p className="text-slate-500 text-xs mt-1 tracking-wide">Analyse IA · Optimisation jokers · Tous formats Arena</p>
        <div className="flex justify-center items-center gap-3 mt-5">
          {["Deck", "Jokers", "Analyse"].map((label, i) => {
            const active = step === i + 1; const done = step > i + 1;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className={`flex items-center gap-1.5 text-xs ${done ? "text-green-400" : active ? "text-amber-400" : "text-slate-600"}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-green-400 text-black" : active ? "bg-amber-400 text-black" : "border border-slate-700 text-slate-600"}`}>{done ? "✓" : i + 1}</div>
                  {label}
                </div>
                {i < 2 && <div className="w-5 h-px bg-slate-800" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">

        {step === 1 && (
          <div className="mt-6">
            <h2 className="text-amber-400 font-bold text-sm mb-1">📋 Colle ta liste de deck</h2>
            <p className="text-slate-500 text-xs mb-3">Dans MTG Arena : ouvre ton deck → <span className="text-slate-300 font-semibold">Exporter</span> → colle ici.</p>
            <textarea value={deckText} onChange={e => setDeckText(e.target.value)}
              placeholder={"4 Lightning Bolt (M21) 142\n4 Monastery Swiftspear\n20 Mountain\n...\n\n(Sideboard)\n2 Pyroclasm"}
              rows={13}
              className="w-full bg-[#111827] border border-[#1e2d45] rounded-xl text-slate-200 text-xs p-3 font-mono leading-relaxed focus:outline-none focus:border-amber-600/50 resize-none"
            />
            {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
            <button onClick={handleParse} disabled={!deckText.trim()}
              className="mt-3 w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-700 text-black disabled:opacity-30 disabled:cursor-not-allowed hover:from-amber-400 hover:to-amber-600 transition-all">
              Analyser ce deck →
            </button>
          </div>
        )}

        {step === 2 && parsedDeck && (
          <div className="mt-6">
            <div className="bg-[#111827] border border-[#1e2d45] rounded-xl p-4 mb-5">
              <div className="flex justify-between mb-3">
                <span className="text-amber-400 font-bold text-sm">Maindeck ({total})</span>
                {sideTotal > 0 && <span className="text-slate-500 text-xs">Réserve ({sideTotal})</span>}
              </div>
              <div className="max-h-52 overflow-y-auto space-y-0.5 pr-1">
                {parsedDeck.mainboard.map((c, i) => (
                  <div key={i} className="flex gap-2 text-xs py-0.5 border-b border-slate-800/30">
                    <span className="text-slate-500 w-5 text-right">{c.qty}x</span>
                    <span className="text-slate-200">{c.name}</span>
                  </div>
                ))}
                {parsedDeck.sideboard.length > 0 && (<>
                  <div className="text-slate-600 text-xs uppercase tracking-wider pt-2 pb-1">Réserve</div>
                  {parsedDeck.sideboard.map((c, i) => (
                    <div key={i} className="flex gap-2 text-xs py-0.5">
                      <span className="text-slate-500 w-5 text-right">{c.qty}x</span>
                      <span className="text-slate-400">{c.name}</span>
                    </div>
                  ))}
                </>)}
              </div>
            </div>

            <h2 className="text-amber-400 font-bold text-sm mb-1">💎 Tes jokers disponibles</h2>
            <p className="text-slate-500 text-xs mb-3">Entre combien de jokers tu possèdes par rareté.</p>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {([
                { key: "C" as const, label: "Commune", icon: "⬜", border: "border-slate-600", text: "text-slate-300" },
                { key: "U" as const, label: "Peu commune", icon: "🔵", border: "border-blue-800", text: "text-blue-300" },
                { key: "R" as const, label: "Rare", icon: "🟡", border: "border-amber-800", text: "text-amber-400" },
                { key: "M" as const, label: "Mythique", icon: "🟠", border: "border-orange-800", text: "text-orange-400" },
              ]).map(({ key, label, icon, border, text }) => (
                <div key={key} className={`flex flex-col items-center gap-1.5 bg-[#111827] border ${border} rounded-xl py-3 px-1`}>
                  <span className="text-lg">{icon}</span>
                  <span className={`text-xs font-bold ${text} text-center leading-tight`}>{label}</span>
                  <input type="number" min={0} value={wildcards[key]}
                    onChange={e => setWildcards(w => ({ ...w, [key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className={`w-14 text-center bg-[#0a0e1a] border ${border} rounded-lg text-lg font-bold py-1 focus:outline-none ${text}`}
                  />
                </div>
              ))}
            </div>

            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-500 text-sm hover:border-slate-600 transition-colors">← Retour</button>
              <button onClick={handleAnalyze} disabled={loading}
                className="flex-[3] py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-700 text-black disabled:opacity-50 flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-600 transition-all">
                {loading ? (<><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Analyse en cours…</>) : "🔮 Lancer l'analyse IA"}
              </button>
            </div>
          </div>
        )}

        {step === 3 && analysis && (
          <div className="mt-6">
            <div className="flex gap-3 flex-wrap bg-[#111827] border border-[#1e2d45] rounded-xl px-4 py-3 mb-4 text-xs">
              <span className="text-slate-400">Jokers :</span>
              {(["C","U","R","M"] as const).map((k, i) => (
                <span key={k} className={["text-slate-300","text-blue-300","text-amber-400","text-orange-400"][i]}>
                  {["⬜","🔵","🟡","🟠"][i]} <strong>{wildcards[k]}</strong> {k}
                </span>
              ))}
            </div>
            <div className="bg-[#111827] border border-amber-900/30 rounded-xl p-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                <span className="text-xl">🔮</span>
                <h2 className="text-amber-400 font-bold text-base">Analyse complète</h2>
              </div>
              <div>{renderAnalysis(analysis)}</div>
            </div>
            <button onClick={reset} className="mt-4 w-full py-3 rounded-xl border border-amber-800/40 text-amber-600 text-sm hover:border-amber-600 hover:text-amber-400 transition-colors">
              ⟳ Analyser un autre deck
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
