import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { 
  getFirestore
} from "firebase/firestore";
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Play, 
  Clock, 
  BarChart2, 
  Info,
  Dumbbell,
  Calendar,
  ChevronRight
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

// --- DATI INIZIALI ---
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
            { id: 'd1_e3', name: "Croci al Cavo alto", sets: Array(3).fill({reps: 10, weight: 10}), rest: "60s", imageUrl: '', notes: "Contrazione di picco." },
            { id: 'd1_e4', name: "Chest Press", sets: Array(3).fill({reps: 10, weight: 25}), rest: "90s", imageUrl: '', notes: "Spingi i gomiti in avanti." },
            { id: 'd1_e5', name: "Pull Over", sets: Array(3).fill({reps: 12, weight: 20}), rest: "90s", imageUrl: '', notes: "" },
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

const getImageUrl = (url, name) => {
    if (url) return url;
    return `https://placehold.co/600x400/1f2937/ffffff/png?text=${encodeURIComponent(name.toUpperCase())}`;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeDayId, setActiveDayId] = useState('day_1');
  const [workoutData, setWorkoutData] = useState(INITIAL_WORKOUT_DAYS);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [view, setView] = useState('dashboard');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- AUTH EFFETTI ---
  useEffect(() => {
    let unsubscribe = () => {};
    const initAuth = async () => {
        try {
            unsubscribe = onAuthStateChanged(auth, (currentUser) => {
                setUser(currentUser);
                setLoading(false);
            }, (error) => {
                console.warn("Auth error, switching to mock:", error);
                activateMockMode();
            });
        } catch (err) {
            activateMockMode();
        }
    };

    const activateMockMode = () => {
        setUser({ uid: "mock-user", email: "preview@gym.app" });
        setLoading(false);
    };

    const isCanvasPreview = window.location.hostname.includes('googleusercontent.com') || window.self !== window.top;
    
    if (isCanvasPreview) {
        const timer = setTimeout(() => { if (loading) activateMockMode(); }, 1500); 
        initAuth();
        return () => { clearTimeout(timer); unsubscribe(); };
    } else {
        initAuth();
        return () => unsubscribe();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if(err.code === 'auth/network-request-failed' || err.message.includes('iframe')) {
          alert("Anteprima: Login simulato con successo.");
          setUser({ uid: "test-user", email: email || "test@test.com" });
      } else {
          setAuthError('Errore login: Email o password errati.');
      }
    }
  };

  const handleRegister = async () => { /* ... stesso codice ... */ };
  const handleLogout = async () => {
    if (confirm("Vuoi davvero uscire?")) {
        await signOut(auth);
        setUser(null);
        setIsMenuOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    // Schermata Login (semplificata)
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-sm bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
            <div className="text-center mb-8">
                <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-900/50">
                    <Dumbbell className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold">Gym App</h2>
                <p className="text-gray-500 mt-2">Bentornato, atleta.</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="tua@email.com" required />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="••••••••" required />
                </div>
                {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all">Accedi</button>
                <button type="button" onClick={() => setUser({uid:'demo', email:'demo@gym.app'})} className="w-full py-2 text-sm text-gray-500 hover:text-white transition-colors">Salta Login (Demo)</button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      
      {/* HEADER FISSO */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600/20 p-2 rounded-lg">
                    <Dumbbell className="w-5 h-5 text-blue-500" />
                </div>
                <h1 className="text-lg font-bold tracking-tight">Gym App</h1>
            </div>
            <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
                <Menu className="w-6 h-6" />
            </button>
        </div>
      </header>

      {/* DRAWER MENU LATERALE */}
      {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsMenuOpen(false)}
              ></div>
              
              {/* Drawer Content */}
              <div className="relative w-72 bg-gray-900 h-full shadow-2xl border-l border-gray-800 flex flex-col p-6 transform transition-transform animate-in slide-in-from-right duration-200">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-white">Menu</h3>
                    <button onClick={() => setIsMenuOpen(false)} className="p-1 text-gray-400 hover:text-white bg-gray-800 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="space-y-1">
                    <button onClick={() => { setView('dashboard'); setIsMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-colors ${view === 'dashboard' ? 'bg-blue-600/10 text-blue-500' : 'hover:bg-gray-800 text-gray-300'}`}>
                        <Calendar className="w-5 h-5 mr-3" />
                        Programma
                    </button>
                    <button onClick={() => { setView('profile'); setIsMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-colors ${view === 'profile' ? 'bg-blue-600/10 text-blue-500' : 'hover:bg-gray-800 text-gray-300'}`}>
                        <User className="w-5 h-5 mr-3" />
                        Profilo
                    </button>
                    <button onClick={() => { setView('history'); setIsMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-colors ${view === 'history' ? 'bg-blue-600/10 text-blue-500' : 'hover:bg-gray-800 text-gray-300'}`}>
                        <BarChart2 className="w-5 h-5 mr-3" />
                        Storico
                    </button>
                </div>

                <div className="mt-auto border-t border-gray-800 pt-4">
                    <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-5 h-5 mr-3" />
                        Esci
                    </button>
                </div>
              </div>
          </div>
      )}

      {/* CONTENUTO PRINCIPALE (con padding top per l'header fisso) */}
      <main className="max-w-4xl mx-auto pt-20 pb-24 px-4 min-h-screen">
        
        {view === 'dashboard' && (
            <div className="animate-in fade-in duration-300">
                {/* TABS GIORNI (Stile pillole) */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2">
                    {Object.keys(workoutData).map((dayId) => (
                        <button
                            key={dayId}
                            onClick={() => setActiveDayId(dayId)}
                            className={`flex-none px-5 py-2.5 text-sm font-bold rounded-full transition-all whitespace-nowrap border ${
                                activeDayId === dayId 
                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' 
                                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                            }`}
                        >
                            {workoutData[dayId].name.split(':')[0]}
                        </button>
                    ))}
                </div>

                {/* TITOLO GIORNO */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-white">{workoutData[activeDayId].name.split(':')[1] || workoutData[activeDayId].name}</h2>
                    <p className="text-gray-400 text-sm mt-1">
                        {workoutData[activeDayId].exercises.length} Esercizi • Durata est. 60 min
                    </p>
                </div>

                {/* CAROSELLO ESERCIZI (A larghezza quasi totale) */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar -mx-4 px-4">
                    {workoutData[activeDayId].exercises.map((exercise, index) => (
                        <div key={exercise.id} className="snap-center shrink-0 w-[92vw] sm:w-[400px] bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-xl flex flex-col relative">
                            
                            {/* Immagine Esercizio */}
                            <div className="relative h-48 w-full bg-gray-800">
                                <img 
                                    src={getImageUrl(exercise.imageUrl, exercise.name)} 
                                    alt={exercise.name}
                                    className="w-full h-full object-cover opacity-70"
                                />
                                {/* Gradiente per testo leggibile */}
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
                                
                                <div className="absolute bottom-4 left-5 right-5">
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-xl font-bold text-white leading-tight shadow-black drop-shadow-md max-w-[80%]">{exercise.name}</h3>
                                        <div className="bg-gray-800/80 backdrop-blur px-3 py-1 rounded-lg text-xs font-mono text-blue-400 border border-gray-700">
                                            {index + 1}/{workoutData[activeDayId].exercises.length}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dettagli Esercizio */}
                            <div className="p-5 flex-1 flex flex-col gap-4">
                                
                                {/* Info Rapide */}
                                <div className="flex items-center justify-between text-sm bg-gray-950/50 p-3 rounded-xl border border-gray-800">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span>Recupero: <span className="text-white font-semibold">{exercise.rest}</span></span>
                                    </div>
                                    <div className="text-gray-400">
                                        Totale: <span className="text-white font-semibold">{exercise.sets.length} Serie</span>
                                    </div>
                                </div>

                                {/* Tabella Serie (Sola lettura per anteprima) */}
                                <div className="space-y-1">
                                    <div className="grid grid-cols-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center px-2 mb-1">
                                        <div>#</div>
                                        <div className="col-span-1">Kg</div>
                                        <div className="col-span-1">Reps</div>
                                        <div>Stato</div>
                                    </div>
                                    {exercise.sets.map((set, idx) => (
                                        <div key={idx} className="grid grid-cols-4 items-center text-center py-2 bg-gray-800/30 rounded-lg border border-gray-800/50">
                                            <div className="text-xs text-gray-500 font-bold">{idx + 1}</div>
                                            <div className="text-sm font-mono text-white">{set.weight || '-'}</div>
                                            <div className="text-sm font-mono text-white">{set.reps}</div>
                                            <div className="flex justify-center">
                                                <div className="w-4 h-4 rounded-full border-2 border-gray-700"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Note */}
                                {exercise.notes && (
                                    <div className="mt-auto pt-3 border-t border-gray-800 flex gap-3">
                                        <Info className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                        <p className="text-xs text-gray-400 italic leading-relaxed">{exercise.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    <div className="shrink-0 w-2"></div>
                </div>

                {/* FAB (Floating Action Button) per Start */}
                <div className="fixed bottom-6 right-6 z-30">
                    <button 
                        onClick={() => alert("La prossima versione abiliterà la modifica dei dati durante l'allenamento!")}
                        className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center transform active:scale-95 transition-all"
                    >
                        <Play className="w-7 h-7 fill-current ml-1" />
                    </button>
                </div>
            </div>
        )}

        {view === 'profile' && (
            <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center py-12">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 border-4 border-gray-800 shadow-xl">
                    <User className="w-10 h-10 text-gray-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-1">{user.displayName || "Atleta"}</h2>
                <p className="text-gray-500 mb-8">{user.email}</p>
                
                <div className="w-full max-w-sm space-y-3">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                        <span className="text-gray-400">Allenamenti completati</span>
                        <span className="text-xl font-bold text-white">0</span>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                        <span className="text-gray-400">Tonnellaggio totale</span>
                        <span className="text-xl font-bold text-blue-500">0 Kg</span>
                    </div>
                </div>
            </div>
        )}

      </main>
    </div>
  );
}
