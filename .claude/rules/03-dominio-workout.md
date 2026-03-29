---
title: Dominio Workout — TrainerPRO
description: Terminologia, strutture dati e logica di business del dominio allenamento
last_updated: 2026-03-06
---

# Dominio Workout

## Terminologia

| Termine | Significato |
|---------|-------------|
| **Scheda** | Programma di allenamento completo (3 giorni) |
| **Giorno** (`day`) | Singola sessione di allenamento (es. "Giorno 1: Petto e Tricipiti") |
| **Esercizio** (`exercise`) | Singolo movimento (es. "Panca Piana - Bilanciere") |
| **Serie** (`set`) | Singola esecuzione dell'esercizio con reps e peso |
| **Reps** | Numero di ripetizioni in una serie |
| **Peso** | Peso utilizzato in una serie (kg) |
| **Volume / Tonnellaggio** | Peso × Reps, misura il carico totale di lavoro |
| **Recupero** (`rest`) | Pausa tra le serie (es. "90s", "120s") |
| **Sessione attiva** | Allenamento in corso, non ancora salvato |
| **Log** | Sessione allenamento completata e salvata su Firestore |
| **Rating** | Valutazione soggettiva della sessione (1–5 stelle) |

## Struttura Dati Workout

### Template Giorno (`INITIAL_WORKOUT_DAYS`)

```js
{
  'day_1': {
    name: "Giorno 1: Petto e Tricipiti",
    exercises: [
      {
        id: 'd1_e1',              // ID univoco: d{dayNum}_e{exNum}
        name: "Panca Piana - Bilanciere",
        sets: [
          { reps: 12, weight: 40, completed: false },
          { reps: 10, weight: 45, completed: false },
          { reps: 8,  weight: 50, completed: false }
        ],
        rest: "90s",              // durata recupero
        imageUrl: './images/panca-piana.gif',
        notes: "Schienale piatto, presa larga..."
      },
      // ... altri esercizi
    ]
  }
}
```

### Sessione Attiva (`activeSession`)

```js
{
  dayId: 'day_1',
  dayName: "Giorno 1: Petto e Tricipiti",
  startTime: Date.now(),
  exercises: [...] // copia modificabile di INITIAL_WORKOUT_DAYS[dayId].exercises
}
```

### Log Salvato su Firestore

```js
{
  date: serverTimestamp(),
  dayId: 'day_1',
  dayName: "Giorno 1: Petto e Tricipiti",
  duration: 3600,        // secondi totali sessione
  totalVolume: 4500,     // kg totali (solo set completed=true)
  rating: 4,             // stelle 1-5
  exercises: [...]       // snapshot esercizi con set completati
}
```

## Logica di Business

### Calcolo Tonnellaggio

Solo le serie con `completed: true` contribuiscono al volume:

```js
volume += set.weight * set.reps  // per ogni set con completed=true
```

Il tonnellaggio appare:
- In tempo reale nell'header durante la sessione attiva
- Nel modal di fine allenamento (riepilogo)
- Nei grafici storici (bar chart settimanale/mensile)

### Timer Recupero

- Durata default: estratta dal campo `rest` dell'esercizio (es. "90s" → 90 secondi)
- Comportamento: countdown, beep + vibrazione a zero, auto-close modale
- Pulsante `+10s`: aggiunge 10 secondi al tempo residuo
- Implementazione: `setInterval` con `useRef` per il timer ID

### Progressione

Il grafico di progressione mostra l'evoluzione del **peso massimo** usato
per un esercizio specifico nel tempo (lettura da `workout_history`).

### Dati Profilo Utente

```js
{
  displayName: string,  // nome visualizzato
  age: number,          // anni
  weight: number,       // peso corporeo in kg
  gender: 'male' | 'female' | 'other'
}
```

## Giorni di Allenamento Predefiniti

| ID      | Nome                        | Muscoli target              |
|---------|-----------------------------|-----------------------------|
| `day_1` | Giorno 1: Petto e Tricipiti | Pettorali, tricipiti        |
| `day_2` | Giorno 2: Gambe e Spalle    | Quadricipiti, femorali, deltoidi |
| `day_3` | Giorno 3: Schiena e Bicipiti | Dorsali, bicipiti, trapezio |

## GIF Esercizi

Ogni esercizio ha una GIF animata che mostra l'esecuzione corretta.

| Gruppo Muscolare | Esercizi (e GIF) |
|-----------------|------------------|
| Petto | panca-piana, panca-inclinata, multypower-chest, croci-cavi, chest-press, pullover |
| Gambe | leg-press, calf-press, leg-extension, leg-curl, stepper |
| Spalle | shoulder-press, lateral-raises, front-raises, rear-delt |
| Schiena | lat-machine, cable-row, t-bar-row, hyperextension |
| Braccia | bicep-curl, hammer-curl, tricep-pushdown, skull-crusher |
| Core | crunch, mountain-climber |

Path nel codice: `'./images/<nome-esercizio>.gif'`

## Vincoli e Regole di Business

1. **Una sessione attiva alla volta** — non si può avviare un secondo giorno se uno è già in corso.
2. **Set completati irrevocabili** durante la sessione — un set marcato come completato non può essere de-marcato (UX deliberata).
3. **Salvataggio solo alla fine** — i dati vanno su Firestore solo quando l'utente preme "Termina allenamento".
4. **Demo Mode** — in modalità demo i dati non vengono salvati su Firestore (solo state locale).
5. **Tonnellaggio parziale** — se l'utente termina prima di completare tutti i set, viene salvato solo il volume dei set `completed=true`.
