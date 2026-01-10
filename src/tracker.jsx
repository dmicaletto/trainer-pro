
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
  Lock,
  Star,
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

// --- DATI INIZIALI (Template) ---
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
  
  // UI States
  const [restTimer, setRestTimer] = useState({ isOpen: false, timeLeft: 0, totalTime: 0 });
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const scrollContainerRef = useRef(null);

  // Storico
  const [historyLogs, setHistoryLogs] = useState([]);

  // Auth Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- PERSISTENZA UTENTE (PROGRESSIONE) ---
  
  // Carica i pesi "Ultimi Usati" dal LocalStorage
  const loadUserDefaults = (userId) => {
      try {
          const defaults = localStorage.getItem(`workout_defaults_${userId}`);
          return defaults ? JSON.parse(defaults) : {};
      } catch (e) {
          console.error("Error loading defaults", e);
          return {};
      }
  };

  // Salva i pesi correnti come "Ultimi Usati"
  const saveLastUsedData = (userId, exerciseId, setIndex, field, value) => {
      try {
          const defaults = loadUserDefaults(userId);
          if (!defaults[exerciseId]) defaults[exerciseId] = [];
          if (!defaults[exerciseId][setIndex]) defaults[exerciseId][setIndex] = {};
          
          defaults[exerciseId][setIndex][field] = value;
          
          localStorage.setItem(`workout_defaults_${userId}`, JSON.stringify(defaults));
      } catch (e) {
          console.error("Error saving defaults", e);
      }
  };

  // --- HELPER FUNCTIONS ---
  const calculateTotalVolume = (session) => {
      if (!session) return 0;
      let total = 0;
      session.exercises.forEach(ex => {
          ex.sets.forEach(set => {
              if (set.weight > 0 && set.reps > 0) {
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

  const scrollToExercise = (index) => {
      if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const child = container.children[index];
          if (child) {
            child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
      }
  };

  // --- CORE LOGIC: Aggiornamento Serie e Navigazione ---
  const handleSetCompletion = (exerciseIndex, setIndex) => {
      if (!activeSession) return;

      const exercise = activeSession.exercises[exerciseIndex];
      const set = exercise.sets[setIndex];

      if (set.completed) return; // Già fatto

      const updatedSession = { ...activeSession };
      updatedSession.exercises[exerciseIndex].sets[setIndex].completed = true;
      setActiveSession(updatedSession);
      saveSessionLocally(updatedSession);

      const isLastSetOfExercise = setIndex === exercise.sets.length - 1;
      
      if (isLastSetOfExercise) {
          const isLastExercise = exerciseIndex === activeSession.exercises.length - 1;
          if (isLastExercise) {
              setTimeout(() => setFinishModalOpen(true), 500);
          } else {
              setTimeout(() => scrollToExercise(exerciseIndex + 1), 1000);
          }
      } else {
          const seconds = parseRestTime(exercise.rest);
          openRestTimer(seconds);
      }
  };

  const updateSetValues = (exerciseIndex, setIndex, field, value) => {
      if (activeSession.exercises[exerciseIndex].sets[setIndex].completed) return;

      const updatedSession = { ...activeSession };
      const exerciseId = updatedSession.exercises[exerciseIndex].id;
      
      // Aggiorna stato sessione
      updatedSession.exercises[exerciseIndex].sets[setIndex][field] = Number(value);
      setActiveSession(updatedSession);
      saveSessionLocally(updatedSession);

      // Aggiorna "Ultimi Usati" per il futuro (Progressione)
      if (user) {
          saveLastUsedData(user.uid, exerciseId, setIndex, field, Number(value));
      }
  };

  // --- PERSISTENZA LOCALE (Sessione Attiva) ---
  const saveSessionLocally = (session) => {
      if (user) {
          localStorage.setItem(`active_session_${user.uid}`, JSON.stringify({
              session,
              startTime: startTime ? startTime.toISOString() : new Date().toISOString(),
              timer: sessionTimer
          }));
      }
  };

  const clearLocalSession = () => {
      if (user) localStorage.removeItem(`active_session_${user.uid}`);
  };

  // --- HANDLERS ---
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
      // 1. Clona il template
      const dayTemplate = workoutData[activeDayId];
      let sessionData = JSON.parse(JSON.stringify(dayTemplate));

      // 2. Sovrascrivi con i "Default Utente" (Progressione)
      if (user) {
          const userDefaults = loadUserDefaults(user.uid);
          sessionData.exercises = sessionData.exercises.map(ex => {
              if (userDefaults[ex.id]) {
                  // Se abbiamo dati salvati per questo esercizio
                  const mergedSets = ex.sets.map((set, idx) => {
                      const savedSet = userDefaults[ex.id][idx];
                      if (savedSet) {
                          return {
                              ...set,
                              weight: savedSet.weight || set.weight, // Usa salvato se esiste
                              reps: savedSet.reps || set.reps     // Usa salvato se esiste
                          };
                      }
                      return set;
                  });
                  return { ...ex, sets: mergedSets };
              }
              return ex;
          });
      }

      setActiveSession(sessionData);
      setStartTime(new Date());
      setView('active-workout');
      setFinishModalOpen(false);
      setRating(0);
      saveSessionLocally(sessionData); 
  };

  const handleSaveAndExit = async () => {
      const totalTonnage = calculateTotalVolume(activeSession);
      const endTime = new Date();
      const durationSeconds = sessionTimer;
      
      const workoutLog = {
          date: startTime ? new Date(startTime).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          dayName: activeSession.name,
          durationDisplay: formatDuration(durationSeconds),
          durationSeconds: durationSeconds,
          startTime: startTime ? new Date(startTime).toLocaleTimeString('it-IT') : "00:00:00",
          endTime: endTime.toLocaleTimeString('it-IT'),
          estimatedCalories: Math.round(totalTonnage * 0.05 + durationSeconds / 60 * 4),
          rating: rating,
          totalTonnage: totalTonnage
      };

      if (user.uid !== 'mock-user' && user.uid !== 'test-user') {
          try {
              await addDoc(collection(db, `artifacts/${APP_ID}/users/${user.uid}/workout_history`), workoutLog);
          } catch (e) {
              console.error("Save error:", e);
              alert("Errore salvataggio: " + e.message);
              return; 
          }
      } else {
          console.log("(Mock) Saved:", workoutLog);
      }
      
      clearLocalSession();
      setActiveSession(null);
      setStartTime(null);
      setFinishModalOpen(false);
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
            try { unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }, () => activateMockMode()); } catch { activateMockMode(); }
        };
        initAuth();
        return () => { clearTimeout(timer); unsubscribe(); };
    } else {
        unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
        return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
      if (user && view === 'dashboard' && !activeSession) {
          const saved = localStorage.getItem(`active_session_${user.uid}`);
          if (saved) {
              try {
                  const parsed = JSON.parse(saved);
                  if (confirm(`Trovata sessione interrotta di "${parsed.session.name}". Vuoi riprenderla?`)) {
                      setActiveSession(parsed.session);
                      setStartTime(new Date(parsed.startTime));
                      setSessionTimer(parsed.timer || 0);
                      setView('active-workout');
                  } else {
                      clearLocalSession();
                  }
              } catch (e) { clearLocalSession(); }
          }
      }
  }, [user]);

  useEffect(() => {
      let interval;
      if (view === 'active-workout' && !finishModalOpen) {
          interval = setInterval(() => {
              setSessionTimer(t => {
                  const newVal = t + 1;
                  if (newVal % 5 === 0 && activeSession) saveSessionLocally(activeSession); 
                  return newVal;
              });
          }, 1000);
      }
      return () => clearInterval(interval);
  }, [view, finishModalOpen]);

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
              } catch (e) { console.error(e); }
          };
          fetchHistory();
      } else if (view === 'history') {
           setHistoryLogs([{ id: '1', dayName: 'Esempio Petto', date: '2025-01-01', durationDisplay: '00:45:00', totalTonnage: 4500, rating: 4, estimatedCalories: 300 }]);
      }
  }, [view, user]);

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user) return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-sm bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-center text-blue-500">Gym App</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-white" placeholder="Email" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-white" placeholder="Password" />
                <button type="submit" className="w-full py-3 bg-blue-600 rounded-xl font-bold">Accedi</button>
                <button type="button" onClick={() => setUser({uid:'mock', email:'demo'})} className="w-full py-2 text-sm text-gray-500">Demo</button>
            </form>
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      
      <header className={`fixed top-0 left-0 right-0 z-30 backdrop-blur-md border-b border-gray-800/50 transition-colors ${view === 'active-workout' ? 'bg-blue-950/80 border-blue-900/50' : 'bg-gray-950/80'}`}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
            {view === 'active-workout' ? (
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center text-blue-400 font-mono text-xl font-bold animate-pulse">
                        <Timer className="w-5 h-5 mr-2" />
                        {formatDuration(sessionTimer)}
                    </div>
                    <button onClick={() => {if(confirm("Annullare allenamento?")) {setActiveSession(null); clearLocalSession(); setView('dashboard');}}} className="text-xs text-red-400 font-semibold border border-red-900/50 px-3 py-1 rounded-full">
                        ESCI
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

      {restTimer.isOpen && (
          <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="text-gray-400 mb-6 uppercase tracking-widest text-sm font-bold">Recupero</div>
              <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                  <svg className="absolute w-full h-full transform -rotate-90">
                      <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                      <circle 
                        cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        className="text-blue-600 transition-all duration-1000 ease-linear"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - restTimer.timeLeft / restTimer.totalTime)}
                      />
                  </svg>
                  <div className="text-8xl font-mono font-bold text-white tracking-tighter">{restTimer.timeLeft}</div>
              </div>
              <button onClick={closeRestTimer} className="w-full max-w-xs py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95">
                  <SkipForward className="w-6 h-6" /> SALTA
              </button>
          </div>
      )}

      {finishModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 animate-in zoom-in duration-300">
             <div className="text-center mb-8">
                 <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                 <h2 className="text-3xl font-bold text-white">Allenamento Finito!</h2>
                 <p className="text-gray-400 mt-2">Ottimo lavoro.</p>
             </div>
             
             <div className="bg-gray-900 w-full max-w-xs p-6 rounded-2xl border border-gray-800 mb-8">
                 <div className="flex justify-between items-center mb-2">
                     <span className="text-gray-400">Tempo</span>
                     <span className="text-white font-mono font-bold">{formatDuration(sessionTimer)}</span>
                 </div>
                 <div className="flex justify-between items-center">
                     <span className="text-gray-400">Volume</span>
                     <span className="text-green-400 font-mono font-bold">{calculateTotalVolume(activeSession)} Kg</span>
                 </div>
             </div>

             <div className="mb-10">
                 <p className="text-center text-sm text-gray-500 mb-4 uppercase tracking-widest">Valuta la sessione</p>
                 <div className="flex gap-2">
                     {[1,2,3,4,5].map(star => (
                         <button key={star} onClick={() => setRating(star)} className="p-2 transition-transform active:scale-125">
                             <Star className={`w-10 h-10 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
                         </button>
                     ))}
                 </div>
             </div>

             <button onClick={handleSaveAndExit} className="w-full max-w-xs py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-900/40 flex items-center justify-center gap-2">
                 <Save className="w-5 h-5" /> SALVA E ESCI
             </button>
          </div>
      )}

      <main className="max-w-4xl mx-auto pt-20 pb-32 px-4 min-h-screen">
        
        {(view === 'dashboard' || view === 'active-workout') && (
            <div className="animate-in fade-in duration-300">
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

                <div className="mb-6 flex justify-between items-end">
                    <h2 className="text-2xl font-bold text-white leading-none">
                        {view === 'active-workout' ? activeSession.name : (workoutData[activeDayId].name.split(':')[1] || workoutData[activeDayId].name)}
                    </h2>
                    {view === 'active-workout' && (
                        <div className="text-right text-xl font-mono font-bold text-green-400">
                            {calculateTotalVolume(activeSession)} <span className="text-sm text-gray-500">kg</span>
                        </div>
                    )}
                </div>

                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar -mx-4 px-4" ref={scrollContainerRef}>
                    {(view === 'active-workout' ? activeSession.exercises : workoutData[activeDayId].exercises).map((exercise, exIndex) => (
                        <div key={exercise.id} className="snap-center shrink-0 w-[95vw] sm:w-[400px] bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-xl flex flex-col relative group">
                            
                            <div className="relative h-48 w-full bg-gray-800">
                                <img src={getImageUrl(exercise.imageUrl, exercise.name)} alt={exercise.name} className="w-full h-full object-cover opacity-70" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-blue-950/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-5 right-5 z-10 flex justify-between items-end">
                                    <h3 className="text-xl font-bold text-white leading-tight shadow-black drop-shadow-md max-w-[80%]">{exercise.name}</h3>
                                    <div className="bg-gray-900/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono text-blue-300 border border-white/10">
                                        {exIndex + 1}/{(view === 'active-workout' ? activeSession.exercises : workoutData[activeDayId].exercises).length}
                                    </div>
                                </div>
                            </div>

                            <div className="p-5 flex-1 flex flex-col gap-4">
                                <div className="space-y-1">
                                    <div className={`grid ${view === 'active-workout' ? 'grid-cols-5' : 'grid-cols-4'} text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center px-2 mb-1`}>
                                        <div>#</div>
                                        <div>Kg</div>
                                        <div>Reps</div>
                                        {view === 'active-workout' && <div>Fatto</div>}
                                        <div>Stato</div>
                                    </div>
                                    
                                    {exercise.sets.map((set, setIdx) => (
                                        <div key={setIdx} className={`grid ${view === 'active-workout' ? 'grid-cols-5' : 'grid-cols-4'} items-center text-center py-2 rounded-lg border transition-colors ${set.completed ? 'bg-green-900/10 border-green-900/30' : 'bg-gray-800/30 border-gray-800/50'}`}>
                                            <div className={`text-xs font-bold ${set.completed ? 'text-green-500' : 'text-gray-500'}`}>{setIdx + 1}</div>
                                            <div className="px-1">
                                                {view === 'active-workout' ? (
                                                    <input 
                                                        type="number" 
                                                        value={set.weight} 
                                                        disabled={set.completed}
                                                        onChange={(e) => updateSetValues(exIndex, setIdx, 'weight', e.target.value)} 
                                                        className={`w-full bg-gray-950 border border-gray-700 rounded text-center text-white font-mono py-1 focus:border-blue-500 focus:outline-none ${set.completed ? 'opacity-50 cursor-not-allowed border-transparent bg-transparent' : ''}`}
                                                    />
                                                ) : (<span className="text-sm font-mono text-white">{set.weight || '-'}</span>)}
                                            </div>
                                            <div className="px-1">
                                                {view === 'active-workout' ? (
                                                    <input 
                                                        type="number" 
                                                        value={set.reps} 
                                                        disabled={set.completed}
                                                        onChange={(e) => updateSetValues(exIndex, setIdx, 'reps', e.target.value)} 
                                                        className={`w-full bg-gray-950 border border-gray-700 rounded text-center text-white font-mono py-1 focus:border-blue-500 focus:outline-none ${set.completed ? 'opacity-50 cursor-not-allowed border-transparent bg-transparent' : ''}`}
                                                    />
                                                ) : (<span className="text-sm font-mono text-white">{set.reps}</span>)}
                                            </div>
                                            {view === 'active-workout' && (
                                                <div className="flex justify-center">
                                                    <button onClick={() => handleSetCompletion(exIndex, setIdx)} disabled={set.completed}>
                                                        {set.completed 
                                                            ? <CheckSquare className="w-5 h-5 text-green-500" /> 
                                                            : <Circle className="w-6 h-6 text-gray-400 hover:text-white" />
                                                        }
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

                {view === 'dashboard' ? (
                    <div className="fixed bottom-6 right-6 z-30">
                        <button onClick={handleStartWorkout} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center transform active:scale-95 transition-all">
                            <Play className="w-8 h-8 fill-current ml-1" />
                        </button>
                    </div>
                ) : (
                    <div className="fixed bottom-6 right-6 z-30">
                         <button onClick={() => setFinishModalOpen(true)} className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-lg shadow-red-900/40 flex items-center justify-center transform active:scale-95 transition-all">
                            <Save className="w-8 h-8" />
                        </button>
                    </div>
                )}
            </div>
        )}

        {view === 'history' && (
            <div className="animate-in fade-in duration-300">
                <h2 className="text-2xl font-bold text-white mb-6">Storico Allenamenti</h2>
                <div className="space-y-4">
                    {historyLogs.map((log) => (
                        <div key={log.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{log.dayName}</h3>
                                    <p className="text-xs text-gray-500">{log.date} • {log.startTime} - {log.endTime}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-green-400 font-mono font-bold">{log.totalTonnage} Kg</div>
                                    <div className="flex justify-end mt-1">
                                         {[...Array(5)].map((_, i) => (
                                             <Star key={i} className={`w-3 h-3 ${i < log.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-700'}`} />
                                         ))}
                                    </div>
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
                    ))}
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
