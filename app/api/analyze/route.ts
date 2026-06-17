import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { deck, sideboard, wildcards } = await req.json();

  if (!deck || deck.length === 0) {
    return NextResponse.json({ error: "Deck vide" }, { status: 400 });
  }

  const total = deck.reduce((s: number, c: { qty: number }) => s + c.qty, 0);
  const sideTotal = sideboard.reduce((s: number, c: { qty: number }) => s + c.qty, 0);
  const deckStr = deck.map((c: { qty: number; name: string }) => `${c.qty}x ${c.name}`).join("\n");
  const sideStr =
    sideboard.length > 0
      ? "\n\nRéserve:\n" +
        sideboard.map((c: { qty: number; name: string }) => `${c.qty}x ${c.name}`).join("\n")
      : "";

  const prompt = `Tu es un expert Magic: The Gathering Arena, spécialisé dans tous les formats compétitifs (Standard, Historic, Alchemy, Explorer, Timeless).

Le joueur soumet ce deck (${total} cartes en maindeck${sideTotal > 0 ? `, ${sideTotal} en réserve` : ""}) :

${deckStr}${sideStr}

Jokers disponibles :
- Communes (C) : ${wildcards.C}
- Peu communes (U) : ${wildcards.U}
- Rares (R) : ${wildcards.R}
- Mythiques (M) : ${wildcards.M}

Effectue une analyse experte et complète en français :

## 🎯 Identité du deck
Archétype précis, couleurs, format probable, plan de jeu général (stratégie principale, plan A et plan B).

## 📊 Évaluation globale
Note le deck sur 10 avec une justification claire. Évalue : cohérence, puissance, consistance, courbe de mana.

## 💪 Points forts
Les 4-5 atouts principaux avec explication de pourquoi ils fonctionnent ensemble.

## ⚠️ Faiblesses critiques
Les 4-5 problèmes identifiés avec leur impact concret sur le plan de jeu.

## 🔧 Améliorations recommandées (priorisées)
Pour chaque suggestion :
- ❌ Retirer : [carte] x[quantité]
- ✅ Ajouter : [carte] x[quantité] (Rareté: C/U/R/M) — Raison précise
Classe par priorité d'impact. Sois très concret sur POURQUOI chaque échange est bénéfique.

## 💎 Plan d'upgrade avec tes jokers (${wildcards.C}C / ${wildcards.U}U / ${wildcards.R}R / ${wildcards.M}M)
- **Améliorations faisables maintenant** : liste exacte des swaps réalisables avec les jokers dispo
- **Jokers à économiser** : quoi attendre et dans quel ordre crafter
- **Coût total de la version optimale** : X communes, X peu communes, X rares, X mythiques

## 🏆 Version cible optimale
La decklist idéale à 60 cartes (+ réserve si pertinent) avec le delta exact par rapport au deck actuel.

## 🎲 Conseils de jeu
3-4 tips concrets sur comment jouer ce deck : mulligan type, séquence de jeu idéale, matchups favorables/défavorables.`;

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");

  return NextResponse.json({ analysis: text });
}
