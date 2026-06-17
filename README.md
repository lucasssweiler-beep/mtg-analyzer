# MTG Deck Analyzer

Analyse tes decks MTG Arena avec l'IA Claude. Colle ta liste, entre tes jokers disponibles, et reçois une analyse experte avec des suggestions d'amélioration personnalisées.

## Installation

```bash
npm install
```

## Configuration

1. Copie `.env.example` en `.env.local`
2. Ajoute ta clé API Anthropic : https://console.anthropic.com/

```
ANTHROPIC_API_KEY=sk-ant-...
```

## Développement local

```bash
npm run dev
```

Ouvre http://localhost:3000

## Déploiement sur Vercel

1. Push ce repo sur GitHub
2. Va sur https://vercel.com → New Project → importe ton repo
3. Dans "Environment Variables", ajoute `ANTHROPIC_API_KEY`
4. Deploy !

## Fonctionnalités

- ✅ Parse le format export MTG Arena (avec ou sans codes de set)
- ✅ Supporte maindeck + réserve
- ✅ Analyse par Claude Opus (modèle le plus puissant)
- ✅ Plan d'upgrade personnalisé selon tes jokers disponibles
- ✅ Tous formats : Standard, Historic, Alchemy, Explorer, Timeless
- ✅ Interface mobile-first
