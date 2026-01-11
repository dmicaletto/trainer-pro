import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  getDocs,
  setDoc,
  doc,
  getDoc,
  startAfter
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
  CheckSquare,
  AlertCircle,
  Check,
  TrendingUp,
  Activity,
  History,
  Filter,
  ChevronDown,
  Edit2
} from 'lucide-react';

// Chart.js Imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Registrazione componenti Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfTXY1foD8Dr9UxRNzLeOu680aNtIw4TA",
  authDomain: "training-c0b76.firebaseapp.com",
  projectId: "training-c0b76",
  storageBucket: "training-c0b76.firebasestorage.app",
  messagingSenderId: "149618028951",
  appId: "1:149618028951:web:eca42664d47ab6d71954d2"
};
const safeConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : firebaseConfig;

const app = initializeApp(safeConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ID App per la struttura del DB
const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'training-c0b76'; 

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
                imageUrl: './images/panca-piana.gif', 
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
                imageUrl: './images/panca-multypower.gif', 
                notes: "Movimento controllato, senti l'allungamento." 
            },
			{ id: 'd1_e3', name: "Croci al Cavo alto", sets: Array(3).fill({reps: 10, weight: 10, completed: false}), rest: "60s", 
			 	imageUrl: './images/Croci-ai-cavi-alti.gif', notes: "Contrazione di picco." },
            { id: 'd1_e4', name: "Chest Press", sets: Array(3).fill({reps: 10, weight: 25, completed: false}), rest: "90s", 
			 	imageUrl: './images/Chest-Press-Machine.gif', notes: "Spingi i gomiti in avanti." },
            { id: 'd1_e5', name: "Pull Over", sets: Array(3).fill({reps: 12, weight: 20, completed: false}), rest: "90s", imageUrl: './images/pullover.gif', notes: "" },
			{ id: 'd1_e6', name: "Spinte in Basso (Pushdown)", sets: Array(3).fill({reps: 12, weight: 15, completed: false}), rest: "90s", imageUrl: './images/pushdown.png', notes: "" },
			{ id: 'd1_e7', name: "French Press (Manubri) panca 30°", sets: Array(3).fill({reps: 12, weight: 15, completed: false}), rest: "90s", imageUrl: './images/french-press.png', notes: "" },
			{ id: 'd1_e8', name: "Lombari Iperestensioni", sets: Array(3).fill({reps: 12, weight: 10, completed: false}), rest: "90s", imageUrl: './images/hyperextension.gif', notes: "" },
			{ id: 'd1_e8', name: "Abdoninal Crunch", sets: Array(4).fill({reps: 15, weight: 25, completed: false}), rest: "90s", imageUrl: './images/ABS_CRUNCH_MC.gif', notes: "" }
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

// --- CONFIGURAZIONE GRAFICI CHART.JS ---
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#1f2937',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#374151',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
        }
    },
    scales: {
        x: {
            ticks: { color: '#9ca3af', font: { size: 10 } },
            grid: { color: '#374151', drawBorder: false }
        },
        y: {
            ticks: { color: '#9ca3af', font: { size: 10 } },
            grid: { color: '#374151', borderDash: [5, 5] },
            beginAtZero: true
        }
    }
};

export default function App() {
  // --- STATO ---
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 
  const [isEditingProfile, setIsEditingProfile] = useState(false); // NUOVO: Stato edit profilo
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
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Storico & Analisi (STATI DEFINITI QUI PRIMA DELL'USO)
  const [historyLogs, setHistoryLogs] = useState([]);
  const [lastVisibleLog, setLastVisibleLog] = useState(null); 
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [allHistoryLoaded, setAllHistoryLoaded] = useState(false);
  
  const [weeklyVolumeData, setWeeklyVolumeData] = useState(null);
  const [monthlyVolumeData, setMonthlyVolumeData] = useState(null);
  const [progressionData, setProgressionData] = useState(null); 
  const [selectedProgressionDay, setSelectedProgressionDay] = useState('Giorno 1'); 

  // Auth Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- FUNZIONI DI SUPPORTO E LOGICA ---

  const fetchUserProfile = async (userId) => {
    if (!userId || userId === 'mock-user') {
        setUserProfile({ name: "Davide", surname: "Micaletto", weight: 68, age: 52, sex: 'M' });
        return;
    }
    try {
        const docRef = doc(db, `artifacts/${APP_ID}/users/${userId}/profiles_meta`, 'data');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) setUserProfile(docSnap.data());
    } catch (e) { console.error("Profile Error:", e); }
  };
  
  // NUOVO: Aggiorna profilo e salva storico peso
  const updateUserProfile = async () => {
    if (!user || user.uid === 'mock-user') {
        setIsEditingProfile(false);
        showToast("Profilo aggiornato (Mock)", 'success');
        return;
    }
    
    try {
        // 1. Salva dati meta profilo
        const profileRef = doc(db, `artifacts/${APP_ID}/users/${user.uid}/profiles_meta`, 'data');
        await setDoc(profileRef, userProfile, { merge: true });
        
        // 2. Salva storico del peso se modificato
        const weightLog = {
            date: new Date().toISOString(),
            weight: Number(userProfile.weight)
        };
        await addDoc(collection(db, `artifacts/${APP_ID}/users/${user.uid}/weight_history`), weightLog);

        setIsEditingProfile(false);
        showToast("Profilo aggiornato!", 'success');
    } catch (e) {
        console.error("Profile Save Error:", e);
        showToast("Errore salvataggio profilo", 'error');
    }
  };

  const fetchUserDefaults = async (userId) => {
      if (!userId || userId === 'mock-user') return {};
      try {
          const docRef = doc(db, `artifacts/${APP_ID}/users/${userId}/data`, 'workout_defaults');
          const docSnap = await getDoc(docRef);
          return docSnap.exists() ? docSnap.data() : {};
      } catch (e) { return {}; }
  };

  const saveDefaultToFirestore = async (userId, exerciseId, setIndex, field, value) => {
      if (!userId || userId === 'mock-user') return;
      try {
          const docRef = doc(db, `artifacts/${APP_ID}/users/${userId}/data`, 'workout_defaults');
          const currentDefaults = await fetchUserDefaults(userId);
          
          if (!currentDefaults[exerciseId]) currentDefaults[exerciseId] = [];
          if (!currentDefaults[exerciseId][setIndex]) currentDefaults[exerciseId][setIndex] = {};
          
          currentDefaults[exerciseId][setIndex][field] = value;
          
          await setDoc(docRef, currentDefaults, { merge: true });
      } catch (e) { console.error(e); }
  };

  const showToast = (message, type = 'success') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // MODIFICATO: Calcola SOLO il volume delle serie COMPLETATE
  const calculateCompletedVolume = (session) => {
      if (!session) return 0;
      let total = 0;
      session.exercises.forEach(ex => {
          ex.sets.forEach(set => {
              if (set.completed && set.weight > 0 && set.reps > 0) {
                  total += (set.weight || 0) * (set.reps || 0);
              }
          });
      });
      return total;
  };

  const calculateTotalPotentialVolume = (session) => {
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
          if (child) child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
  };

  // --- CARICAMENTO STORICO E GRAFICI ---
  const loadHistory = async (isInitial = false) => {
      if (!user || ['mock-user', 'test-user'].includes(user.uid)) return;
      
      setLoadingHistory(true);
      try {
          let q = query(
              collection(db, `artifacts/${APP_ID}/users/${user.uid}/workout_history`),
              orderBy("date", "desc"),
              limit(10)
          );

          if (!isInitial && lastVisibleLog) {
              q = query(q, startAfter(lastVisibleLog));
          }

          const querySnapshot = await getDocs(q);
          const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // Ordinamento secondario client-side per orario se necessario
          logs.sort((a, b) => b.startTime.localeCompare(a.startTime));

          if (querySnapshot.docs.length > 0) {
            setLastVisibleLog(querySnapshot.docs[querySnapshot.docs.length - 1]);
            setHistoryLogs(prev => isInitial ? logs : [...prev, ...logs]);
          } else {
            setAllHistoryLoaded(true);
          }

      } catch (e) { console.error(e); showToast("Errore caricamento storico", 'error'); }
      setLoadingHistory(false);
  };

  const loadChartData = async () => {
       if (!user || ['mock-user', 'test-user'].includes(user.uid)) return;
       try {
           const q = query(
              collection(db, `artifacts/${APP_ID}/users/${user.uid}/workout_history`),
              orderBy("date", "desc"),
              limit(50)
          );
          const querySnapshot = await getDocs(q);
          const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Chart Settimanale (Ultimi 7 logs)
          const weeklyLogs = logs.slice(0, 7).reverse();
          setWeeklyVolumeData({
              labels: weeklyLogs.map(l => l.date.slice(5)), // MM-DD
              datasets: [{
                  label: 'Volume (Kg)',
                  data: weeklyLogs.map(l => l.totalTonnage),
                  backgroundColor: 'rgba(59, 130, 246, 0.5)',
                  borderColor: 'rgba(59, 130, 246, 1)',
                  borderWidth: 1,
              }]
          });
          
          // Chart Mensile
          const last30DaysLogs = logs.filter(l => (new Date() - new Date(l.date)) / (1000 * 60 * 60 * 24) <= 30);
          const monthlyLogs = last30DaysLogs.reverse();
          setMonthlyVolumeData({
               labels: monthlyLogs.map(l => l.date.slice(5)),
               datasets: [{
                   label: 'Volume (Kg)',
                   data: monthlyLogs.map(l => l.totalTonnage),
                   backgroundColor: 'rgba(16, 185, 129, 0.5)',
                   borderColor: 'rgba(16, 185, 129, 1)',
                   borderWidth: 1,
               }]
          });

          // Chart Progressione
          const progressionLogs = logs.filter(l => l.dayName && l.dayName.includes(selectedProgressionDay)).reverse();
          setProgressionData({
               labels: progressionLogs.map(l => l.date.slice(5)),
               datasets: [{
                   label: 'Progressione Volume',
                   data: progressionLogs.map(l => l.totalTonnage),
                   borderColor: '#10b981',
                   backgroundColor: 'rgba(16, 185, 129, 0.2)',
                   tension: 0.3,
                   fill: true
               }]
          });

       } catch(e) { console.error(e); }
  };

  // --- LOGICA ALLENAMENTO ---
  const handleSetCompletion = (exerciseIndex, setIndex) => {
      if (!activeSession) return;
      const exercise = activeSession.exercises[exerciseIndex];
      const set = exercise.sets[setIndex];

      if (set.completed) return; 

      const updatedSession = { ...activeSession };
      updatedSession.exercises[exerciseIndex].sets[setIndex].completed = true;
      setActiveSession(updatedSession);
      saveSessionLocally(updatedSession);
      if (navigator.vibrate) navigator.vibrate(50);

      const isLastSetOfExercise = setIndex === exercise.sets.length - 1;
      
      if (isLastSetOfExercise) {
          showToast(`Esercizio completato!`, 'success');
          const isLastExercise = exerciseIndex === activeSession.exercises.length - 1;
          if (isLastExercise) {
              setTimeout(() => setFinishModalOpen(true), 500);
          } else {
              setTimeout(() => scrollToExercise(exerciseIndex + 1), 1200);
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
      
      updatedSession.exercises[exerciseIndex].sets[setIndex][field] = Number(value);
      setActiveSession(updatedSession);
      saveSessionLocally(updatedSession);

      if (user && user.uid !== 'mock-user') {
          saveDefaultToFirestore(user.uid, exerciseId, setIndex, field, Number(value));
      }
  };

  const saveSessionLocally = (session) => {
      if (user) {
          localStorage.setItem(`active_session_${user.uid}`, JSON.stringify({
              session,
              startTime: startTime ? startTime.toISOString() : new Date().toISOString(),
              timer: sessionTimer
          }));
      }
  };
  const clearLocalSession = () => { if (user) localStorage.removeItem(`active_session_${user.uid}`); };

  // --- HANDLERS UI ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try { await signInWithEmailAndPassword(auth, email, password); } 
    catch (err) {
      if(err.code === 'auth/network-request-failed' || err.message.includes('iframe')) {
          alert("Login bloccato in anteprima. Attivo modalità test.");
          setUser({ uid: "test-user", email: email || "test@test.com", displayName: "Test User" });
      } else { setAuthError('Errore login: Email o password errati.'); }
    }
  };
  const handleLogout = async () => { if (confirm("Uscire?")) { await signOut(auth); setUser(null); setIsMenuOpen(false); } };

  const handleStartWorkout = async () => {
      const dayTemplate = workoutData[activeDayId];
      let sessionData = JSON.parse(JSON.stringify(dayTemplate));
      setLoading(true);
      if (user && user.uid !== 'mock-user') {
          const userDefaults = await fetchUserDefaults(user.uid);
          sessionData.exercises = sessionData.exercises.map(ex => {
              if (userDefaults[ex.id]) {
                  const mergedSets = ex.sets.map((set, idx) => {
                      const savedSet = userDefaults[ex.id][idx];
                      if (savedSet) return { ...set, weight: savedSet.weight || set.weight, reps: savedSet.reps || set.reps };
                      return set;
                  });
                  return { ...ex, sets: mergedSets };
              }
              return ex;
          });
      }
      setLoading(false);
      setActiveSession(sessionData);
      setStartTime(new Date());
      setView('active-workout');
      setFinishModalOpen(false);
      setRating(0);
      saveSessionLocally(sessionData);
      showToast("Buon allenamento!", 'info');
  };

  const handleSaveAndExit = async () => {
      const totalTonnage = calculateCompletedVolume(activeSession);
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
              showToast("Salvato con successo!", 'success');
          } catch (e) { console.error("Save error:", e); showToast("Errore salvataggio!", 'error'); return; }
      } else { showToast("Salvato (Mock)", 'success'); }
      
      clearLocalSession();
      setActiveSession(null);
      setStartTime(null);
      setFinishModalOpen(false);
      setView('dashboard');
  };

  const handleCancelWorkout = () => { if(!confirm("Annullare?")) return; setActiveSession(null); clearLocalSession(); setView('dashboard'); };

  // --- EFFETTI DI INIZIALIZZAZIONE ---
  useEffect(() => {
    let unsubscribe = () => {};
    const activateMockMode = () => { setUser({ uid: "mock-user", email: "preview@gym.app", displayName: "Preview User" }); setLoading(false); };
    const isCanvasPreview = window.location.hostname.includes('googleusercontent.com') || window.self !== window.top;
    if (isCanvasPreview) {
        const timer = setTimeout(() => { if (loading) activateMockMode(); }, 2000); 
        const initAuth = async () => { try { unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); }, () => activateMockMode()); } catch { activateMockMode(); } };
        initAuth();
        return () => { clearTimeout(timer); unsubscribe(); };
    } else {
        unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
        return () => unsubscribe();
    }
  }, []);

  useEffect(() => {
      if(user) fetchUserProfile(user.uid);
  }, [user]);

  useEffect(() => {
      if (user && view === 'dashboard' && !activeSession) {
          const saved = localStorage.getItem(`active_session_${user.uid}`);
          if (saved) {
              try {
                  const parsed = JSON.parse(saved);
                  if (confirm(`Riprendere "${parsed.session.name}"?`)) {
                      setActiveSession(parsed.session);
                      setStartTime(new Date(parsed.startTime));
                      setSessionTimer(parsed.timer || 0);
                      setView('active-workout');
                  } else { clearLocalSession(); }
              } catch (e) { clearLocalSession(); }
          }
      }
  }, [user]);

  useEffect(() => {
      let interval;
      if (view === 'active-workout' && !finishModalOpen) {
          interval = setInterval(() => { setSessionTimer(t => { const newVal = t + 1; if (newVal % 5 === 0 && activeSession) saveSessionLocally(activeSession); return newVal; }); }, 1000);
      }
      return () => clearInterval(interval);
  }, [view, finishModalOpen]);

  useEffect(() => {
      let interval;
      if (restTimer.isOpen && restTimer.timeLeft > 0) { interval = setInterval(() => { setRestTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 })); }, 1000); }
      else if (restTimer.isOpen && restTimer.timeLeft <= 0 && navigator.vibrate) { navigator.vibrate([200, 100, 200]); }
      return () => clearInterval(interval);
  }, [restTimer.isOpen, restTimer.timeLeft]);

  // Gestione caricamento dati Storico/Grafici al cambio view
  useEffect(() => {
      if (view === 'history') {
          if(!['mock-user', 'test-user'].includes(user?.uid)) {
              if(historyLogs.length === 0) loadHistory(true);
              loadChartData();
          } else {
              // Mock Data
              const mData = {
                  labels: ['01-01', '01-04', '01-06', '01-08'],
                  datasets: [{ label: 'Volume (Kg)', data: [4200, 5100, 6200, 4500], backgroundColor: 'rgba(59, 130, 246, 0.5)' }]
              };
              setWeeklyVolumeData(mData);
              setMonthlyVolumeData(mData);
              setProgressionData(mData);
              setHistoryLogs([
                  { id: '1', dayName: 'Petto', date: '2025-01-08', durationDisplay: '00:45', totalTonnage: 4500, rating: 4 },
                  { id: '2', dayName: 'Gambe', date: '2025-01-06', durationDisplay: '00:55', totalTonnage: 6200, rating: 3 }
              ]);
          }
      }
  }, [view, user, selectedProgressionDay]);

  if (loading && view !== 'active-workout') return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;

  if (!user) return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-sm bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-center text-blue-500">Gym App</h2>
            <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-white" placeholder="Email" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-950 border border-gray-800 rounded-xl text-white" placeholder="Password" />
                <button type="submit" className="w-full py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors">Accedi</button>
                <div className="text-center pt-2">
                    <button type="button" onClick={() => setUser({uid:'mock', email:'demo'})} className="text-sm text-gray-500 hover:text-white underline">Modalità Demo</button>
                </div>
            </form>
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      
      {/* TOAST */}
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[100] transition-all duration-300 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-20 opacity-0'} ${toast.type === 'error' ? 'bg-red-900/90 border-red-700' : 'bg-gray-800/90 border-gray-700 backdrop-blur'}`}>
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-400" />}
          <span className="text-sm font-semibold text-white">{toast.message}</span>
      </div>

      {/* HEADER */}
      <header className={`fixed top-0 left-0 right-0 z-30 backdrop-blur-md border-b border-gray-800/50 transition-colors ${view === 'active-workout' ? 'bg-blue-950/80 border-blue-900/50' : 'bg-gray-950/80'}`}>
        <div className="max-w-4xl mx-auto px-4 h-16 flex justify-between items-center">
            {view === 'active-workout' ? (
                <div className="flex items-center justify-between w-full">
                    {/* Pulsante Annulla (Sinistra) */}
                    <button onClick={handleCancelWorkout} className="text-xs text-red-400 font-semibold border border-red-900/50 px-3 py-1 rounded-full hover:bg-red-900/10 flex items-center gap-1">
                        <X className="w-3 h-3" /> ESCI
                    </button>
                    
                    {/* Timer e Volume PARZIALE (Centro/Destra) */}
                    <div className="flex flex-col items-end">
                         <div className="flex items-center text-blue-400 font-mono text-lg font-bold animate-pulse">
                            <Timer className="w-4 h-4 mr-1" />
                            {formatDuration(sessionTimer)}
                        </div>
                        <div className="text-xs font-mono text-green-400">
                             Vol: {calculateCompletedVolume(activeSession)} kg
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600/20 p-2 rounded-lg"><Dumbbell className="w-5 h-5 text-blue-500" /></div>
                        <h1 className="text-lg font-bold tracking-tight">Gym App</h1>
                    </div>
                    <button onClick={() => setIsMenuOpen(true)} className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white"><Menu className="w-6 h-6" /></button>
                </>
            )}
        </div>
      </header>

      {/* MENU */}
      {isMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
              <div className="relative w-72 bg-gray-900 h-full shadow-2xl border-l border-gray-800 flex flex-col p-6 slide-in-from-right animate-in">
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

      {/* REST TIMER */}
      {restTimer.isOpen && (
          <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in">
              <div className="text-gray-400 mb-6 uppercase tracking-widest text-sm font-bold">Recupero</div>
              <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                  <svg className="absolute w-full h-full transform -rotate-90">
                      <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                      <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-blue-600 transition-all duration-1000 ease-linear" strokeDasharray={2 * Math.PI * 120} strokeDashoffset={2 * Math.PI * 120 * (1 - restTimer.timeLeft / restTimer.totalTime)} />
                  </svg>
                  <div className="text-8xl font-mono font-bold text-white tracking-tighter">{restTimer.timeLeft}</div>
              </div>
              <button onClick={closeRestTimer} className="w-full max-w-xs py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2"><SkipForward className="w-6 h-6" /> SALTA</button>
          </div>
      )}

      {/* FINISH MODAL */}
      {finishModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center p-6 animate-in zoom-in">
             <div className="text-center mb-8">
                 <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                 <h2 className="text-3xl font-bold text-white">Allenamento Finito!</h2>
             </div>
             <div className="bg-gray-900 w-full max-w-xs p-6 rounded-2xl border border-gray-800 mb-8">
                 <div className="flex justify-between items-center mb-2"><span className="text-gray-400">Tempo</span><span className="text-white font-mono font-bold">{formatDuration(sessionTimer)}</span></div>
                 <div className="flex justify-between items-center"><span className="text-gray-400">Volume</span><span className="text-green-400 font-mono font-bold">{calculateCompletedVolume(activeSession)} Kg</span></div>
             </div>
             <div className="mb-10 text-center">
                 <p className="text-sm text-gray-500 mb-4 uppercase tracking-widest">Valuta la sessione</p>
                 <div className="flex justify-center gap-2">
                     {[1,2,3,4,5].map(star => (<button key={star} onClick={() => setRating(star)} className="p-2"><Star className={`w-10 h-10 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} /></button>))}
                 </div>
             </div>
             <button onClick={handleSaveAndExit} className="w-full max-w-xs py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl shadow-lg shadow-green-900/40 flex items-center justify-center gap-2"><Save className="w-5 h-5" /> SALVA E ESCI</button>
          </div>
      )}

      <main className="max-w-4xl mx-auto pt-20 pb-32 px-4 min-h-screen">
        
        {/* VIEW: DASHBOARD / ACTIVE */}
        {(view === 'dashboard' || view === 'active-workout') && (
            <div className="animate-in fade-in duration-300">
                {view === 'dashboard' && (
                    <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 pb-2">
                        {Object.keys(workoutData).map((dayId) => (
                            <button key={dayId} onClick={() => setActiveDayId(dayId)} className={`flex-none px-5 py-2.5 text-sm font-bold rounded-full transition-all border ${activeDayId === dayId ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>{workoutData[dayId].name.split(':')[0]}</button>
                        ))}
                    </div>
                )}

                <div className="mb-6 flex justify-between items-end">
                    <h2 className="text-2xl font-bold text-white leading-none">{view === 'active-workout' ? activeSession.name : (workoutData[activeDayId].name.split(':')[1] || workoutData[activeDayId].name)}</h2>
                    {view === 'active-workout' && <div className="text-right text-xl font-mono font-bold text-green-400">{calculateCompletedVolume(activeSession)} <span className="text-sm text-gray-500">kg</span></div>}
                </div>

                <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar -mx-4 px-4" ref={scrollContainerRef}>
                    {(view === 'active-workout' ? activeSession.exercises : workoutData[activeDayId].exercises).map((exercise, exIndex) => (
                        <div key={exercise.id} className="snap-center shrink-0 w-[95vw] sm:w-[400px] bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-xl flex flex-col relative">
                            <div className="relative h-48 w-full bg-gray-800">
                                <img src={getImageUrl(exercise.imageUrl, exercise.name)} alt={exercise.name} className="w-full h-full object-cover opacity-70" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-blue-950/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-5 right-5 z-10 flex justify-between items-end">
                                    <h3 className="text-xl font-bold text-white leading-tight shadow-black drop-shadow-md max-w-[80%]">{exercise.name}</h3>
                                    <div className="bg-gray-900/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono text-blue-300 border border-white/10">{exIndex + 1}/{(view === 'active-workout' ? activeSession.exercises : workoutData[activeDayId].exercises).length}</div>
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col gap-4">
                                <div className="space-y-1">
                                    <div className={`grid ${view === 'active-workout' ? 'grid-cols-5' : 'grid-cols-4'} text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center px-2 mb-1`}>
                                        <div>#</div><div>Kg</div><div>Reps</div>{view === 'active-workout' && <div>Fatto</div>}<div>Stato</div>
                                    </div>
                                    {exercise.sets.map((set, setIdx) => (
                                        <div key={setIdx} className={`grid ${view === 'active-workout' ? 'grid-cols-5' : 'grid-cols-4'} items-center text-center py-2 rounded-lg border transition-colors ${set.completed ? 'bg-green-900/10 border-green-900/30' : 'bg-gray-800/30 border-gray-800/50'}`}>
                                            <div className={`text-xs font-bold ${set.completed ? 'text-green-500' : 'text-gray-500'}`}>{setIdx + 1}</div>
                                            <div className="px-1">{view === 'active-workout' ? <input type="number" value={set.weight} disabled={set.completed} onChange={(e) => updateSetValues(exIndex, setIdx, 'weight', e.target.value)} className={`w-full bg-gray-950 border border-gray-700 rounded text-center text-white font-mono py-1 focus:border-blue-500 focus:outline-none ${set.completed ? 'opacity-50 cursor-not-allowed border-transparent bg-transparent' : ''}`} /> : <span className="text-sm font-mono text-white">{set.weight || '-'}</span>}</div>
                                            <div className="px-1">{view === 'active-workout' ? <input type="number" value={set.reps} disabled={set.completed} onChange={(e) => updateSetValues(exIndex, setIdx, 'reps', e.target.value)} className={`w-full bg-gray-950 border border-gray-700 rounded text-center text-white font-mono py-1 focus:border-blue-500 focus:outline-none ${set.completed ? 'opacity-50 cursor-not-allowed border-transparent bg-transparent' : ''}`} /> : <span className="text-sm font-mono text-white">{set.reps}</span>}</div>
                                            {view === 'active-workout' && <div className="flex justify-center"><button onClick={() => handleSetCompletion(exIndex, setIdx)} disabled={set.completed}>{set.completed ? <CheckSquare className="w-5 h-5 text-green-500" /> : <Circle className="w-6 h-6 text-gray-400 hover:text-white" />}</button></div>}
                                            <div className="flex justify-center"><div className={`w-2 h-2 rounded-full ${set.completed ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-700'}`}></div></div>
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
                        <button onClick={handleStartWorkout} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center transform active:scale-95 transition-all"><Play className="w-8 h-8 fill-current ml-1" /></button>
                    </div>
                ) : (
                    <div className="fixed bottom-6 right-6 z-30">
                         <button onClick={() => setFinishModalOpen(true)} className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-lg shadow-red-900/40 flex items-center justify-center transform active:scale-95 transition-all"><Save className="w-8 h-8" /></button>
                    </div>
                )}
            </div>
        )}

        {/* VIEW: STORICO & CHART.JS */}
        {view === 'history' && (
            <div className="animate-in fade-in duration-300 space-y-8">
                
                {/* Filtro Progressione */}
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-500" /> Progressione Volume
                        </h4>
                        <div className="relative">
                            <select value={selectedProgressionDay} onChange={(e) => setSelectedProgressionDay(e.target.value)} className="bg-gray-800 text-xs text-white p-2 pr-8 rounded-lg appearance-none focus:outline-none border border-gray-700">
                                <option value="Giorno 1">Giorno 1 (Petto)</option>
                                <option value="Giorno 2">Giorno 2 (Gambe)</option>
                                <option value="Giorno 3">Giorno 3 (Schiena)</option>
                                <option value="Giorno 4">Giorno 4 (Richiamo)</option>
                            </select>
                            <Filter className="w-3 h-3 absolute right-2 top-3 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                    {progressionData && <div className="h-64"><Line data={progressionData} options={chartOptions} /></div>}
                </div>

                <div>
                     <h2 className="text-xl font-bold text-white mb-2">Analisi Recente</h2>
                     <div className="grid grid-cols-1 gap-4">
                        <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                            <h4 className="text-sm text-gray-400 mb-2">Volume Settimanale</h4>
                            {weeklyVolumeData && <div className="h-48"><Bar data={weeklyVolumeData} options={chartOptions} /></div>}
                        </div>
                     </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center"><History className="w-5 h-5 mr-2 text-blue-500" /> Registro Sessioni</h3>
                    <div className="space-y-4">
                        {historyLogs.map((log) => (
                            <div key={log.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col gap-3 hover:border-gray-700 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-white text-lg">{log.dayName}</h3>
                                        <p className="text-xs text-gray-500 capitalize">{new Date(log.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} • {log.startTime}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 font-mono font-bold text-lg">{log.totalTonnage} <span className="text-xs text-gray-500">Kg</span></div>
                                        <div className="flex justify-end mt-1">{[...Array(5)].map((_, i) => (<Star key={i} className={`w-3 h-3 ${i < log.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-800'}`} />))}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {!allHistoryLoaded && (
                            <button onClick={() => loadHistory()} disabled={loadingHistory} className="w-full py-3 bg-gray-800 text-gray-400 rounded-xl text-sm font-semibold hover:bg-gray-700">
                                {loadingHistory ? "Caricamento..." : "Carica Altri"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}
        
        {view === 'profile' && userProfile && (
            <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center justify-center py-12">
                <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mb-6 border-4 border-gray-800 shadow-xl relative group">
                    <User className="w-10 h-10 text-gray-500" />
                    <div className="absolute bottom-0 right-0 bg-blue-600 px-2 py-1 rounded-full text-xs font-bold border-2 border-gray-900">{userProfile.age}</div>
                    {/* Tasto Modifica Overlay */}
                    <button 
                        onClick={() => setIsEditingProfile(true)}
                        className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Edit2 className="w-6 h-6 text-white" />
                    </button>
                </div>

                <h2 className="text-2xl font-bold text-white mb-1">{userProfile.name} {userProfile.surname}</h2>
                <p className="text-gray-500 mb-6">{user.email}</p>

                <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-6">
                    {/* CARD PESO (Modificabile) */}
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center relative group">
                         <span className="block text-gray-400 text-xs uppercase mb-1">Peso</span>
                         {isEditingProfile ? (
                             <div className="flex items-center justify-center gap-1">
                                 <input 
                                    type="number" 
                                    value={userProfile.weight} 
                                    onChange={(e) => setUserProfile({...userProfile, weight: e.target.value})}
                                    className="w-16 bg-gray-800 border border-blue-500 rounded text-center text-white font-bold py-1 focus:outline-none"
                                 />
                                 <span className="text-sm font-normal text-gray-500">kg</span>
                             </div>
                         ) : (
                             <span className="text-xl font-bold text-white">{userProfile.weight} <span className="text-sm font-normal text-gray-500">kg</span></span>
                         )}
                    </div>

                    {/* CARD SESSO (Modificabile) */}
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center relative group">
                        <span className="block text-gray-400 text-xs uppercase mb-1">Sesso</span>
                        {isEditingProfile ? (
                            <select 
                                value={userProfile.sex} 
                                onChange={(e) => setUserProfile({...userProfile, sex: e.target.value})}
                                className="bg-gray-800 text-white font-bold py-1 px-2 rounded border border-blue-500 focus:outline-none"
                            >
                                <option value="M">M</option>
                                <option value="F">F</option>
                            </select>
                        ) : (
                            <span className="text-xl font-bold text-white">{userProfile.sex}</span>
                        )}
                    </div>
                </div>

                {/* BOTTONI AZIONE PROFILO */}
                {isEditingProfile && (
                    <div className="flex gap-3 mb-6 w-full max-w-sm">
                        <button onClick={() => setIsEditingProfile(false)} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg font-semibold hover:bg-gray-700">Annulla</button>
                        <button onClick={updateUserProfile} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-500">Salva Modifiche</button>
                    </div>
                )}

                <div className="w-full max-w-sm space-y-3">
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                        <span className="text-gray-400">Allenamenti completati</span>
                        <span className="text-xl font-bold text-white">{historyLogs.length}</span>
                    </div>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex justify-between items-center">
                        <span className="text-gray-400">Tonnellaggio Totale</span>
                        <span className="text-xl font-bold text-blue-500">{historyLogs.reduce((acc, curr) => acc + (curr.totalTonnage || 0), 0).toLocaleString()} Kg</span>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
