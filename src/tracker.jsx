import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  signInAnonymously
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs 
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
  CheckCircle2,
  Circle,
  Save,
  Timer,
  SkipForward,
  RotateCcw,
  CheckSquare
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
const APP_ID = finalConfig.projectId || 'default-app';

// --- DATI INIZIALI ---
const INITIAL_WORKOUT_DAYS = {
	'day_1': {
		name: "Giorno 1: Petto e Tricipiti",
		exercises: [
			{ 
                id: 'd1_e1', 
                name: "Panca Piana - Bilanciere", 
                sets: [
                    { reps: 12, weight: 40, completed: false },
                    { reps: 10, weight: 45, completed: false },
                    { reps: 10, weight: 50, completed: false },
                    { reps: 8, weight: 55, completed: false }
                ],
                rest: "90s", 
                imageUrl: 'https://i.imgur.com/3Y8kE9A.gif', 
                notes: "Mantieni le spalle basse e concentratevi solo sulla contrazione del petto." 
            },
			{ 
                id: 'd1_e2', 
                name: "Panca 30° Multypower", 
                sets: [
                    { reps: 10, weight: 40, completed: false },
                    { reps: 10, weight: 40, completed: false },
                    { reps: 10, weight: 40, completed: false }
                ], 
                rest: "90s", 
                imageUrl: '', 
                notes: "Movimento controllato, senti l'allungamento." 
            },
            { id: 'd1_e3', name: "Croci al Cavo alto", sets: Array(3).fill({reps: 10, weight: 10, completed: false}), rest: "60s", imageUrl: '', notes: "Contrazione di picco." },
            { id: 'd1_e4', name: "Chest Press", sets: Array(3).fill({reps: 10, weight: 25, completed: false}), rest: "90s", imageUrl: '', notes: "Spingi i gomiti in avanti." },
            { id: 'd1_e5', name: "Pull Over", sets: Array(3).fill({reps: 12, weight: 20, completed: false}), rest: "90s", imageUrl: '', notes: "" },
		]
	},
	'day_2': {
		name: "Giorno 2: Gambe e Spalle",
		exercises: [
			{ id: 'd2_e1', name: "Calf Raises", sets: Array(4).fill({reps: 10, weight: 40, completed: false}), rest: "90s", imageUrl: '', notes: "" },
            { id: 'd2_e2', name: "Leg Press", sets: Array(4).fill({reps: 10, weight: 70, completed: false}), rest: "90s", imageUrl: '', notes: "Non bloccare le ginocchia." },
		]
	},
    'day_3': {
		name: "Giorno 3: Schiena e Bicipiti",
		exercises: [
			{ id: 'd3_e1', name: "Rematore Manubri", sets: Array(4).fill({reps: 8, weight: 18, completed: false}), rest: "90s", imageUrl: '', notes: "Schiena dritta." },
		]
	},
    'day_4': {
		name: "Giorno 4: Petto e Spalle (Richiamo)",
		exercises: [
			{ id: 'd4_e1', name: "Panca Piana Manubri", sets: Array(3).fill({reps: 10, weight: 16, completed: false}), rest: "90s", imageUrl: '', notes: "" },
		]
	}
};

const getImageUrl = (url, name) => {
    if (url) return url;
    return `https://placehold.co/600x400/1f2937/ffffff/png?text=${encodeURIComponent(name.toUpperCase())}`;
};

const parseRestTime = (restString) => {
    const match = String(restString).match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 60;
};

const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function App() {
  // --- STATO ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Navigazione
  const [activeDayId, setActiveDayId] = useState('day_1');
  const [view, setView] = useState('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Allenamento
  const [workoutData, setWorkoutData] = useState(INITIAL_WORKOUT_DAYS);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [startTime, setStartTime] = useState(null);
  
  // Timer Modale
  const [restTimer, setRestTimer] = useState({ isOpen: false, timeLeft: 0, totalTime: 0 });

  // Storico
  const [historyLogs, setHistoryLogs] = useState([]);

  // Auth Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- HELPER FUNCTIONS ---
  const calculateTotalVolume = (session) => {
      if (!session) return 0;
      let total = 0;
      session.exercises.forEach(ex => {
          ex.sets.forEach(set => {
              if (set.completed || (set.weight > 0 && set.reps > 0)) {
                  total += (set.weight || 0) * (set.reps || 0);
              }
          });
      });
      return total;
  };

  const openRestTimer = (seconds) => {
      setRestTimer({ isOpen: true, timeLeft: seconds, totalTime: seconds });
  };

  const closeRestTimer = () => {
      setRestTimer({ isOpen: false, timeLeft: 0, totalTime: 0 });
  };

  const updateSessionSet = (exerciseIndex, setIndex, field, value) => {
      setActiveSession(prev => {
          const newSession = { ...prev };
          const exercise = newSession.exercises[exerciseIndex];
          const set = exercise.sets[setIndex];
          
          if(field === 'completed') {
              const wasCompleted = set.completed;
              set.completed = value;
              
              // APRE IL TIMER SOLO SE:
              // 1. Stiamo segnando come completato (non togliendo la spunta)
              // 2. NON è l'ultima serie dell'esercizio
              if (value === true && !wasCompleted) {
                  const isLastSet = setIndex === exercise.sets.length - 1;
                  if (!isLastSet) {
                      const seconds = parseRestTime(exercise.rest);
                      openRestTimer(seconds);
                  }
              }
          } else {
              set[field] = Number(value);
          }
          
          return newSession;
      });
  };

  // --- HANDLERS (Definiti prima dell'uso) ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if(err.code === 'auth/network-request-failed' || err.message.includes('iframe')) {
          alert("Login bloccato in anteprima. Attivo modalità test.");
          setUser({ uid: "test-user", email: email || "test@test.com", displayName: "Test User" });
      } else {
          setAuthError('Errore login: Email o password errati.');
      }
    }
  };

  const handleLogout = async () => {
    if (confirm("Vuoi davvero uscire?")) {
        await signOut(auth);
        setUser(null);
        setIsMenuOpen(false);
    }
  };

  const handleStartWorkout = () => {
      const dayData = workoutData[activeDayId];
      const sessionData = JSON.parse(JSON.stringify(dayData));
      setActiveSession(sessionData);
      setStartTime(new Date());
      setView('active-workout');
  };

  const handleFinishWorkout = async () => {
      if(!confirm("Terminare l'allenamento e salvare?")) return;
      
      const totalTonnage = calculateTotalVolume(activeSession);
      const endTime = new Date();
      const durationSeconds = sessionTimer;
      
      // Costruzione Log Compatibile
      const workoutLog = {
          date: startTime.toISOString().split('T')[0],
          dayName: activeSession.name,
          durationDisplay: formatDuration(durationSeconds),
          durationSeconds: durationSeconds,
          startTime: startTime.toLocaleTimeString('it-IT'),
          endTime: endTime.toLocaleTimeString('it-IT'),
          estimatedCalories: Math.round(totalTonnage * 0.05 + durationSeconds / 60 * 4),
          rating: 3, // Default rating for now
          totalTonnage: totalTonnage
      };

      if (user.uid !== 'mock-user' && user.uid !== 'test-user') {
          try {
              await addDoc(collection(db, `artifacts/${APP_ID}/users/${user.uid}/workout_history`), workoutLog);
              alert("Salvato con successo!");
          } catch (e) {
              console.error("Save error:", e);
              alert("Errore salvataggio (controlla console)");
          }
      } else {
          alert(`(Mock) Allenamento salvato! Volume: ${totalTonnage}kg`);
      }
      
      setActiveSession(null);
      setStartTime(null);
      setView('dashboard');
  };

  const handleCancelWorkout = () => {
      if(!confirm("Annullare l'allenamento?")) return;
      setActiveSession(null);
      setView('dashboard');
  };

  // --- EFFETTI ---
  useEffect(() => {
    let unsubscribe = () => {};
    const activateMockMode = () => { 
        setUser({ uid: "mock-user", email: "preview@gym.app", displayName: "Preview User" }); 
        setLoading(false); 
    };
    
    const isCanvasPreview = window.location.hostname.includes('googleusercontent.com') || window.self !== window.top;
    if (isCanvasPreview) {
        const timer = setTimeout(() => { if (loading) activateMockMode(); }, 2000); 
        const initAuth = async () => {
            try {
                unsubscribe = onAuthStateChanged(auth, (u) => { 
                    setUser(u); 
                    setLoading(false); 
                }, () => activateMockMode());
            } catch { activateMockMode(); }
        };
        initAuth();
        return () => { clearTimeout(timer); unsubscribe(); };
    } else {
        unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
        return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
      let interval;
      if (view === 'active-workout') {
          interval = setInterval(() => setSessionTimer(t => t + 1), 1000);
      } else {
          setSessionTimer(0);
      }
      return () => clearInterval(interval);
  }, [view]);

  useEffect(() => {
      let interval;
      if (restTimer.isOpen && restTimer.timeLeft > 0) {
          interval = setInterval(() => {
              setRestTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
          }, 1000);
      } else if (restTimer.isOpen && restTimer.timeLeft <= 0) {
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      }
      return () => clearInterval(interval);
  }, [restTimer.isOpen, restTimer.timeLeft]);

  useEffect(() => {
      if (view === 'history' && user && !['mock-user', 'test-user'].includes(user.uid)) {
          const fetchHistory = async () => {
              try {
                  const q = query(
                      collection(db, `artifacts/${APP_ID}/users/${user.uid}/workout_history`),
                      orderBy("date", "desc"),
                      orderBy("startTime", "desc"),
                      limit(20)
                  );
                  const querySnapshot = await getDocs(q);
                  const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  setHistoryLogs(logs);
              } catch (e) {
                  console.error("Errore storico:", e);
              }
          };
          fetchHistory();
      } else if (view === 'history') {
           setHistoryLogs([
               { id: '1', dayName: 'Giorno 1: Petto', date: '2025-11-18', durationDisplay: '00:45:00', totalTonnage: 4500, rating: 4 },
               { id: '2', dayName: 'Giorno 3: Schiena', date: '2025-11-15', durationDisplay: '00:50:00', totalTonnage: 5200, rating: 5 }
           ]);
      }
  }, [view, user]);

  // --- RENDER ---
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-sm bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-center text-blue-500">Gym App</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:border-blue-500 focus:outline-none" placeholder="tua@email.com" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-white focus:border-blue-500 focus:outline-none" placeholder="••••••••" />
                </div>
                {authError && <p className="text-red-500 text-xs text-center">{authError}</p>}
                <button type="submit" className="w-full py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors">Accedi</button>
                <div className="text-center pt-2">
                    <button type="button" onClick={() => setUser({uid:'mock', email:'demo'})} className="text-sm text-gray-500 hover:text-white underline">Modalità Demo</button>
                </div>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      
      {/* HEADER FISSO */}
      <header className={`fixed top-0 left-0 right-0 z-30 backdrop-blur-md border-b border-gray-800/50 transition-colors ${view === 'active-workout' ? 'bg-blue-950/80 border-blue-900/50' : 'bg-gray-950/80'}`}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
            {view === 'active-workout' ? (
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center text-blue-400 font-mono text-xl font-bold animate-pulse">
                        <Timer className="w-5 h-5 mr-2" />
                        {formatDuration(sessionTimer)}
                    </div>
                    <button onClick={handleCancelWorkout} className="text-xs text-red-400 font-semibold border border-red-900/50 px-3 py-1 rounded-full hover:bg-red-900/10">
                        ANNULLA
                    </button>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600/20 p-2 rounded-lg">
                            <Dumbbell className="w-5 h-5 text-blue-500" />
                        </div>
                        <h1 className="text-lg font-bold tracking-tight">Gym App</h1>
                    </div>
                    <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                </>
            )}
        </div>
      </header>

      {/* DRAWER MENU */}
      {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
              <div className="relative w-72 bg-gray-900 h-full shadow-2xl border-l border-gray-800 flex flex-col p-6 slide-in-from-right animate-in duration-200">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-white">Menu</h3>
                    <button onClick={() => setIsMenuOpen(false)} className="p-1 text-gray-400 hover:text-white bg-gray-800 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-1">
                    <button onClick={() => { setView('dashboard'); setIsMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl hover:bg-gray-800 text-gray-300 ${view === 'dashboard' ? 'bg-gray-800 text-white' : ''}`}><Calendar className="w-5 h-5 mr-3" />Programma</button>
                    <button onClick={() => { setView('history'); setIsMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl hover:bg-gray-800 text-gray-300 ${view === 'history' ? 'bg-gray-800 text-white' : ''}`}><BarChart2 className="w-5 h-5 mr-3" />Storico</button>
                    <button onClick={() => { setView('profile'); setIsMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl hover:bg-gray-800 text-gray-300 ${view === 'profile' ? 'bg-gray-800 text-white' : ''}`}><User className="w-5 h-5 mr-3" />Profilo</button>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-800">
                    <button onClick={handleLogout} className="w-full flex items-center p-3 rounded-xl text-red-400 hover:bg-red-500/10"><LogOut className="w-5 h-5 mr-3" />Esci</button>
                </div>
              </div>
          </div>
      )}

      {/* MODALE TIMER RIPOSO */}
      {restTimer.isOpen && (
          <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="text-gray-400 mb-6 uppercase tracking-widest text-sm font-bold">Recupero</div>
              
              <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                  <svg className="absolute w-full h-full transform -rotate-90">
                      <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                      <circle 
                        cx="128" cy="128" r="120" 
                        stroke="currentColor" strokeWidth="8" fill="transparent" 
                        className="text-blue-600 transition-all duration-1000 ease-linear"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - restTimer.timeLeft / restTimer.totalTime)}
                      />
                  </svg>
                  <div className="text-8xl font-mono font-bold text-white tracking-tighter">{restTimer.timeLeft}</div>
              </div>

              <div className="w-full max-w-xs space-y-4">
                  <button 
                    onClick={closeRestTimer} 
                    className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                      <SkipForward className="w-6 h-6" />
                      SALTA
                  </button>
                  <button 
                    onClick={() => setRestTimer(p => ({...p, timeLeft: p.timeLeft + 30, totalTime: p.totalTime + 30}))}
                    className="w-full py-3 text-gray-500 hover:text-white text-sm font-semibold flex items-center justify-center gap-2"
                  >
                      <RotateCcw className="w-4 h-4" />
                      +30s
                  </button>
              </div>
          </div>
      )}

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto pt-20 pb-32 px-4 min-h-screen">
        
        {/* DASHBOARD & ACTIVE WORKOUT */}
        {(view === 'dashboard' || view === 'active-workout') && (
            <div className="animate-in fade-in duration-300">
                
                {/* TABS GIORNI */}
                {view === 'dashboard' && (
                    <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2">
                        {Object.keys(workoutData).map((dayId) => (
                            <button
                                key={dayId}
                                onClick={() => setActiveDayId(dayId)}
                                className={`flex-none px-5 py-2.5 text-sm font-bold rounded-full transition-all border ${activeDayId === dayId ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
                            >
                                {workoutData[dayId].name.split(':')[0]}
                            </button>
                        ))}
                    </div>
                )}

                {/* TITOLO */}
                <div className="mb-6">
                    <div className="flex justify-between items-end">
                        <h2 className="text-2xl font-bold text-white leading-none">
                            {view === 'active-workout' ? activeSession.name : (workoutData[activeDayId].name.split(':')[1] || workoutData[activeDayId].name)}
                        </h2>
                        {view === 'active-workout' && (
                            <div className="text-right">
                                <div className="text-xl font-mono font-bold text-green-400">{calculateTotalVolume(activeSession)} <span className="text-sm text-gray-500">kg</span></div>
                            </div>
                        )}
                    </div>
                    {view === 'dashboard' && <p className="text-gray-400 text-sm mt-2">{workoutData[activeDayId].exercises.length} Esercizi</p>}
                </div>

                {/* LISTA ESERCIZI */}
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar -mx-4 px-4">
                    {(view === 'active-workout' ? activeSession.exercises : workoutData[activeDayId].exercises).map((exercise, exIndex) => (
                        <div key={exercise.id} className="snap-center shrink-0 w-[95vw] sm:w-[400px] bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-xl flex flex-col relative group">
                            
                            {/* Card Header */}
                            <div className="relative h-48 w-full bg-gray-800">
                                <img src={getImageUrl(exercise.imageUrl, exercise.name)} alt={exercise.name} className="w-full h-full object-cover opacity-60" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-blue-950/40 to-transparent"></div>
                                <div className="absolute bottom-4 left-5 right-5 z-10 flex justify-between items-end">
                                    <h3 className="text-xl font-bold text-white leading-tight shadow-black drop-shadow-md max-w-[80%]">{exercise.name}</h3>
                                    <div className="bg-gray-900/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono text-blue-300 border border-white/10">
                                        {exIndex + 1}/{(view === 'active-workout' ? activeSession.exercises : workoutData[activeDayId].exercises).length}
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 flex-1 flex flex-col gap-4">
                                <div className="flex items-center justify-between text-sm bg-gray-950/30 p-3 rounded-xl border border-gray-800/50">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span>Rec: <span className="text-white font-semibold">{exercise.rest}</span></span>
                                    </div>
                                    <div className="text-gray-400">
                                        <span className="text-white font-semibold">{exercise.sets.length}</span> Serie
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className={`grid ${view === 'active-workout' ? 'grid-cols-5' : 'grid-cols-4'} text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center px-2 mb-1`}>
                                        <div>#</div>
                                        <div className="col-span-1">Kg</div>
                                        <div className="col-span-1">Reps</div>
                                        {view === 'active-workout' && <div>Fatto</div>}
                                        <div>Stato</div>
                                    </div>
                                    
                                    {exercise.sets.map((set, setIdx) => (
                                        <div key={setIdx} className={`grid ${view === 'active-workout' ? 'grid-cols-5' : 'grid-cols-4'} items-center text-center py-2 rounded-lg border transition-colors ${set.completed ? 'bg-green-900/10 border-green-900/30' : 'bg-gray-800/30 border-gray-800/50'}`}>
                                            <div className={`text-xs font-bold ${set.completed ? 'text-green-500' : 'text-gray-500'}`}>{setIdx + 1}</div>
                                            <div className="px-1">
                                                {view === 'active-workout' ? (
                                                    <input type="number" value={set.weight} onChange={(e) => updateSessionSet(exIndex, setIdx, 'weight', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded text-center text-white font-mono py-1 focus:border-blue-500 focus:outline-none" />
                                                ) : (<span className="text-sm font-mono text-white">{set.weight || '-'}</span>)}
                                            </div>
                                            <div className="px-1">
                                                {view === 'active-workout' ? (
                                                    <input type="number" value={set.reps} onChange={(e) => updateSessionSet(exIndex, setIdx, 'reps', e.target.value)} className="w-full bg-gray-950 border border-gray-700 rounded text-center text-white font-mono py-1 focus:border-blue-500 focus:outline-none" />
                                                ) : (<span className="text-sm font-mono text-white">{set.reps}</span>)}
                                            </div>
                                            {view === 'active-workout' && (
                                                <div className="flex justify-center">
                                                    <button onClick={() => updateSessionSet(exIndex, setIdx, 'completed', !set.completed)}>
                                                        {set.completed ? <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-900/20" /> : <Circle className="w-6 h-6 text-gray-600 hover:text-gray-400" />}
                                                    </button>
                                                </div>
                                            )}
                                            <div className="flex justify-center">
                                                <div className={`w-2 h-2 rounded-full ${set.completed ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-700'}`}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="shrink-0 w-2"></div>
                </div>

                {/* FAB */}
                <div className="fixed bottom-6 right-6 z-30">
                    {view === 'dashboard' ? (
                        <button onClick={handleStartWorkout} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center transform active:scale-95 transition-all">
                            <Play className="w-8 h-8 fill-current ml-1" />
                        </button>
                    ) : (
                        <button onClick={handleFinishWorkout} className="bg-green-600 hover:bg-green-500 text-white p-4 rounded-full shadow-lg shadow-green-900/40 flex items-center justify-center transform active:scale-95 transition-all">
                            <Save className="w-8 h-8" />
                        </button>
                    )}
                </div>
            </div>
        )}

        {/* STORICO */}
        {view === 'history' && (
            <div className="animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-white mb-6">Storico Allenamenti</h2>
                <div className="space-y-4">
                    {historyLogs.length === 0 ? (
                        <p className="text-gray-500 text-center py-10">Nessun allenamento registrato.</p>
                    ) : (
                        historyLogs.map((log) => (
                            <div key={log.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{log.dayName}</h3>
                                        <p className="text-xs text-gray-500">{log.date} • {log.startTime} - {log.endTime}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 font-mono font-bold">{log.totalTonnage} Kg</div>
                                        <div className="text-xs text-gray-500">Volume</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-gray-800 text-sm">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <Clock className="w-4 h-4" />
                                        {log.durationDisplay}
                                    </div>
                                    <div className="text-gray-400">
                                        ~{log.estimatedCalories} Kcal
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
