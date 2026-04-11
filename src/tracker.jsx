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
    startAfter,
    serverTimestamp,
    deleteDoc
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
    Edit2,
    Maximize2,
    Trash2,
    Plus,
    StickyNote,
    Shuffle,
    ArrowLeftRight,
    Pencil
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

// --- CONFIGURAZIONE FIREBASE ---
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
const APP_VERSION = "1.2.9";

// --- DATI INIZIALI (Template Aggiornato) ---
const INITIAL_WORKOUT_DAYS = {
    'day_1': {
        name: "Giorno 1: Petto e Tricipiti",
        exercises: [
            {
                id: 'd1_e1',
                name: "Panca Piana - Bilanciere",
                sets: [{ reps: 12, weight: 40, completed: false }, { reps: 10, weight: 45, completed: false }, { reps: 10, weight: 50, completed: false }, { reps: 8, weight: 55, completed: false }],
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
            {
                id: 'd1_e3', name: "Croci al Cavo alto", multiplier: 2, sets: Array(3).fill({ reps: 10, weight: 10, completed: false }), rest: "60s",
                imageUrl: './images/Croci-ai-cavi-alti.gif', notes: "Contrazione di picco."
            },
            {
                id: 'd1_e4', name: "Chest Press", sets: Array(3).fill({ reps: 10, weight: 25, completed: false }), rest: "90s",
                imageUrl: './images/Chest-Press-Machine.gif', notes: "Spingi i gomiti in avanti."
            },
            { id: 'd1_e5', name: "Pull Over", sets: Array(3).fill({ reps: 12, weight: 20, completed: false }), rest: "90s", imageUrl: './images/pullover.gif', notes: "" },
            { id: 'd1_e6', name: "Spinte in Basso (Pushdown)", sets: Array(3).fill({ reps: 12, weight: 15, completed: false }), rest: "90s", imageUrl: './images/pushdown.png', notes: "" },
            { id: 'd1_e7', name: "French Press (Manubri) panca 30°", multiplier: 2, sets: Array(3).fill({ reps: 12, weight: 15, completed: false }), rest: "90s", imageUrl: './images/french-press.png', notes: "" },
            { id: 'd1_e8', name: "Lombari Iperestensioni", sets: Array(3).fill({ reps: 12, weight: 10, completed: false }), rest: "90s", imageUrl: './images/hyperextension.gif', notes: "" },
            { id: 'd1_e9', name: "Abdoninal Crunch", sets: Array(4).fill({ reps: 15, weight: 25, completed: false }), rest: "90s", imageUrl: './images/ABS_CRUNCH_MC.gif', notes: "" }
        ]
    },
    'day_2': {
        name: "Giorno 2: Gambe e Spalle",
        exercises: [
            { id: 'd2_e1', name: "Calf Raises on leg press", sets: Array(4).fill({ reps: 10, weight: 40, completed: false }), rest: "90s", imageUrl: './images/Calf-Press-on-Leg-Press-Machine.gif', notes: "" },
            { id: 'd2_e2', name: "Leg Press", sets: Array(4).fill({ reps: 10, weight: 70, completed: false }), rest: "90s", imageUrl: './images/leg-press.png', notes: "Non bloccare le ginocchia." },
            { id: 'd2_e3', name: "Leg Extension", sets: Array(4).fill({ reps: 10, weight: 25, completed: false }), rest: "90s", imageUrl: './images/legext.png', notes: "Non bloccare le ginocchia." },
            { id: 'd2_e4', name: "Leg Curl Sdraiato", sets: Array(4).fill({ reps: 10, weight: 25, completed: false }), rest: "90s", imageUrl: './images/leg-curl-sdraiato-bg.png', notes: "Non bloccare le ginocchia." },
            { id: 'd2_e5', name: "Lento avanti panca 70°", multiplier: 2, sets: Array(4).fill({ reps: 10, weight: 14, completed: false }), rest: "90s", imageUrl: './images/lento-manubri.gif', notes: "Non bloccare le ginocchia." },
            { id: 'd2_e6', name: "Alzate Laterali", multiplier: 2, sets: Array(4).fill({ reps: 10, weight: 12, completed: false }), rest: "90s", imageUrl: './images/alzate-laterali.png', notes: "Non bloccare le ginocchia." },
            { id: 'd2_e7', name: "Alzate posteriori su panca", multiplier: 2, sets: Array(4).fill({ reps: 10, weight: 10, completed: false }), rest: "90s", imageUrl: './images/inverso-manubri-panca-alta-bg.png', notes: "Non bloccare le ginocchia." },
            { id: 'd2_e8', name: "Lombari Iperestensioni", sets: Array(3).fill({ reps: 12, weight: 10, completed: false }), rest: "90s", imageUrl: './images/hyperextension.gif', notes: "" },
            { id: 'd2_e9', name: "Abdoninal Crunch", sets: Array(4).fill({ reps: 15, weight: 25, completed: false }), rest: "90s", imageUrl: './images/ABS_CRUNCH_MC.gif', notes: "" }
        ]
    },
    'day_3': {
        name: "Giorno 3: Schiena e Bicipiti",
        exercises: [
            { id: 'd3_e1', name: "Rematore Manubri", multiplier: 2, sets: Array(4).fill({ reps: 10, weight: 18, completed: false }), rest: "90s", imageUrl: './images/rematore-manubrio.gif', notes: "Schiena dritta." },
            { id: 'd3_e2', name: "Lat Machine", sets: Array(4).fill({ reps: 8, weight: 50, completed: false }), rest: "90s", imageUrl: './images/lat-machine.png', notes: "Schiena dritta." },
            { id: 'd3_e3', name: "Pulley basso con Triangolo", sets: Array(4).fill({ reps: 8, weight: 30, completed: false }), rest: "90s", imageUrl: './images/pulley-basso.png', notes: "Petto in fuori, schiena inarcata. Porta il triangolo all'ombelico." },
            { id: 'd3_e4', name: "Row Machine", sets: Array(4).fill({ reps: 8, weight: 50, completed: false }), rest: "90s", imageUrl: './images/Row-Machine.gif', notes: "Schiena dritta." },
            { id: 'd3_e5', name: "Curl seduto con Manubri", multiplier: 2, sets: Array(4).fill({ reps: 10, weight: 12, completed: false }), rest: "90s", imageUrl: './images/curl-manubri-seduto-bg.png', notes: "Schiena dritta." },
            { id: 'd3_e6', name: "Hammer curl in piedi", sets: Array(4).fill({ reps: 10, weight: 15, completed: false }), rest: "90s", imageUrl: './images/hammer-curl.png', notes: "Schiena dritta." },
            { id: 'd3_e7', name: "Trazioni alla sbarra Chin Up", sets: Array(4).fill({ reps: 10, weight: 48, completed: false }), rest: "90s", imageUrl: './images/chin-up.gif', notes: "Schiena dritta." },
            { id: 'd3_e8', name: "Lombari Iperestensioni", sets: Array(3).fill({ reps: 12, weight: 10, completed: false }), rest: "90s", imageUrl: './images/hyperextension.gif', notes: "" },
            { id: 'd3_e9', name: "Abdoninal Crunch", sets: Array(4).fill({ reps: 15, weight: 25, completed: false }), rest: "90s", imageUrl: './images/ABS_CRUNCH_MC.gif', notes: "" }
        ]
    },
    'day_4': {
        name: "Giorno 4: Petto e Spalle (Richiamo)",
        exercises: [
            { id: 'd4_e1', name: "Panca Piana Manubri", multiplier: 2, sets: Array(3).fill({ reps: 10, weight: 16, completed: false }), rest: "90s", imageUrl: './images/Chest-Press-con-Manubri-gif.gif', notes: "" },
            { id: 'd4_e2', name: "Chest Press distensioni delle braccia", sets: Array(3).fill({ reps: 10, weight: 40, completed: false }), rest: "90s", imageUrl: './images/chestpress.png', notes: "" },
            { id: 'd4_e3', name: "Panca Inclinata Manubri", multiplier: 2, sets: Array(3).fill({ reps: 10, weight: 16, completed: false }), rest: "90s", imageUrl: './images/spinte-panca-alta-manubri.png', notes: "inclinata 30 gradi" },
            { id: 'd4_e4', name: "Alzate Laterali", multiplier: 2, sets: Array(3).fill({ reps: 10, weight: 12, completed: false }), rest: "90s", imageUrl: './images/alzate-laterali.png', notes: "" },
            { id: 'd4_e5', name: "Alzate Frontali", multiplier: 2, sets: Array(3).fill({ reps: 10, weight: 10, completed: false }), rest: "90s", imageUrl: './images/alzate-frontali.png', notes: "" },
            { id: 'd4_e6', name: "Alzate Posteriori su panca", multiplier: 2, sets: Array(3).fill({ reps: 10, weight: 10, completed: false }), rest: "90s", imageUrl: './images/inverso-manubri-panca-alta-bg.png', notes: "" },
            { id: 'd4_e7', name: "Lombari Iperestensioni", sets: Array(3).fill({ reps: 12, weight: 10, completed: false }), rest: "90s", imageUrl: './images/hyperextension.gif', notes: "" },
            { id: 'd4_e8', name: "Abdoninal Crunch", sets: Array(4).fill({ reps: 15, weight: 25, completed: false }), rest: "90s", imageUrl: './images/ABS_CRUNCH_MC.gif', notes: "" }
        ]
    }
};

// --- CATALOGO ALLENAMENTO LIBERO ---
const EXERCISE_GROUPS = {
    'd1_e1': 'Petto', 'd1_e2': 'Petto', 'd1_e3': 'Petto', 'd1_e4': 'Petto', 'd1_e5': 'Petto',
    'd1_e6': 'Tricipiti', 'd1_e7': 'Tricipiti',
    'd1_e8': 'Core', 'd1_e9': 'Core',
    'd2_e1': 'Gambe', 'd2_e2': 'Gambe', 'd2_e3': 'Gambe', 'd2_e4': 'Gambe',
    'd2_e5': 'Spalle', 'd2_e6': 'Spalle', 'd2_e7': 'Spalle',
    'd2_e8': 'Core', 'd2_e9': 'Core',
    'd3_e1': 'Schiena', 'd3_e2': 'Schiena', 'd3_e3': 'Schiena', 'd3_e4': 'Schiena', 'd3_e7': 'Schiena',
    'd3_e5': 'Bicipiti', 'd3_e6': 'Bicipiti',
    'd3_e8': 'Core', 'd3_e9': 'Core',
    'd4_e1': 'Petto', 'd4_e2': 'Petto', 'd4_e3': 'Petto',
    'd4_e4': 'Spalle', 'd4_e5': 'Spalle', 'd4_e6': 'Spalle',
    'd4_e7': 'Core', 'd4_e8': 'Core',
};

const MUSCLE_GROUP_ORDER = ['Petto', 'Tricipiti', 'Schiena', 'Bicipiti', 'Gambe', 'Spalle', 'Core'];

const FREE_WORKOUT_CATALOG = Object.values(INITIAL_WORKOUT_DAYS)
    .flatMap(day => day.exercises)
    .filter((ex, idx, arr) => arr.findIndex(e => e.name === ex.name) === idx)
    .map(ex => ({ ...ex, muscleGroup: EXERCISE_GROUPS[ex.id] || 'Altro' }))
    .sort((a, b) => {
        const ga = MUSCLE_GROUP_ORDER.indexOf(a.muscleGroup);
        const gb = MUSCLE_GROUP_ORDER.indexOf(b.muscleGroup);
        return ga !== gb ? ga - gb : a.name.localeCompare(b.name, 'it');
    });

const getImageUrl = (url, name) => {
    if (url && (url.startsWith('http') || url.startsWith('./'))) return url;
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

const sanitizeData = (data) => {
    if (data === undefined) return null;
    if (data === null || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map(sanitizeData);
    const sanitized = {};
    for (const key in data) {
        if (data[key] === undefined) {
            sanitized[key] = null;
        } else {
            sanitized[key] = sanitizeData(data[key]);
        }
    }
    return sanitized;
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
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [loading, setLoading] = useState(true);

    const [activeDayId, setActiveDayId] = useState('day_1');
    const [view, setView] = useState('dashboard');
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Allenamento
    const [workoutData, setWorkoutData] = useState(INITIAL_WORKOUT_DAYS);
    const [activeSession, setActiveSession] = useState(null);
    const [sessionTimer, setSessionTimer] = useState(0);
    const [startTime, setStartTime] = useState(null);
    const [maxSessionTonnage, setMaxSessionTonnage] = useState(0);
    const [exercisePickerOpen, setExercisePickerOpen] = useState(false);
    const [pickerFilterGroup, setPickerFilterGroup] = useState(null);
    const [substituteExIndex, setSubstituteExIndex] = useState(null);
    const [customExercises, setCustomExercises] = useState([]);
    const [customExerciseModal, setCustomExerciseModal] = useState({ open: false, editingId: null, form: null });

    // UI States
    const [restTimer, setRestTimer] = useState({ isOpen: false, timeLeft: 0, totalTime: 0, activeExerciseIndex: null });
    const [finishModalOpen, setFinishModalOpen] = useState(false);
    const [fullScreenImage, setFullScreenImage] = useState(null);
    const [noteModal, setNoteModal] = useState({ isOpen: false, exerciseIndex: null, text: '' });
    const [rating, setRating] = useState(0);
    const scrollContainerRef = useRef(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Wake Lock Ref
    const wakeLockRef = useRef(null);

    // Storico & Analisi
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

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    };

    const playTimerEndSound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const context = new AudioContext();
            const oscillator = context.createOscillator();
            const gain = context.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, context.currentTime); // A5
            oscillator.connect(gain);
            gain.connect(context.destination);
            gain.gain.setValueAtTime(0, context.currentTime);
            gain.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.1);
            gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(context.currentTime + 0.5);
        } catch (e) {
            console.error("Audio error:", e);
        }
    };

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

    const updateUserProfile = async () => {
        if (!user || user.uid === 'mock-user') {
            setIsEditingProfile(false);
            showToast("Profilo aggiornato (Mock)", 'success');
            return;
        }
        try {
            const profileRef = doc(db, `artifacts/${APP_ID}/users/${user.uid}/profiles_meta`, 'data');
            await setDoc(profileRef, sanitizeData(userProfile), { merge: true });

            const weightLog = {
                date: new Date().toISOString(),
                weight: Number(userProfile.weight)
            };
            await addDoc(collection(db, `artifacts/${APP_ID}/users/${user.uid}/weight_history`), sanitizeData(weightLog));

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
            if (value === undefined) value = null;
            const docRef = doc(db, `artifacts/${APP_ID}/users/${userId}/data`, 'workout_defaults');
            const currentDefaults = await fetchUserDefaults(userId);

            if (!currentDefaults[exerciseId]) currentDefaults[exerciseId] = [];
            if (!currentDefaults[exerciseId][setIndex]) currentDefaults[exerciseId][setIndex] = {};

            currentDefaults[exerciseId][setIndex][field] = value;
            await setDoc(docRef, sanitizeData(currentDefaults), { merge: true });
        } catch (e) { console.error("Defaults Save Error:", e); }
    };

    const calculateCompletedVolume = (session) => {
        if (!session) return 0;
        let total = 0;
        session.exercises.forEach(ex => {
            const multiplier = ex.multiplier || 1;
            ex.sets.forEach(set => {
                if (set.completed && set.weight > 0 && set.reps > 0) {
                    total += (set.weight * set.reps * multiplier);
                }
            });
        });
        return total;
    };

    const calculateTotalVolume = (session) => {
        if (!session) return 0;
        let total = 0;
        session.exercises.forEach(ex => {
            const multiplier = ex.multiplier || 1;
            ex.sets.forEach(set => {
                if (set.weight > 0 && set.reps > 0) {
                    total += (set.weight * set.reps * multiplier);
                }
            });
        });
        return total;
    };

    const openRestTimer = (seconds, exIndex) => {
        setRestTimer({ isOpen: true, timeLeft: seconds, totalTime: seconds, activeExerciseIndex: exIndex });
    };

    const closeRestTimer = () => {
        setRestTimer({ isOpen: false, timeLeft: 0, totalTime: 0, activeExerciseIndex: null });
    };

    const addRestTime = (seconds) => {
        setRestTimer(prev => ({
            ...prev,
            timeLeft: prev.timeLeft + seconds,
            totalTime: prev.totalTime + seconds
        }));
    };

    const scrollToExercise = (index) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const child = container.children[index];
            if (child) child.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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

    // --- FUNZIONI DI UTILITÀ PER LE DATE (CORRETTE PER SETTIMANA ISO) ---
    const getWeekStartEnd = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        // Lunedì è il giorno 1. Se è domenica (0), torna indietro di 6 giorni. Altrimenti torna indietro di (day - 1).
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);

        const monday = new Date(d);
        monday.setDate(diff);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return { monday, sunday };
    };

    const formatDateShort = (date) => {
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    // --- CARICAMENTO STORICO E GRAFICI ---
    const loadHistory = async (isInitial = false) => {
        if (!user || ['mock-user', 'test-user'].includes(user.uid)) return;

        setLoadingHistory(true);
        try {
            let q = query(
                collection(db, `artifacts/${APP_ID}/users/${user.uid}/workout_history`),
                orderBy("date", "desc"),
                limit(20)
            );

            if (!isInitial && lastVisibleLog) {
                q = query(q, startAfter(lastVisibleLog));
            }

            const querySnapshot = await getDocs(q);
            const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // FIX ORDINAMENTO: Data + Ora
            logs.sort((a, b) => {
                const dateA = new Date(`${a.date}T${a.startTime}`);
                const dateB = new Date(`${b.date}T${b.startTime}`);
                return dateB - dateA;
            });

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
                limit(100)
            );
            const querySnapshot = await getDocs(q);
            const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // AGGREGAZIONE SETTIMANALE (Lun-Dom)
            const weeklyAggregation = {};

            logs.forEach(log => {
                const logDate = new Date(log.date);
                const { monday, sunday } = getWeekStartEnd(logDate);

                // Chiave univoca per ordinamento: YYYY-MM-DD del Lunedì
                // Etichetta visualizzata: DD/MM-DD/MM
                const sortKey = monday.toISOString().split('T')[0];
                const label = `${formatDateShort(monday)}-${formatDateShort(sunday)}`;

                if (!weeklyAggregation[sortKey]) {
                    weeklyAggregation[sortKey] = { label, value: 0 };
                }
                weeklyAggregation[sortKey].value += (log.totalTonnage || 0);
            });

            // Ordina per chiave data (dal più vecchio al più recente) e prendi gli ultimi 8
            const sortedKeys = Object.keys(weeklyAggregation).sort();
            const last8Weeks = sortedKeys.slice(-8);

            setWeeklyVolumeData({
                labels: last8Weeks.map(k => weeklyAggregation[k].label),
                datasets: [{
                    label: 'Volume Totale (Kg)',
                    data: last8Weeks.map(k => weeklyAggregation[k].value),
                    backgroundColor: 'rgba(59, 130, 246, 0.5)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                }]
            });

            // Chart Mensile
            const monthlyAggregation = {};
            logs.forEach(log => {
                const d = new Date(log.date);
                const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
                if (!monthlyAggregation[key]) monthlyAggregation[key] = 0;
                monthlyAggregation[key] += (log.totalTonnage || 0);
            });
            const sortedMonths = Object.keys(monthlyAggregation).sort().slice(-6);

            setMonthlyVolumeData({
                labels: sortedMonths,
                datasets: [{
                    label: 'Volume (Kg)',
                    data: sortedMonths.map(m => monthlyAggregation[m]),
                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                }]
            });

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

        } catch (e) { console.error(e); }
    };

    const handleDeleteLog = async (logId) => {
        if (!confirm("Eliminare definitivamente questa sessione?")) return;
        try {
            await deleteDoc(doc(db, `artifacts/${APP_ID}/users/${user.uid}/workout_history`, logId));
            setHistoryLogs(prev => prev.filter(l => l.id !== logId));
            loadChartData();
            showToast("Sessione eliminata.", "success");
        } catch (e) {
            console.error("Delete error:", e);
            showToast("Errore eliminazione.", "error");
        }
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
            openRestTimer(seconds, exerciseIndex);
        }
    };

    const handleAddSet = (exerciseIndex) => {
        if (!activeSession) return;

        const updatedSession = { ...activeSession };
        const exercise = updatedSession.exercises[exerciseIndex];

        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet = lastSet ? { ...lastSet, completed: false } : { reps: 10, weight: 0, completed: false };

        exercise.sets.push(newSet);

        setActiveSession(updatedSession);
        saveSessionLocally(updatedSession);
        showToast("Serie aggiunta!", 'success');
    };

    const handleStartFreeWorkout = async () => {
        const freeSession = { name: "Allenamento Libero", exercises: [], isFree: true };
        setActiveSession(freeSession);
        setStartTime(new Date());
        setMaxSessionTonnage(0);
        setView('active-workout');
        setFinishModalOpen(false);
        setRating(0);
        saveSessionLocally(freeSession);
        showToast("Scegli i tuoi esercizi!", 'info');
        if ('wakeLock' in navigator) {
            try { wakeLockRef.current = await navigator.wakeLock.request('screen'); } catch (err) { console.error(err); }
        }
    };

    const handleAddExerciseFromPicker = async (exercise) => {
        const ex = JSON.parse(JSON.stringify(exercise));
        if (user && !['mock-user', 'test-user'].includes(user.uid)) {
            try {
                const userDefaults = await fetchUserDefaults(user.uid);
                if (userDefaults[ex.id]) {
                    ex.sets = ex.sets.map((set, idx) => {
                        const savedSet = userDefaults[ex.id][idx];
                        return savedSet ? { ...set, weight: savedSet.weight ?? set.weight, reps: savedSet.reps ?? set.reps } : set;
                    });
                }
            } catch (e) { /* usa i default del template */ }
        }
        const updatedSession = { ...activeSession, exercises: [...activeSession.exercises, ex] };
        setActiveSession(updatedSession);
        saveSessionLocally(updatedSession);
        closePicker();
        showToast(`${ex.name} aggiunto!`, 'success');
    };

    // --- CUSTOM EXERCISES ---
    const isRealUser = (u) => u && !['mock-user', 'test-user'].includes(u.uid);

    const fetchCustomExercises = async (userId) => {
        try {
            const snap = await getDocs(collection(db, `artifacts/${APP_ID}/users/${userId}/custom_exercises`));
            return snap.docs.map(d => ({ ...d.data(), id: `custom_${d.id}`, _docId: d.id, isCustom: true }));
        } catch (e) { console.error("Custom Ex fetch error:", e); return []; }
    };

    const buildSetsFromDefaults = (numSets, defaultReps, defaultWeight) =>
        Array.from({ length: numSets }, () => ({ reps: Number(defaultReps), weight: Number(defaultWeight), completed: false }));

    const saveCustomExercise = async () => {
        if (!isRealUser(user)) { showToast("Funzione disponibile solo con account", 'error'); return; }
        const f = customExerciseModal.form;
        if (!f?.name?.trim()) { showToast("Inserisci un nome", 'error'); return; }
        if (!f?.muscleGroup) { showToast("Seleziona un gruppo muscolare", 'error'); return; }

        const payload = {
            name: f.name.trim(),
            muscleGroup: f.muscleGroup,
            numSets: Number(f.numSets) || 4,
            defaultReps: Number(f.defaultReps) || 10,
            defaultWeight: Number(f.defaultWeight) || 20,
            rest: `${Number(f.restSeconds) || 90}s`,
            multiplier: Number(f.multiplier) || 1,
            notes: f.notes || '',
            technogymRef: f.technogymRef || null,
            updatedAt: new Date().toISOString(),
        };
        try {
            const collRef = collection(db, `artifacts/${APP_ID}/users/${user.uid}/custom_exercises`);
            if (customExerciseModal.editingId) {
                await setDoc(doc(collRef, customExerciseModal.editingId), sanitizeData(payload), { merge: true });
                showToast("Esercizio aggiornato!", 'success');
            } else {
                await addDoc(collRef, sanitizeData(payload));
                showToast("Esercizio creato!", 'success');
            }
            const updated = await fetchCustomExercises(user.uid);
            setCustomExercises(updated);
            setCustomExerciseModal({ open: false, editingId: null, form: null });
        } catch (e) {
            console.error("Custom Ex save error:", e);
            showToast("Errore salvataggio", 'error');
        }
    };

    const deleteCustomExercise = async (docId) => {
        if (!isRealUser(user)) return;
        if (!confirm("Eliminare questo esercizio?")) return;
        try {
            await deleteDoc(doc(db, `artifacts/${APP_ID}/users/${user.uid}/custom_exercises`, docId));
            setCustomExercises(prev => prev.filter(c => c._docId !== docId));
            showToast("Esercizio eliminato", 'success');
        } catch (e) { console.error(e); showToast("Errore eliminazione", 'error'); }
    };

    const openCreateCustomExercise = (presetGroup = null) => {
        if (!isRealUser(user)) { showToast("Disponibile solo con account", 'error'); return; }
        setCustomExerciseModal({
            open: true,
            editingId: null,
            form: {
                name: '', muscleGroup: presetGroup || '', numSets: 4, defaultReps: 10,
                defaultWeight: 20, restSeconds: 90, multiplier: 1, notes: '', technogymRef: null,
            }
        });
    };

    const openEditCustomExercise = (custom) => {
        setCustomExerciseModal({
            open: true,
            editingId: custom._docId,
            form: {
                name: custom.name,
                muscleGroup: custom.muscleGroup,
                numSets: custom.numSets || (custom.sets?.length ?? 4),
                defaultReps: custom.defaultReps || custom.sets?.[0]?.reps || 10,
                defaultWeight: custom.defaultWeight || custom.sets?.[0]?.weight || 20,
                restSeconds: parseRestTime(custom.rest),
                multiplier: custom.multiplier || 1,
                notes: custom.notes || '',
                technogymRef: custom.technogymRef || null,
            }
        });
    };

    // Materializza un custom exercise (con sets generati) per il picker / sessione
    const materializeCustomExercise = (custom) => ({
        id: custom.id,
        name: custom.name,
        muscleGroup: custom.muscleGroup,
        sets: buildSetsFromDefaults(custom.numSets || 4, custom.defaultReps || 10, custom.defaultWeight || 20),
        rest: custom.rest || '90s',
        multiplier: custom.multiplier || 1,
        imageUrl: '',
        notes: custom.notes || '',
        isCustom: true,
    });

    const openPickerForAdd = () => {
        setPickerFilterGroup(null);
        setSubstituteExIndex(null);
        setExercisePickerOpen(true);
    };

    const openPickerForSubstitute = (exIndex) => {
        const ex = activeSession.exercises[exIndex];
        const group = ex.isCustom ? ex.muscleGroup : (EXERCISE_GROUPS[ex.id] || null);
        setPickerFilterGroup(group);
        setSubstituteExIndex(exIndex);
        setExercisePickerOpen(true);
    };

    const closePicker = () => {
        setExercisePickerOpen(false);
        setPickerFilterGroup(null);
        setSubstituteExIndex(null);
    };

    const handleNoteEdit = (exerciseIndex) => {
        if (!activeSession) return;
        const note = activeSession.exercises[exerciseIndex].notes || "";
        setNoteModal({ isOpen: true, exerciseIndex, text: note });
    };

    const saveNote = () => {
        if (noteModal.exerciseIndex === null) return;

        const updatedSession = { ...activeSession };
        updatedSession.exercises[noteModal.exerciseIndex].notes = noteModal.text;

        setActiveSession(updatedSession);
        saveSessionLocally(updatedSession);
        setNoteModal({ isOpen: false, exerciseIndex: null, text: '' });
        showToast("Nota salvata!", 'success');
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

    // --- HANDLERS UI ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setAuthError('');
        try { await signInWithEmailAndPassword(auth, email, password); }
        catch (err) {
            if (err.code === 'auth/network-request-failed' || err.message.includes('iframe')) {
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

        // Recupera MAX tonnellaggio
        setMaxSessionTonnage(0);
        if (user && user.uid !== 'mock-user') {
            try {
                const q = query(
                    collection(db, `artifacts/${APP_ID}/users/${user.uid}/workout_history`),
                    orderBy("date", "desc"),
                    limit(50)
                );
                const snapshot = await getDocs(q);

                const relevantWorkouts = snapshot.docs
                    .map(d => d.data())
                    .filter(w => w.dayName === dayTemplate.name);

                if (relevantWorkouts.length > 0) {
                    const maxVol = Math.max(...relevantWorkouts.map(w => w.totalTonnage || 0));
                    setMaxSessionTonnage(maxVol);
                }
            } catch (e) { console.error("Error fetching max session:", e); }

            // Carica Defaults
            const userDefaults = await fetchUserDefaults(user.uid);
            sessionData.exercises = sessionData.exercises.map(ex => {
                if (userDefaults[ex.id]) {
                    const savedSetsData = userDefaults[ex.id];
                    const mergedSets = ex.sets.map((set, idx) => {
                        const savedSet = savedSetsData[idx];
                        if (savedSet) {
                            return {
                                ...set,
                                weight: savedSet.weight !== undefined ? savedSet.weight : set.weight,
                                reps: savedSet.reps !== undefined ? savedSet.reps : set.reps
                            };
                        }
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

        // WAKE LOCK
        if ('wakeLock' in navigator) {
            try {
                wakeLockRef.current = await navigator.wakeLock.request('screen');
            } catch (err) { console.error(err); }
        }
    };

    const handleSaveAndExit = async () => {
        const totalTonnage = calculateCompletedVolume(activeSession);
        const endTime = new Date();

        // FIX TIMER: Calcolo reale (Differenza tra ora e start)
        // Se startTime è una stringa (recuperata da localStorage), converti in Date
        const startDt = new Date(startTime);
        const durationSeconds = Math.floor((endTime - startDt) / 1000);

        const formatTime = (date) => {
            return date.toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        };

        const workoutLog = {
            date: startDt.toISOString().split('T')[0],
            dayName: activeSession.name,
            durationDisplay: formatDuration(durationSeconds),
            durationSeconds: durationSeconds,
            startTime: formatTime(startDt),
            endTime: formatTime(endTime),
            estimatedCalories: Math.round(totalTonnage * 0.05 + durationSeconds / 60 * 4),
            rating: rating,
            totalTonnage: totalTonnage
        };

        if (user.uid !== 'mock-user' && user.uid !== 'test-user') {
            try {
                await addDoc(collection(db, `artifacts/${APP_ID}/users/${user.uid}/workout_history`), sanitizeData(workoutLog));
                showToast("Salvato con successo!", 'success');
            } catch (e) { console.error("Save error:", e); showToast("Errore salvataggio!", 'error'); return; }
        } else { showToast("Salvato (Mock)", 'success'); }

        if (wakeLockRef.current) {
            wakeLockRef.current.release().then(() => { wakeLockRef.current = null; });
        }

        clearLocalSession();
        setActiveSession(null);
        setStartTime(null);
        setFinishModalOpen(false);
        setView('dashboard');
    };

    const handleCancelWorkout = () => {
        if (!confirm("Annullare?")) return;
        if (wakeLockRef.current) {
            wakeLockRef.current.release().then(() => { wakeLockRef.current = null; });
        }
        setActiveSession(null);
        clearLocalSession();
        setView('dashboard');
    };

    // --- EFFETTI DI INIZIALIZZAZIONE ---
    useEffect(() => {
        let unsubscribe = () => { };
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
        if (user) {
            fetchUserProfile(user.uid);
            if (isRealUser(user)) {
                fetchCustomExercises(user.uid).then(setCustomExercises);
            } else {
                setCustomExercises([]);
            }
        }
    }, [user]);

    useEffect(() => {
        if (user && view === 'dashboard' && !activeSession) {
            const saved = localStorage.getItem(`active_session_${user.uid}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (confirm(`Riprendere "${parsed.session.name}"?`)) {
                        setActiveSession(parsed.session);
                        // Ripristina startTime come oggetto Date reale
                        setStartTime(new Date(parsed.startTime));
                        // Non serve ripristinare il timer numerico, si ricalcola
                        setView('active-workout');
                    } else { clearLocalSession(); }
                } catch (e) { clearLocalSession(); }
            }
        }
    }, [user]);

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ left: 0, behavior: 'instant' });
        }
    }, [activeDayId]);

    // FIX TIMER: Calcola differenza reale ogni secondo
    useEffect(() => {
        let interval;
        if (view === 'active-workout' && !finishModalOpen && startTime) {
            const start = new Date(startTime).getTime();
            interval = setInterval(() => {
                const now = Date.now();
                const diff = Math.floor((now - start) / 1000);
                setSessionTimer(diff);
                // Salva stato ogni 10s
                if (diff % 10 === 0 && activeSession) saveSessionLocally(activeSession);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [view, finishModalOpen, startTime]);

    useEffect(() => {
        let interval;
        if (restTimer.isOpen && restTimer.timeLeft > 0) {
            interval = setInterval(() => {
                setRestTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
            }, 1000);
        }
        else if (restTimer.isOpen && restTimer.timeLeft <= 0) {
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            playTimerEndSound();
            closeRestTimer();
        }
        return () => clearInterval(interval);
    }, [restTimer.isOpen, restTimer.timeLeft]);

    // Gestione caricamento dati Storico/Grafici al cambio view
    useEffect(() => {
        if (view === 'history') {
            if (!['mock-user', 'test-user'].includes(user?.uid)) {
                if (historyLogs.length === 0) loadHistory(true);
                loadChartData();
            } else {
                // Mock
                const mData = {
                    labels: ['29/12-04/01', '05/01-11/01'],
                    datasets: [{ label: 'Volume (Kg)', data: [12500, 14200], backgroundColor: 'rgba(59, 130, 246, 0.5)' }]
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
                        <button type="button" onClick={() => setUser({ uid: 'mock', email: 'demo' })} className="text-sm text-gray-500 hover:text-white underline">Modalità Demo</button>
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
                                <div className="flex gap-2 text-xs font-mono">
                                    <span className="text-green-400">Vol: {calculateCompletedVolume(activeSession)} kg</span>
                                    {maxSessionTonnage > 0 && (
                                        <span className="text-gray-500 border-l border-gray-700 pl-2">
                                            Max: {maxSessionTonnage} kg
                                        </span>
                                    )}
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
                            <div className="text-center text-xs text-gray-600 mt-4">v{APP_VERSION}</div> {/* NUOVO: Versione App */}
                        </div>
                    </div>
                </div>
            )}

            {/* EXERCISE PICKER MODAL */}
            {exercisePickerOpen && activeSession && (
                <div className="fixed inset-0 z-[70] bg-gray-950 flex flex-col animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800 flex-shrink-0 bg-gray-950">
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                {substituteExIndex !== null
                                    ? <><ArrowLeftRight className="w-5 h-5 text-orange-400" /> Sostituisci Esercizio</>
                                    : <><Dumbbell className="w-5 h-5 text-blue-500" /> Aggiungi Esercizio</>}
                            </h3>
                            {pickerFilterGroup && (
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider">Filtro: {pickerFilterGroup}</span>
                            )}
                        </div>
                        <button onClick={closePicker} className="p-2 text-gray-400 hover:text-white bg-gray-800 rounded-full">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {(() => {
                            const addedIds = new Set(activeSession.exercises.map(e => e.id));
                            const customMaterialized = customExercises.map(materializeCustomExercise);
                            const merged = [...FREE_WORKOUT_CATALOG, ...customMaterialized];
                            const available = merged.filter(ex =>
                                !addedIds.has(ex.id) &&
                                (!pickerFilterGroup || ex.muscleGroup === pickerFilterGroup)
                            );
                            const groupsToShow = pickerFilterGroup ? [pickerFilterGroup] : MUSCLE_GROUP_ORDER;
                            const customMap = new Map(customExercises.map(c => [`custom_${c._docId}`, c]));

                            return (
                                <>
                                    {available.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                                            <CheckCircle2 className="w-12 h-12 mb-3 text-green-800" />
                                            <p className="font-semibold">Nessun esercizio disponibile</p>
                                        </div>
                                    )}
                                    {groupsToShow.map(group => {
                                        const groupExs = available.filter(ex => ex.muscleGroup === group);
                                        if (groupExs.length === 0) return null;
                                        return (
                                            <div key={group}>
                                                <div className="px-4 py-2 bg-gray-900/80 border-b border-gray-800 sticky top-0 z-10">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{group}</span>
                                                </div>
                                                {groupExs.map(ex => {
                                                    const isCustom = ex.isCustom;
                                                    const customSrc = isCustom ? customMap.get(ex.id) : null;
                                                    return (
                                                        <div key={ex.id} className="flex items-center gap-2 px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors">
                                                            <button
                                                                onClick={() => handleAddExerciseFromPicker(ex)}
                                                                className="flex-1 flex items-center gap-3 text-left min-w-0"
                                                            >
                                                                <img src={getImageUrl(ex.imageUrl, ex.name)} alt={ex.name} className="w-12 h-12 object-cover rounded-xl flex-shrink-0 bg-gray-800" />
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-white text-sm font-semibold truncate flex items-center gap-1.5">
                                                                        {ex.name}
                                                                        {isCustom && <span className="text-[8px] bg-purple-700/60 text-purple-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Custom</span>}
                                                                        {ex.multiplier > 1 && <span className="text-[8px] bg-yellow-500 text-black px-1 rounded font-extrabold">x{ex.multiplier}</span>}
                                                                    </div>
                                                                    <div className="text-gray-500 text-xs mt-0.5">{ex.sets.length} serie · {ex.sets[0]?.weight}kg · {ex.rest}</div>
                                                                </div>
                                                                <Plus className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                                            </button>
                                                            {isCustom && customSrc && (
                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                    <button onClick={() => openEditCustomExercise(customSrc)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Modifica">
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => deleteCustomExercise(customSrc._docId)} className="p-2 text-red-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg" title="Elimina">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                    {isRealUser(user) && (
                                        <button
                                            onClick={() => openCreateCustomExercise(pickerFilterGroup)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-4 m-4 border-2 border-dashed border-purple-700/60 bg-purple-900/10 text-purple-400 hover:bg-purple-900/20 rounded-2xl font-bold text-sm"
                                            style={{ width: 'calc(100% - 2rem)' }}
                                        >
                                            <Plus className="w-5 h-5" /> Crea Nuovo Esercizio
                                        </button>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* CUSTOM EXERCISE FORM MODAL */}
            {customExerciseModal.open && (
                <div className="fixed inset-0 z-[80] bg-black/95 flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in">
                    <div className="w-full max-w-md bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-800 p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <button onClick={() => setCustomExerciseModal({ open: false, editingId: null, form: null })} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            {customExerciseModal.editingId ? <><Pencil className="w-5 h-5 text-purple-400" /> Modifica Esercizio</> : <><Plus className="w-5 h-5 text-purple-400" /> Nuovo Esercizio</>}
                        </h3>
                        {(() => {
                            const f = customExerciseModal.form;
                            const upd = (k, v) => setCustomExerciseModal(prev => ({ ...prev, form: { ...prev.form, [k]: v } }));
                            const inputCls = "w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white focus:border-blue-500 focus:outline-none";
                            const labelCls = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1";
                            return (
                                <div className="space-y-3">
                                    <div>
                                        <label className={labelCls}>Nome esercizio *</label>
                                        <input type="text" value={f.name} onChange={(e) => upd('name', e.target.value)} className={inputCls} placeholder="Es. Pectoral Machine" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Gruppo muscolare *</label>
                                        <select value={f.muscleGroup} onChange={(e) => upd('muscleGroup', e.target.value)} className={inputCls}>
                                            <option value="">Seleziona...</option>
                                            {MUSCLE_GROUP_ORDER.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className={labelCls}>Serie</label>
                                            <input type="number" min="1" max="10" value={f.numSets} onChange={(e) => upd('numSets', e.target.value)} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Reps</label>
                                            <input type="number" min="1" value={f.defaultReps} onChange={(e) => upd('defaultReps', e.target.value)} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Peso (kg)</label>
                                            <input type="number" min="0" value={f.defaultWeight} onChange={(e) => upd('defaultWeight', e.target.value)} className={inputCls} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className={labelCls}>Recupero (s)</label>
                                            <input type="number" min="0" value={f.restSeconds} onChange={(e) => upd('restSeconds', e.target.value)} className={inputCls} />
                                        </div>
                                        <div>
                                            <label className={labelCls}>Moltiplicatore</label>
                                            <select value={f.multiplier} onChange={(e) => upd('multiplier', e.target.value)} className={inputCls}>
                                                <option value="1">x1</option>
                                                <option value="2">x2</option>
                                                <option value="3">x3</option>
                                                <option value="4">x4</option>
                                                <option value="5">x5</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Note (opzionale)</label>
                                        <textarea value={f.notes} onChange={(e) => upd('notes', e.target.value)} className={`${inputCls} h-16 resize-none`} />
                                    </div>
                                    <button onClick={saveCustomExercise} className="w-full py-3 mt-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                                        <Save className="w-4 h-4" /> {customExerciseModal.editingId ? 'Aggiorna' : 'Crea'}
                                    </button>
                                </div>
                            );
                        })()}
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
                    <div className="flex gap-4 w-full max-w-xs">
                        <button onClick={() => addRestTime(10)} className="flex-1 py-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 font-bold rounded-2xl border border-blue-600/30 flex items-center justify-center gap-2">
                            <Plus className="w-6 h-6" /> +10s
                        </button>
                        <button onClick={closeRestTimer} className="flex-1 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                            <SkipForward className="w-6 h-6" /> SALTA
                        </button>
                    </div>
                </div>
            )}

            {/* MODALE NOTA */}
            {noteModal.isOpen && (
                <div className="fixed inset-0 z-[70] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in">
                    <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl relative">
                        <button onClick={() => setNoteModal({ isOpen: false, exerciseIndex: null, text: '' })} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><StickyNote className="w-5 h-5 text-yellow-500" /> Nota Esercizio</h3>
                        <textarea
                            value={noteModal.text}
                            onChange={(e) => setNoteModal(prev => ({ ...prev, text: e.target.value }))}
                            className="w-full h-32 bg-gray-950 border border-gray-700 rounded-xl p-3 text-white focus:border-blue-500 focus:outline-none mb-4 resize-none"
                            placeholder="Scrivi qui la tua nota..."
                        />
                        <button onClick={saveNote} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg">Salva Nota</button>
                    </div>
                </div>
            )}

            {/* FULL SCREEN IMAGE MODAL */}
            {fullScreenImage && (
                <div className="fixed inset-0 z-[80] bg-black/95 flex flex-col items-center justify-center p-2 animate-in fade-in duration-200" onClick={() => setFullScreenImage(null)}>
                    <button className="absolute top-6 right-6 p-2 bg-gray-800 rounded-full text-white z-50">
                        <X className="w-6 h-6" />
                    </button>
                    <img src={fullScreenImage} alt="Esercizio Full Screen" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
                    <p className="text-gray-400 mt-4 text-sm">Tocca ovunque per chiudere</p>
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
                            {[1, 2, 3, 4, 5].map(star => (<button key={star} onClick={() => setRating(star)} className="p-2"><Star className={`w-10 h-10 ${star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} /></button>))}
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
                            <>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    {Object.keys(workoutData).map((dayId) => (
                                        <button key={dayId} onClick={() => setActiveDayId(dayId)} className={`px-4 py-3 text-sm font-bold rounded-xl transition-all border ${activeDayId === dayId ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>{workoutData[dayId].name.split(':')[0]}</button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleStartFreeWorkout}
                                    className="w-full px-4 py-3 mb-4 text-sm font-bold rounded-xl transition-all border border-dashed border-purple-700/60 bg-purple-900/10 text-purple-400 hover:bg-purple-900/20 flex items-center justify-center gap-2"
                                >
                                    <Shuffle className="w-4 h-4" /> Allenamento Libero
                                </button>
                            </>
                        )}

                        <div className="mb-6 flex justify-between items-end">
                            <h2 className="text-2xl font-bold text-white leading-none">{view === 'active-workout' ? activeSession.name : (workoutData[activeDayId].name.split(':')[1] || workoutData[activeDayId].name)}</h2>
                            {view === 'active-workout' && <div className="text-right text-xl font-mono font-bold text-green-400">{calculateCompletedVolume(activeSession)} <span className="text-sm text-gray-500">kg</span></div>}
                        </div>

                        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 no-scrollbar -mx-4 px-4" ref={scrollContainerRef}>
                            {(view === 'active-workout' ? activeSession.exercises : workoutData[activeDayId].exercises).map((exercise, exIndex) => (
                                <div key={exercise.id} className="snap-center shrink-0 w-[95vw] sm:w-[400px] bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-xl flex flex-col relative">
                                    {/* Immagine con Click Handler */}
                                    <div className="relative h-48 w-full bg-gray-800 cursor-pointer" onClick={() => setFullScreenImage(getImageUrl(exercise.imageUrl, exercise.name))}>
                                        <img src={getImageUrl(exercise.imageUrl, exercise.name)} alt={exercise.name} className="w-full h-full object-cover opacity-70" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-blue-950/60 to-transparent"></div>
                                        {/* Icona Zoom */}
                                        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm p-2 rounded-full border border-white/10 z-20">
                                            <Maximize2 className="w-4 h-4 text-white/80" />
                                        </div>
                                        <div className="absolute bottom-4 left-5 right-5 z-10 flex justify-between items-end">
                                            <h3 className="text-xl font-bold text-white leading-tight shadow-black drop-shadow-md max-w-[80%]">{exercise.name}</h3>
                                            <div className="bg-gray-900/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-mono text-blue-300 border border-white/10">{exIndex + 1}/{(view === 'active-workout' ? activeSession.exercises : workoutData[activeDayId].exercises).length}</div>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col gap-4">
                                        <div className="space-y-1">
                                            <div className={`grid ${view === 'active-workout' ? 'grid-cols-5' : 'grid-cols-4'} text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center px-2 mb-1`}>
                                                <div>#</div>
                                                <div className="flex items-center justify-center">
                                                    Kg
                                                    {/* Visual indicator for multiplier */}
                                                    {exercise.multiplier > 1 && (
                                                        <span className="ml-1 text-[8px] bg-yellow-500 text-black px-1 rounded font-extrabold">x{exercise.multiplier}</span>
                                                    )}
                                                </div>
                                                <div>Reps</div>
                                                {view === 'active-workout' && <div>Fatto</div>}<div>Stato</div>
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

                                            {/* Action Buttons: Add Set & Edit Note */}
                                            {view === 'active-workout' && (
                                                <div className="pt-2 flex justify-center gap-4">
                                                    <button
                                                        onClick={() => handleAddSet(exIndex)}
                                                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-semibold border border-blue-900/50 px-3 py-1.5 rounded-full hover:bg-blue-900/20 transition-all"
                                                    >
                                                        <Plus className="w-3 h-3" /> Aggiungi Serie
                                                    </button>
                                                    <button
                                                        onClick={() => handleNoteEdit(exIndex)}
                                                        className={`flex items-center gap-1 text-xs font-semibold border px-3 py-1.5 rounded-full transition-all ${exercise.notes ? 'text-yellow-400 border-yellow-900/50 bg-yellow-900/10' : 'text-gray-400 border-gray-700 hover:text-gray-300 hover:bg-gray-800'}`}
                                                    >
                                                        <StickyNote className={`w-3 h-3 ${exercise.notes ? 'fill-yellow-400' : ''}`} /> {exercise.notes ? 'Vedi Nota' : 'Aggiungi Nota'}
                                                    </button>
                                                    {isRealUser(user) && (
                                                        <button
                                                            onClick={() => openPickerForSubstitute(exIndex)}
                                                            className="flex items-center gap-1 text-xs font-semibold border border-orange-900/50 text-orange-400 hover:bg-orange-900/20 px-3 py-1.5 rounded-full transition-all"
                                                            title="Sostituisci con un altro esercizio dello stesso gruppo"
                                                        >
                                                            <ArrowLeftRight className="w-3 h-3" /> Sostituisci
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {view === 'active-workout' && activeSession.isFree && activeSession.exercises.length === 0 && (
                                <div className="snap-center shrink-0 w-[95vw] sm:w-[400px] flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-gray-800 rounded-3xl bg-gray-900/50">
                                    <div className="bg-gray-800 rounded-full p-5 mb-4">
                                        <Shuffle className="w-10 h-10 text-gray-600" />
                                    </div>
                                    <p className="text-gray-500 font-semibold text-sm">Nessun esercizio</p>
                                    <p className="text-gray-700 text-xs mt-1">Usa + per aggiungere dal catalogo</p>
                                </div>
                            )}
                            <div className="shrink-0 w-2"></div>
                        </div>

                        {view === 'active-workout' && activeSession.isFree && (
                            <div className="fixed bottom-6 left-6 z-30">
                                <button onClick={() => setExercisePickerOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center transform active:scale-95 transition-all">
                                    <Plus className="w-8 h-8" />
                                </button>
                            </div>
                        )}

                        {view === 'dashboard' ? (
                            <div className="fixed bottom-6 right-6 z-30">
                                <button onClick={handleStartWorkout} className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center transform active:scale-95 transition-all"><Play className="w-8 h-8 fill-current ml-1" /></button>
                            </div>
                        ) : (
                            <div className="fixed bottom-6 right-6 z-30">
                                <button onClick={() => { if (activeSession.isFree && activeSession.exercises.length === 0) { showToast("Aggiungi almeno un esercizio!", 'error'); return; } setFinishModalOpen(true); }} className="bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-lg shadow-red-900/40 flex items-center justify-center transform active:scale-95 transition-all"><Save className="w-8 h-8" /></button>
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
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-white text-lg">{log.dayName}</h3>
                                                    {log.dayName === "Allenamento Libero" && (
                                                        <span className="bg-purple-800/50 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-700/50 uppercase tracking-wide">LIBERO</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 capitalize">{new Date(log.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} • {log.startTime}</p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-green-400 font-mono font-bold text-lg">{log.totalTonnage} <span className="text-xs text-gray-500">Kg</span></div>
                                                <div className="flex justify-end mt-1">
                                                    <div className="flex mr-2">{[...Array(5)].map((_, i) => (<Star key={i} className={`w-3 h-3 ${i < log.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-800'}`} />))}</div>
                                                    {/* Tasto Cancella */}
                                                    <button onClick={() => handleDeleteLog(log.id)} className="p-1 text-red-500 hover:bg-red-500/10 rounded"><Trash2 className="w-4 h-4" /></button>
                                                </div>
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
                            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center relative group">
                                <span className="block text-gray-400 text-xs uppercase mb-1">Peso</span>
                                {isEditingProfile ? (
                                    <div className="flex items-center justify-center gap-1">
                                        <input
                                            type="number"
                                            value={userProfile.weight}
                                            onChange={(e) => setUserProfile({ ...userProfile, weight: e.target.value })}
                                            className="w-16 bg-gray-800 border border-blue-500 rounded text-center text-white font-bold py-1 focus:outline-none"
                                        />
                                        <span className="text-sm font-normal text-gray-500">kg</span>
                                    </div>
                                ) : (
                                    <span className="text-xl font-bold text-white">{userProfile.weight} <span className="text-sm font-normal text-gray-500">kg</span></span>
                                )}
                            </div>

                            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-center relative group">
                                <span className="block text-gray-400 text-xs uppercase mb-1">Sesso</span>
                                {isEditingProfile ? (
                                    <select
                                        value={userProfile.sex}
                                        onChange={(e) => setUserProfile({ ...userProfile, sex: e.target.value })}
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
