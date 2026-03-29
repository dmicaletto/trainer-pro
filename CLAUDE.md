---
title: TrainerPRO — Gym App
description: PWA React per il tracking degli allenamenti in palestra con Firebase backend
version: "1.2.9"
tags: [react, firebase, pwa, vite, tailwind, workout, fitness]
last_updated: 2026-03-06
related:
  - .claude/rules/01-firebase.md
  - .claude/rules/02-architettura.md
  - .claude/rules/03-dominio-workout.md
---

# TrainerPRO — Gym App

## Descrizione

PWA (Progressive Web App) per il tracking degli allenamenti in palestra.
Permette di gestire schede di allenamento, registrare sessioni, monitorare
il progresso nel tempo e analizzare volumi e progressioni.

## Stack Tecnologico

| Layer        | Tecnologia                          |
|--------------|-------------------------------------|
| UI Framework | React 18 + JSX                      |
| Build Tool   | Vite 5                              |
| Styling      | Tailwind CSS 3                      |
| Icone        | lucide-react                        |
| Grafici      | Chart.js + react-chartjs-2          |
| Backend/Auth | Firebase 10 (Auth + Firestore)      |
| PWA          | Service Worker (stale-while-revalidate) |
| Mobile       | Capacitor (`com.dmicaletto.trainerpro`) |

## Struttura Progetto

```
trainer-pro/
├── src/
│   ├── main.jsx          # Entry point + registrazione Service Worker
│   ├── tracker.jsx       # App monolitica (1300+ linee) — componente unico
│   └── index.css         # Tailwind + utility classes custom
├── public/
│   ├── images/           # GIF animate esercizi (24 file)
│   ├── manifest.json     # PWA manifest
│   └── sw.js             # Service Worker (stale-while-revalidate)
├── .claude/
│   └── rules/            # Regole specifiche del progetto
├── .mcp.json             # Configurazione Firebase MCP (locale, non committare)
├── capacitor.config.json # Configurazione app mobile Capacitor
├── CHANGELOG.md          # Log versioni
└── package.json          # Versione: 1.2.9
```

## Firebase

- **Progetto**: `training-c0b76`
- **Auth**: Email/Password + modalità Demo (anonima/guest)
- **Firestore path**: `artifacts/training-c0b76/users/{userId}/`
  - `profiles_meta/data` — dati profilo utente
  - `weight_history/` — storico peso corporeo
  - `workout_history/` — log sessioni allenamento
  - `custom_workouts/` — schede personalizzate
- **Web config**: pubblica by design, sicurezza delegata a Security Rules

## Architettura Attuale

L'app è un **singolo componente React monolitico** (`tracker.jsx`) con
state management inline tramite `useState`. Non usa Redux, Zustand o Context.

### View principali

| Condizione        | View                                      |
|-------------------|-------------------------------------------|
| `!user`           | Login / Registrazione / Demo              |
| `view=dashboard`  | Programma allenamento (3 giorni fissi)    |
| `view=active-workout` | Sessione attiva con timer recupero   |
| `view=history`    | Storico log e grafici (bar + line)        |
| `view=profile`    | Profilo utente (nome, peso, età, sesso)   |

### Dati Workout Template

3 giorni hardcoded in `INITIAL_WORKOUT_DAYS`:
- **Giorno 1**: Petto e Tricipiti (9 esercizi)
- **Giorno 2**: Gambe e Spalle
- **Giorno 3**: Schiena e Bicipiti

## Note di Sicurezza

- Firebase web config (`apiKey`, `projectId`, ecc.) è **pubblica per design**
  nelle web app. La sicurezza è delegata alle **Firestore Security Rules** lato server.
- La Gemini API key NON è nel codice sorgente: viene caricata da
  `artifacts/{appId}/public/data/config/secrets` a runtime.
- L'accesso admin (MCP, service account) richiede credenziali separate dalla web API key.
- `.mcp.json` è in `.gitignore` — NON va committato.

## Versionamento

La versione `1.2.9` è mantenuta **in sincronia** in tre posti:
1. `package.json` → campo `version`
2. `src/tracker.jsx` → costante interna o commento header
3. `CHANGELOG.md` → sezione più recente

Quando si aggiorna la versione, aggiornare **tutti e tre**.
