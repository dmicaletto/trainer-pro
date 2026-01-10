import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  onSnapshot
} from "firebase/firestore";
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Play, 
  Clock, 
  BarChart2, 
  ChevronRight, 
  Info,
  Dumbbell,
  Calendar
} from 'lucide-react';

// --- CONFIGURAZIONE FIREBASE ---
const firebaseConfig = JSON.parse(localStorage.getItem('firebase_config') || '{}');
const safeConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfig;
const finalConfig = Object.keys(safeConfig).length > 0 ? safeConfig : {
    apiKey: "AIzaSyCfTXY1foD8Dr9UxRNzLeOu680aNtIw4TA",
    authDomain: "training-c0b76.firebaseapp.com",
    projectId: "training-c0b76",
    storageBucket: "training-c0b76.firebasestorage.app",
    messagingSenderId: "149618028951",
    appId: "1:149618028951:web:03756bdf1273a4521954d2"
};

const app = initializeApp(finalConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DATI INIZIALI (Struttura Aggiornata per Serie Multiple) ---
// Ora ogni esercizio ha un array 'sets' esplicito per gestire peso/reps diversi
const INITIAL_WORKOUT_DAYS = {
	'day_1': {
		name: "Giorno 1: Petto e Tricipiti",
		exercises: [
			{ 
                id: 'd1_e1', 
                name: "Panca Piana - Bilanciere", 
                sets: [
                    { reps: 12, weight: 40 },
                    { reps: 10, weight: 45 },
                    { reps: 10, weight: 50 },
                    { reps: 8, weight: 55 }
                ],
                rest: "90s", 
                imageUrl: 'https://i.imgur.com/3Y8kE9A.gif', 
                notes: "Mantieni le spalle basse e concentratevi solo sulla contrazione del petto." 
            },
			{ 
                id: 'd1_e2', 
                name: "Panca 30° Multypower", 
                sets: [
                    { reps: 10, weight: 40 },
                    { reps: 10, weight: 40 },
                    { reps: 10, weight: 40 }
                ], 
                rest: "90s", 
                imageUrl: '', 
                notes: "Movimento controllato, senti l'allungamento." 
            },
            // ... Altri esercizi con la stessa struttura ...
            { id: 'd1_e3', name: "Croci al Cavo alto", sets: Array(3).fill({reps: 10, weight: 10}), rest: "60s", imageUrl: '', notes: "Contrazione di picco." },
            { id: 'd1_e4', name: "Chest Press", sets: Array(3).fill({reps: 10, weight: 25}), rest: "90s", imageUrl: '', notes: "Spingi i gomiti in avanti." },
		]
	},
	'day_2': {
		name: "Giorno 2: Gambe e Spalle",
		exercises: [
			{ id: 'd2_e1', name: "Calf Raises", sets: Array(4).fill({reps: 10, weight: 40}), rest: "90s", imageUrl: '', notes: "" },
            { id: 'd2_e2', name: "Leg Press", sets: Array(4).fill({reps: 10, weight: 70}), rest: "90s", imageUrl: '', notes: "Non bloccare le ginocchia." },
		]
	},
    'day_3': {
		name: "Giorno 3: Schiena e Bicipiti",
		exercises: [
			{ id: 'd3_e1', name: "Rematore Manubri", sets: Array(4).fill({reps: 8, weight: 18}), rest: "90s", imageUrl: '', notes: "Schiena dritta." },
		]
	},
    'day_4': {
		name: "Giorno 4: Petto e Spalle (Richiamo)",
		exercises: [
			{ id: 'd4_e1', name: "Panca Piana Manubri", sets: Array(3).fill({reps: 10, weight: 16}), rest: "90s", imageUrl: '', notes: "" },
		]
	}
};

// Helper per immagini
const getImageUrl = (url, name) => {
    if (url) return url;
    return `https://placehold.co/400x200/2563eb/ffffff/png?text=${encodeURIComponent(name.toUpperCase())}`;
};

export default function App() {
  // --- STATO ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDayId, setActiveDayId] = useState('day_1');
  const [workoutData, setWorkoutData] = useState(INITIAL_WORKOUT_DAYS);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setView] = useState('dashboard');
  
  // Auth Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- EFFETTI ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
          // TODO: Caricare lo storico e i dati salvati da Firestore
      }
    });
    return () => unsubscribe();
  }, []);

  // --- HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError('Errore login: Email o password errati.');
    }
  };

  const handleRegister = async () => {
      if (!confirm("Creare un nuovo account?")) return;
      try {
          await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
          setAuthError(err.message);
      }
  };

  const handleLogout = async () => {
    if (confirm("Vuoi davvero uscire?")) {
        await signOut(auth);
        setIsMenuOpen(false);
    }
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-sm bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
            <h2 className="text-3xl font-bold mb-2 text-center text-blue-400">Gym App</h2>
            <p className="text-gray-400 text-center mb-8 text-sm">Accedi per i tuoi allenamenti.</p>
            <form onSubmit={handleLogin}>
                <div className="mb-4">
                    <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="tua@email.com" required />
                </div>
                <div className="mb-6">
                    <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none" placeholder="••••••••" required />
                </div>
                {authError && <p className="text-red-500 text-xs mb-4 text-center">{authError}</p>}
                <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition mb-3">Accedi</button>
                <button type="button" onClick={handleRegister} className="w-full py-3 bg-transparent border border-gray-500 text-gray-300 hover:text-white hover:border-white font-semibold rounded-lg transition">Crea Account</button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans pb-24 relative overflow-hidden">
      
      {/* HEADER */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-20 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-extrabold text-blue-500 tracking-tight flex items-center gap-2">
                <Dumbbell className="w-6 h-6" />
                Gym App
            </h1>
            <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white transition">
                <Menu className="w-6 h-6" />
            </button>
        </div>
      </header>

      {/* MENU LATERALE */}
      {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
              <div className="relative w-64 bg-gray-800 h-full shadow-2xl p-6 border-l border-gray-700 flex flex-col transform transition-transform animate-in slide-in-from-right">
                <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                    <h3 className="text-xl font-bold text-blue-400">Menu</h3>
                    <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-2">
                    <button onClick={() => { setView('profile'); setIsMenuOpen(false); }} className="w-full flex items-center p-3 rounded-lg hover:bg-gray-700 transition text-left"><User className="w-5 h-5 mr-3 text-pink-400" />Profilo</button>
                    <button onClick={() => { setView('history'); setIsMenuOpen(false); }} className="w-full flex items-center p-3 rounded-lg hover:bg-gray-700 transition text-left"><BarChart2 className="w-5 h-5 mr-3 text-yellow-400" />Storico</button>
                </div>
                <button onClick={handleLogout} className="mt-auto flex items-center p-3 rounded-lg border border-red-900/50 text-red-400 hover:bg-red-900/20 transition"><LogOut className="w-5 h-5 mr-3" />Esci</button>
              </div>
          </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto p-4">
        
        {view === 'dashboard' && (
            <>
                {/* TABS GIORNI */}
                <div className="flex overflow-x-auto no-scrollbar space-x-2 mb-6 p-1">
                    {Object.keys(workoutData).map((dayId) => (
                        <button
                            key={dayId}
                            onClick={() => setActiveDayId(dayId)}
                            className={`flex-none py-2 px-4 text-sm font-bold rounded-full transition-all whitespace-nowrap border-2 ${
                                activeDayId === dayId 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg scale-105' 
                                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
                            }`}
                        >
                            {workoutData[dayId].name.split(':')[0]}
                        </button>
                    ))}
                </div>

                {/* TITOLO GIORNO */}
                <div className="mb-4 px-1">
                    <h2 className="text-2xl font-bold text-white leading-tight">{workoutData[activeDayId].name}</h2>
                    <p className="text-gray-400 text-sm mt-1 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {workoutData[activeDayId].exercises.length} Esercizi previsti
                    </p>
                </div>

                {/* SCORRIMENTO ORIZZONTALE ESERCIZI (SNAP SCROLL) */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-8 no-scrollbar -mx-4 px-4">
                    {workoutData[activeDayId].exercises.map((exercise, index) => (
                        <div key={exercise.id} className="snap-center shrink-0 w-[85vw] sm:w-[350px] bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-xl flex flex-col">
                            
                            {/* Header Card con Immagine */}
                            <div className="relative h-48 bg-gray-900">
                                <img 
                                    src={getImageUrl(exercise.imageUrl, exercise.name)} 
                                    alt={exercise.name}
                                    className="w-full h-full object-cover opacity-80"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                                <div className="absolute bottom-3 left-4 right-4">
                                    <h3 className="text-xl font-bold text-white leading-tight shadow-black drop-shadow-md">{exercise.name}</h3>
                                </div>
                                <div className="absolute top-3 right-3 bg-blue-600/90 px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-sm">
                                    #{index + 1}
                                </div>
                            </div>

                            {/* Body Card - Tabella Serie */}
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-center mb-4 text-sm text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4 text-yellow-500" />
                                        <span>Recupero: <strong className="text-white">{exercise.rest}</strong></span>
                                    </div>
                                    <div>{exercise.sets.length} Serie</div>
                                </div>

                                {/* Lista Serie Compatta */}
                                <div className="bg-gray-900/50 rounded-lg p-3 space-y-2 mb-4 border border-gray-700/50">
                                    <div className="grid grid-cols-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center mb-1">
                                        <div>Serie</div>
                                        <div>Reps</div>
                                        <div>Kg</div>
                                    </div>
                                    {exercise.sets.map((set, idx) => (
                                        <div key={idx} className="grid grid-cols-3 text-sm items-center text-center py-1 border-b border-gray-800 last:border-0">
                                            <div className="text-blue-400 font-bold">{idx + 1}</div>
                                            <div className="text-white">{set.reps}</div>
                                            <div className="text-gray-300">{set.weight > 0 ? set.weight : '-'}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Note */}
                                {exercise.notes && (
                                    <div className="mt-auto pt-3 border-t border-gray-700">
                                        <div className="flex items-start gap-2">
                                            <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-gray-400 italic leading-relaxed">{exercise.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {/* Spacer finale per facilitare lo scroll dell'ultimo elemento */}
                    <div className="shrink-0 w-4"></div>
                </div>

                {/* BOTTONE START (Fisso in basso su mobile o in fondo su desktop) */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 via-gray-900 to-transparent z-10 sm:static sm:bg-none sm:p-0 sm:mt-8 text-center">
                    <button 
                        onClick={() => alert("Modalità Allenamento in arrivo nel prossimo step!")}
                        className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transform active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto text-lg"
                    >
                        <Play className="w-6 h-6 fill-current" />
                        INIZIA ALLENAMENTO
                    </button>
                </div>
            </>
        )}

        {view === 'profile' && (
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Profilo Utente</h2>
                <p className="text-gray-400">Funzionalità in arrivo...</p>
                <button onClick={() => setView('dashboard')} className="mt-6 px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white">Torna Indietro</button>
            </div>
        )}

      </main>
    </div>
  );
}
