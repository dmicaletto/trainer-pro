# Changelog

Tutti i cambiamenti significativi apportati al progetto Trainer Pro saranno documentati in questo file.

## [1.2.9] - 2026-01-28

### Aggiunto
- Tasto **+10s** nella modale del timer di riposo per estendere rapidamente il recupero.
- Segnale acustico (beep elettronico) al termine del timer di riposo.
- Supporto alla vibrazione del dispositivo al termine del timer.
- File `.gitignore` per escludere file non necessari dal repository.
- File `package-lock.json` per garantire versioni consistenti delle dipendenze.

### Modificato
- La modale del timer di riposo ora si chiude automaticamente quando il tempo scade.
- Layout della modale del timer reso più compatto per evitare lo scroll.

### Fix
- Corretto bug per cui la modale del timer rimaneva aperta infinitamente dopo lo scadere del tempo.

## [1.2.8] - Antecedente al 2026-01-28

### Iniziale
- Configurazione iniziale del progetto con React e Vite.
- Integrazione con Firebase (Auth e Firestore).
- Implementazione della Dashboard, Storico e Profilo utente.
- Grafici di progressione con Chart.js.
