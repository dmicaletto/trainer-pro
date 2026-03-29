---
title: Regole Firebase — TrainerPRO
description: Linee guida per lavorare con Firebase in questo progetto
last_updated: 2026-03-06
---

# Regole Firebase

## Progetto Firebase

- **Project ID**: `training-c0b76`
- **Auth Domain**: `training-c0b76.firebaseapp.com`
- **App ID**: `1:149618028951:web:eca42664d47ab6d71954d2`

## Struttura Firestore

```
artifacts/
└── training-c0b76/
    └── users/
        └── {userId}/
            ├── profiles_meta/
            │   └── data          # documento unico profilo utente
            ├── weight_history/   # collezione documenti peso
            ├── workout_history/  # collezione log sessioni
            └── custom_workouts/  # collezione schede personalizzate
```

### Schema documento `profiles_meta/data`

```js
{
  displayName: string,
  age: number,
  weight: number,       // kg
  gender: 'male' | 'female' | 'other',
  updatedAt: Timestamp
}
```

### Schema documento `workout_history/{logId}`

```js
{
  date: Timestamp,
  dayId: string,         // 'day_1' | 'day_2' | 'day_3'
  dayName: string,
  duration: number,      // secondi
  totalVolume: number,   // tonnellaggio (kg × reps)
  rating: number,        // 1–5 stelle
  exercises: [
    {
      name: string,
      sets: [{ reps: number, weight: number, completed: boolean }]
    }
  ]
}
```

## Regole di Utilizzo MCP

Il Firebase MCP è configurato in `.mcp.json` e consente operazioni dirette su Firestore.

**Operazioni consentite:**
- `firestore_get_documents` — lettura documenti (sempre con `limit`)
- `firestore_add_document` — scrittura nuovi documenti
- `firestore_update_document` — aggiornamento documenti esistenti
- `firestore_run_query` — query filtrate

**Operazioni da evitare senza conferma esplicita:**
- Eliminazione di documenti o collezioni (`firestore_delete_document`)
- Modifica delle Security Rules
- Operazioni su raccolte diverse da `artifacts/training-c0b76/users/`

## Sicurezza

- La web config Firebase (apiKey, ecc.) è **pubblica per design** — non è un segreto.
- La sicurezza reale è nelle **Firestore Security Rules** lato server.
- Per operazioni admin (service account), usare credenziali separate dalla CLI.
- `.mcp.json` **non deve essere committato** — contiene path locali machine-specific.
- La Gemini API key non è nel sorgente: viene letta a runtime da path specifici.

## Autenticazione

Il progetto usa due modalità:

1. **Email/Password** — utenti registrati, dati su Firestore
2. **Demo Mode** — accesso anonimo senza salvataggio su cloud (solo local state)

Quando si modifica la logica auth, verificare che entrambe le modalità continuino a funzionare.
