---
title: Regole Architettura — TrainerPRO
description: Convenzioni e vincoli architetturali del progetto
last_updated: 2026-03-06
---

# Regole Architettura

## Struttura Corrente

L'app è un **monolite React** in un singolo file `src/tracker.jsx` (~1300 linee).
Questa è una scelta deliberata di semplicità per un progetto personale di dimensioni contenute.

**Non introdurre** senza discussione preventiva:
- Cartelle `components/`, `hooks/`, `context/`, `store/`
- Librerie di state management esterne (Redux, Zustand, Jotai)
- React Router (la navigazione è gestita con `useState`)
- Nuovi file `.jsx` / `.tsx` aggiuntivi

Se un refactoring è necessario, **proporre prima** e attendere approvazione.

## Convenzioni Codice

### JSX / React

- Componente unico esportato: `export default function App()`
- State con `useState` inline nel componente principale
- Hook custom solo se riutilizzati almeno 2 volte
- Nomi funzioni handler: `handle<Azione>` (es. `handleStartWorkout`)
- Nomi funzioni fetch: `fetch<Risorsa>` (es. `fetchHistoryLogs`)

### Styling

- **Solo Tailwind CSS** per lo styling — nessun CSS-in-JS, nessun modulo CSS
- Classi Tailwind inline nel JSX: `className="bg-gray-800 rounded-lg p-4"`
- Utility custom in `src/index.css` solo se non realizzabile con Tailwind
- Tema: dark background (`gray-900`), testo bianco, accenti `blue-500` / `green-500`

### Import

Ordine degli import in `tracker.jsx`:
1. React e hook (`import React, { useState, useEffect, ... }`)
2. Firebase (`import { ... } from 'firebase/firestore'`)
3. Librerie UI (`import { ... } from 'lucide-react'`)
4. Librerie dati (`import { ... } from 'chart.js'`)

### Naming

| Tipo | Convenzione | Esempio |
|------|------------|---------|
| Componente | PascalCase | `App`, `RestTimerModal` |
| Funzione handler | camelCase, prefisso `handle` | `handleCompleteSet` |
| Funzione fetch | camelCase, prefisso `fetch` | `fetchWeeklyVolume` |
| Costante globale | UPPER_SNAKE_CASE | `INITIAL_WORKOUT_DAYS` |
| State var | camelCase | `activeSession`, `isMenuOpen` |
| ID esercizi | snake_case prefissato | `d1_e1`, `d2_e3` |

## Build & Deploy

- **Build**: `npm run build` → output in `dist/`
- **Dev server**: `npm run dev` → porta 5173
- **Preview build**: `npm run preview`
- **Base path**: `./` (relativa) — necessaria per Capacitor mobile
- **PWA**: Service Worker in `public/sw.js`, cache name `gym-app-v2`

## Versionamento

La versione va aggiornata **in sincronia** in tre posti:
1. `package.json` → campo `"version"`
2. `src/tracker.jsx` → header commento o costante interna
3. `CHANGELOG.md` → aggiungere nuova sezione in cima

Formato versione: `MAJOR.MINOR.PATCH` (SemVer)
- PATCH: bugfix, fix UI
- MINOR: nuova feature, nuova view
- MAJOR: refactoring architetturale significativo

## Gestione Immagini

- Le GIF degli esercizi sono in `public/images/`
- Percorso nel codice: `'./images/<nome>.gif'` (path relativo dalla root pubblica)
- Non spostare o rinominare senza aggiornare i riferimenti in `INITIAL_WORKOUT_DAYS`

## Performance

- Il Service Worker usa **stale-while-revalidate**: serve prima dalla cache, poi aggiorna.
- Le GIF sono pre-caricate all'avvio (elencate in `sw.js` per il pre-cache).
- Per nuovi esercizi con GIF, aggiungere il path anche alla lista in `sw.js`.

## Mobile (Capacitor)

- App ID: `com.dmicaletto.trainerpro`
- Web dir: `dist/` (output Vite)
- Schema Android: `https`
- Splash screen: nessuno (duration 0)
- Non modificare `capacitor.config.json` senza considerare l'impatto su build mobile.
