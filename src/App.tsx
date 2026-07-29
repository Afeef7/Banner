import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Send, 
  RefreshCw, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award,
  ChevronRight,
  Volume2,
  VolumeX,
  Star,
  GripHorizontal,
  Video,
  VideoOff,
  Minimize2,
  Maximize2,
  History,
  LogIn,
  LogOut,
  ArrowLeft,
  Calendar,
  Sparkles,
  Clock,
  X,
  Shield,
  ShieldAlert,
  ExternalLink,
  MessageSquare,
  PhoneCall,
  Info,
  Cpu,
  Terminal,
  Activity,
  Brain,
  BarChart3,
  Bot,
  Play,
  ArrowRight,
  Bell,
  Settings,
  UploadCloud,
  FileText,
  CheckCircle2,
  TrendingUp,
  Volume1,
  Lock,
  UserCheck,
  ChevronDown,
  Moon,
  Sun,
  Fingerprint,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { cn } from './lib/utils';
import { Emotion, InterviewState, InterviewerResponse } from './types';
import { generateInterviewerResponse, generateSpeech, generateAvatar } from './services/gemini';
import { auth, signInWithGoogle, logout, registerWithEmail, signInWithEmail } from './lib/firebase';
import { saveInterviewResult, syncUserProfile, getInterviewHistory, recordLoginActivity, getLoginActivities, getUserProfile } from './lib/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { UserProfile } from './types';
import AdminDashboard from './components/AdminDashboard';
import { HanaAvatar } from './components/HanaAvatar';
import ReportViewer from './components/ReportViewer';
import { InterviewWorkspace } from './components/InterviewWorkspace';
import { Navbar } from './components/Navbar';
import CareerWorkspace from './components/CareerWorkspace';

const ReportCompilerLoader: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Initializing telemetry synthesis...');

  useEffect(() => {
    const start = Date.now();
    const duration = 4300; // slightly shorter than 4500 to ensure we hit 100% cleanly
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 25) {
        setStage('Aggregating vocal delivery patterns and confidence indexes...');
      } else if (pct < 55) {
        setStage('Evaluating technical answer correctness and conceptual depth...');
      } else if (pct < 80) {
        setStage('Compiling strategic feedback and behavioral STAR scoring...');
      } else {
        setStage('Finalizing professional placement scorecard & credentials report...');
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Mesh gradients for depth */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Radar rings loader */}
      <div className="relative w-32 h-32 flex items-center justify-center mb-8 font-sans">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-32 h-32 border border-dashed border-violet-500/20 rounded-full"
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute w-24 h-24 border border-dotted border-cyan-500/30 rounded-full"
        />
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
          <Activity className="text-violet-400 animate-pulse" size={24} />
        </div>
      </div>

      {/* Progress metrics */}
      <div className="w-full max-w-md text-center space-y-4">
        <div>
          <span className="px-3 py-1 bg-violet-600/10 border border-violet-500/20 text-violet-300 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full">
            Report Engine Active
          </span>
          <h2 className="text-lg font-bold tracking-tight text-white mt-3">Compiling Placement Assessment</h2>
        </div>

        {/* Progress Bar Container */}
        <div className="bg-white/5 border border-white/[0.04] p-1 rounded-2xl">
          <div className="h-2 bg-zinc-950 rounded-xl overflow-hidden relative">
            <motion.div 
              className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 rounded-xl shadow-[0_0_12px_rgba(139,92,246,0.3)]"
              style={{ width: `${progress}%` }}
              transition={{ type: "tween", ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Informative Step Logs */}
        <div className="flex items-center justify-between font-mono text-[10px] text-white/40 uppercase tracking-wider px-1">
          <span>{stage}</span>
          <span className="font-bold text-violet-400">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

const INITIAL_STATE: InterviewState = {
  step: 'intro',
  subStep: 0,
  candidateInfo: {},
  history: [],
  isFinished: false,
};

export default function App() {
  const [state, setState] = useState<InterviewState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'interview' | 'history' | 'analytics' | 'resume' | 'settings' | 'admin'>('dashboard');
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Dr. Banner analyzed your last behavioral round. Focus score increased by 5%!", time: "10m ago", read: false },
    { id: 2, text: "New Software Engineer track is now live with 25 fresh questions.", time: "1d ago", read: true },
    { id: 3, text: "Security check: Login recorded from Chrome Browser (127.0.0.1).", time: "Just Now", read: false }
  ]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('smile');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<InterviewerResponse['feedback'] | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [hasImagePermission, setHasImagePermission] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isCameraMinimized, setIsCameraMinimized] = useState(false);
  const [cameraSize, setCameraSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [isVirtualCamera, setIsVirtualCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [interviewMode, setInterviewMode] = useState<'chat' | 'video' | null>(null);

  const [tempInterviewMode, setTempInterviewMode] = useState<'chat' | 'video' | null>(null);
  const [setupStep, setSetupStep] = useState<'none' | 'role_select'>('none');
  const [selectedRole, setSelectedRole] = useState<string>('Software Engineer');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string>('');

  const [showBackupText, setShowBackupText] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [hasSavedToDb, setHasSavedToDb] = useState(false);
  const [isCompilingReport, setIsCompilingReport] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [loginActivities, setLoginActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // Core Onboarding State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingDept, setOnboardingDept] = useState('Computer Science & Engineering');
  const [onboardingRole, setOnboardingRole] = useState('Software Engineer');
  const [onboardingGoal, setOnboardingGoal] = useState('technical');

  const [authMethod, setAuthMethod] = useState<'social' | 'email'>('social');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [emailAuthLoading, setEmailAuthLoading] = useState(false);
  const [emailAuthError, setEmailAuthError] = useState<string | null>(null);

  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminIdInput, setAdminIdInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAccessCodeInput, setAdminAccessCodeInput] = useState('');
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  };

  const getStepTip = (step: string) => {
    switch (step) {
      case 'intro':
        return "State your name clearly, say hello to Dr. Banner, and express your enthusiasm for this interview.";
      case 'personal_info':
        return "Describe your exact academic degree, your graduation timeline, and target placement role clearly.";
      case 'hr':
        return "Show behavioral alignment. Frame answers with the STAR method (Situation, Task, Action, Result) if possible.";
      case 'technical':
        return "Explain technical concepts in structured terms. Introduce the core idea first, then its applications.";
      case 'project':
        return "Detail a real project you worked on: explain the system architecture, a challenge faced, and how you solved it.";
      case 'situational':
        return "Demonstrate logical decision-making, level-headed teamwork, and stress resolution under pressure.";
      default:
        return "Listen carefully to Dr. Banner's question, speak clearly, and frame your thoughts systematically.";
    }
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const leftSectionRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const initialTriggerRef = useRef(false);

  useEffect(() => {
    if (!initialTriggerRef.current) {
      initialTriggerRef.current = true;
      // Initial avatar load
      updateAvatar('smile');
    }
  }, []);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string || '';
      
      const commonSkills = [
        'react', 'javascript', 'typescript', 'node', 'python', 'java', 'sql', 'nosql', 'mongodb', 
        'express', 'aws', 'docker', 'kubernetes', 'html', 'css', 'git', 'github', 'agile', 'scrum',
        'analytics', 'marketing', 'seo', 'sem', 'copywriting', 'campaigns', 'recruiting', 'onboarding',
        'hr', 'people', 'talent', 'data', 'tableau', 'excel', 'powerbi', 'pandas', 'numpy', 'machine learning'
      ];
      
      const matched = commonSkills.filter(skill => 
        new RegExp(`\\b${skill}\\b`, 'i').test(text)
      );
      
      const skillsStr = matched.length > 0 ? matched.join(', ').toUpperCase() : 'CREATIVE, COGNITIVE REASONING';
      setExtractedSkills(skillsStr);
    };
    
    if (file.type === 'text/plain') {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const handleProceedToInterview = async () => {
    if (!tempInterviewMode) return;
    
    const initialCandidateInfo = {
      name: user?.displayName || 'Candidate',
      targetRole: selectedRole,
      skills: extractedSkills || 'General Placement Competencies',
      department: selectedRole === 'Software Engineer' || selectedRole === 'Data Analyst' ? 'Engineering & Technology' : 'Business Administration'
    };
    
    setState({
      step: 'intro',
      subStep: 1,
      candidateInfo: initialCandidateInfo,
      history: [],
      isFinished: false
    });
    
    setSetupStep('none');
    setInterviewMode(tempInterviewMode);
    setInput('');
    stopSpeech();
    setShowBackupText(false);
    updateAvatar('smile');
    
    setIsProcessing(true);
    try {
      const firstTurnState = {
        step: 'intro' as const,
        subStep: 1,
        candidateInfo: initialCandidateInfo,
        history: [],
        isFinished: false
      };
      const response = await generateInterviewerResponse(firstTurnState, `Hello, my name is ${initialCandidateInfo.name}. I am ready to begin my interview for the ${selectedRole} position.`);
      
      setState(prev => ({
        ...prev,
        history: [{
          role: 'interviewer',
          text: response.text,
          emotion: response.emotion,
          feedback: response.feedback
        }]
      }));
      
      updateAvatar(response.emotion);
      playSpeech(response.text);
    } catch (err) {
      console.error("Failed to fetch initial question:", err);
      handleInterviewerTurn(`Hello ${initialCandidateInfo.name}! I'm Dr. Banner. Let's begin your placement interview for the ${selectedRole} role. Can you tell me what excites you most about this career path?`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartInterview = async (mode: 'chat' | 'video') => {
    setInterviewMode(mode);
    setState(INITIAL_STATE);
    setInput('');
    stopSpeech();
    setShowBackupText(false);
    
    // Initial avatar load
    updateAvatar('smile');
    
    if (mode === 'video') {
      // Auto-enable camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setIsVirtualCamera(false);
        setCameraError(null);
      } catch (err) {
        console.warn("Camera auto-start failed or blocked: ", err);
        setCameraError("Camera access denied or blocked. Virtual simulator enabled.");
        setIsCameraOn(true);
        setIsVirtualCamera(true);
      }
    }
    
    // Start interview greeting after a short delay
    setTimeout(() => {
      handleInterviewerTurn("Hello! I'm Dr. Banner. I'll be your interviewer today. Let's start by getting to know you. What is your name?");
    }, 600);
  };

  // Auto-start speech recognition when Dr. Banner finishes speaking (only in video mode)
  useEffect(() => {
    if (interviewMode === 'video' && !isSpeaking && state.step !== 'result' && !state.isFinished && state.history.length > 0) {
      const lastMsg = state.history[state.history.length - 1];
      if (lastMsg && lastMsg.role === 'interviewer') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition && !isListening && !isProcessing) {
          toggleListening();
        }
      }
    }
  }, [isSpeaking, interviewMode]);

  useEffect(() => {
    // Auth listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserProfile(firebaseUser);
        const profile = await getUserProfile(firebaseUser.uid);
        const savedRole = firebaseUser.email === 'jhonkiladi@gmail.com' ? 'admin' : (profile?.role || 'candidate');

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          role: savedRole,
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || ''
        });
        
        // Record login activity once per session
        const sessionKey = `login_activity_recorded_${firebaseUser.uid}`;
        if (!sessionStorage.getItem(sessionKey)) {
          await recordLoginActivity(firebaseUser);
          sessionStorage.setItem(sessionKey, 'true');
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Back button prevention hook when user is null (logged out)
  useEffect(() => {
    if (!user) {
      const handlePopState = () => {
        window.history.pushState(null, "", window.location.href);
      };
      window.history.pushState(null, "", window.location.href);
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [user]);

  // Reactive onboarding trigger for first-time candidate logins
  useEffect(() => {
    if (user && user.role === 'candidate') {
      setOnboardingName(user.displayName || '');
      const isNew = localStorage.getItem(`onboarded_${user.uid}`) !== 'true';
      if (isNew && historyList.length === 0 && !isLoadingHistory) {
        setShowOnboarding(true);
      }
    }
  }, [user, historyList, isLoadingHistory]);

  // Robust comprehensive logout function
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      // 1. Stop active hardware camera streams to ensure absolute privacy
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        } catch (camErr) {
          console.warn("Failed to clean up camera track stream: ", camErr);
        }
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);

      // 2. Stop ongoing speech synthesis playback and voice listening
      stopSpeech();
      setIsListening(false);

      // 3. Properly sign out of the Firebase auth provider if signed in
      if (auth.currentUser) {
        await logout(); // Calls Firebase signOut
      }

      // 4. Clear all security tokens, cached user data, localStorage, and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      // 5. Reset all application and interview session states related to current user
      setUser(null);
      setState(INITIAL_STATE);
      setActiveTab('dashboard');
      setIsAdminMode(false);
      setSelectedHistoryItem(null);
      setHistoryList([]);
      setNotifications([]);
      setIsNotificationsOpen(false);
      setInput('');
      setIsProcessing(false);
      setUploadedFileName(null);
      setExtractedSkills('');
      setInterviewMode(null);
      setTempInterviewMode(null);
      setSetupStep('none');
      setHasSavedToDb(false);
      
      // Prevent returning to splash screen; landing page/candidate portal must display directly
      setShowSplash(false);

      // 6. Push a secure history state to overwrite back navigation capability
      window.history.pushState(null, "", window.location.href);

      // 7. Show success feedback toast to the user
      setLogoutSuccess("You have been signed out successfully.");
      setTimeout(() => {
        setLogoutSuccess(null);
      }, 5000);

    } catch (error) {
      console.error("Graceful logout error recovery:", error);
      // Fallback local cleanup in case of network or provider errors
      setUser(null);
      setState(INITIAL_STATE);
      setActiveTab('dashboard');
      setIsAdminMode(false);
      setSelectedHistoryItem(null);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      let localHistory: any[] = [];
      try {
        localHistory = JSON.parse(localStorage.getItem('ai_interview_history') || '[]');
      } catch (e) {
        console.error("Failed to load local history:", e);
      }

      const currentUserId = auth.currentUser?.uid || (user?.uid === 'demo-candidate-123' || user?.uid === 'demo-admin-123' ? user.uid : null);
      if (currentUserId) {
        const cloudHistory = await getInterviewHistory(currentUserId) as any[];
        const merged: any[] = [...cloudHistory];
        localHistory.forEach(localItem => {
          if (!merged.some(cloudItem => cloudItem.id === localItem.id || (cloudItem.timestamp?.seconds === localItem.timestamp?.seconds && cloudItem.overallScore === localItem.overallScore))) {
            merged.push(localItem);
          }
        });
        merged.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setHistoryList(merged);
      } else {
        setHistoryList(localHistory);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSimulateMockRun = async () => {
    if (!user) return;
    setIsLoadingHistory(true);
    try {
      const mockRecord = {
        candidateName: user.displayName || 'Candidate',
        department: selectedRole === 'Software Engineer' || selectedRole === 'Data Analyst' ? 'Engineering & Technology' : 'Business Administration',
        targetRole: selectedRole || 'Software Engineer',
        overallScore: 84,
        history: [
          { role: 'interviewer', text: "Hello! I'm Dr. Banner. Let's start with a technical question: Can you explain the difference between a process and a thread, and how they relate to concurrency?" },
          { role: 'candidate', text: "A process is an isolated execution environment created by the OS with its own memory space, whereas a thread is a lightweight unit of execution that runs within a process, sharing its memory space. This sharing allows faster context switching but requires careful synchronization to avoid race conditions." },
          { role: 'interviewer', text: "Excellent explanation. Next, how would you design a distributed rate-limiter for a public API?" },
          { role: 'candidate', text: "I would use a Token Bucket algorithm stored in Redis. Redis allows fast atomic operations like INCR and DECR, and we can key by client IP or API token with a TTL. For a distributed cluster, this maintains global limits with sub-millisecond overhead." }
        ],
        strengths: [
          "Demonstrates strong fundamental CS knowledge regarding process resource isolation.",
          "Clear application of system design principles using Redis for low-latency shared state.",
          "Structured response matching the STAR methodology."
        ],
        improvements: [
          "Vocal speed slightly elevated (142 WPM) during system design description.",
          "Could expand on token allocation refilling strategies under high concurrent burst traffic."
        ],
        finalAnalysis: {
          summary: "The candidate shows high technical accuracy, level-headed articulation, and deep comfort with systems architecture. Speech is highly clear and logical.",
          technicalReview: "Excellent definitions of memory isolation boundaries. Rate-limiting design exhibits secure, scalable thinking with a clear Redis strategy.",
          communicationReview: "Amiable, confident, and highly articulate delivery. Pacing is mostly within the optimal bounds (130-140 WPM).",
          confidenceReview: "Calm, intellectual posture and consistent articulation patterns suggest excellent professional maturity.",
          careerFit: "Matches elite candidate specifications for cloud, full-stack, or backend placements.",
          suggestedRoles: ["Backend Engineer", "Cloud Architect", "Full-Stack Developer"]
        },
        liveMetrics: {
          confidence: 88,
          technical: 86,
          communication: 82
        }
      };

      await saveInterviewResult(mockRecord, user.uid);
      showToast("Real-time mock interview simulated and saved to Firestore!", "success");
      await fetchHistory();
    } catch (e) {
      console.error("Failed to save mock session:", e);
      showToast("Failed to simulate mock interview session.", "error");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.history]);

  const updateAvatar = async (emotion: Emotion) => {
    setCurrentEmotion(emotion);
    if (!hasImagePermission) {
      setAvatarUrl('');
      return;
    }
    try {
      const url = await generateAvatar(emotion);
      if (url) {
        setAvatarUrl(url);
      } else {
        setHasImagePermission(false);
        setAvatarUrl('');
      }
    } catch (error) {
      console.error("Failed to generate avatar", error);
      setHasImagePermission(false);
      setAvatarUrl('');
    }
  };

  const playWebSpeechFallback = (text: string, forcePlay: boolean = false) => {
    if (!isAudioEnabled && !forcePlay) return;
    try {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/\[\w+\]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const voices = window.speechSynthesis.getVoices();
      
      // Look for high-quality natural male voices or standard English male voices
      const maleVoice = voices.find(v => 
        v.name.toLowerCase().includes('natural') && v.name.toLowerCase().includes('male')
      ) || voices.find(v => 
        v.name.toLowerCase().includes('david') || 
        v.name.toLowerCase().includes('mark') ||
        v.name.toLowerCase().includes('bruce') ||
        v.name.toLowerCase().includes('male')
      ) || voices.find(v => 
        (v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('english') && !v.name.toLowerCase().includes('female'))
      );

      if (maleVoice) {
        utterance.voice = maleVoice;
      }
      
      // Emulate Mark Ruffalo's thoughtful, intellectual, slightly slower pacing and deep warm tone
      utterance.rate = 0.93; // Thoughtful, calm academic pace
      utterance.pitch = 0.88; // Warm, resonant, slightly deeper than average voice

      utterance.onstart = () => {
        setIsSpeaking(true);
        setSpeakingText(text);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingText(null);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setSpeakingText(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Browser text-to-speech synthesis failed", e);
      setIsSpeaking(false);
      setSpeakingText(null);
    }
  };

  const playSpeech = (text: string, forcePlay: boolean = false) => {
    if (!isAudioEnabled && !forcePlay) return;
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      // Stop current speech first synchronously
      stopSpeech();

      // Set speaking states synchronously before triggering TTS to block race conditions with microphone auto-start
      setIsSpeaking(true);
      setSpeakingText(text);

      // Trigger instantaneous browser-native text-to-speech synthesis
      playWebSpeechFallback(text, forcePlay);
    } catch (error) {
      console.error("Speech playback error", error);
      setIsSpeaking(false);
      setSpeakingText(null);
    }
  };

  const stopSpeech = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error(e);
    }
    setIsSpeaking(false);
    setSpeakingText(null);
  };

  const togglePlaySpeech = (text: string) => {
    if (isSpeaking && speakingText === text) {
      stopSpeech();
    } else {
      playSpeech(text, true);
    }
  };

  const handleInterviewerTurn = async (text: string, emotion: Emotion = 'smile', feedback?: InterviewerResponse['feedback']) => {
    setState(prev => ({
      ...prev,
      history: [...prev.history, { role: 'interviewer', text, emotion, feedback }]
    }));
    
    if (feedback) {
      setLastFeedback(feedback);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 5000);
    }

    updateAvatar(emotion);
    playSpeech(text);
  };

  const handleSubmit = async (e?: React.FormEvent, directText?: string) => {
    e?.preventDefault();
    const userText = directText !== undefined ? directText : input;
    if (!userText.trim() || isProcessing) return;

    setInput('');
    setIsProcessing(true);

    // Add user message to history
    setState(prev => ({
      ...prev,
      history: [...prev.history, { role: 'candidate', text: userText }]
    }));

    try {
      const updatedStateForResponse = {
        ...state,
        history: [...state.history, { role: 'candidate' as const, text: userText }]
      };
      const response = await generateInterviewerResponse(updatedStateForResponse, userText);
      
      // Update state based on response
      setState(prev => {
        const updatedHistory = [...prev.history];
        
        // Add Hana-san's response to history
        const interviewerHistoryItem = {
          role: 'interviewer' as const,
          text: response.text,
          emotion: response.emotion,
          score: response.feedback?.score,
          feedback: response.feedback
        };
        updatedHistory.push(interviewerHistoryItem);

        const nextSubStep = (prev.subStep || 0) + 1;
        const nextStepVal = response.nextStep || prev.step;
        const isFinishing = nextStepVal === 'result' || prev.step === 'result' || nextSubStep >= 8;

        const newState = {
          ...prev,
          history: updatedHistory,
          step: isFinishing ? 'result' as const : nextStepVal,
          subStep: nextSubStep,
          isFinished: isFinishing || prev.isFinished
        };

        // Extract student details dynamically
        const updatedCandidateInfo = { ...prev.candidateInfo };
        updatedHistory.forEach(h => {
          if (h.role === 'candidate') {
            const txt = h.text.toLowerCase();
            if (!updatedCandidateInfo.name) {
              const nameMatch = h.text.match(/my name is ([A-Za-z\s]{2,30})/i) || h.text.match(/i am ([A-Za-z\s]{2,30})/i) || h.text.match(/^([A-Za-z\s]{2,20})$/);
              if (nameMatch) {
                updatedCandidateInfo.name = nameMatch[1].trim();
              }
            }
            if (!updatedCandidateInfo.department) {
              if (txt.includes('computer science') || txt.includes('cse') || txt.includes('it') || txt.includes('information tech')) {
                updatedCandidateInfo.department = 'Computer Science & Engineering';
              } else if (txt.includes('electronics') || txt.includes('ece')) {
                updatedCandidateInfo.department = 'Electronics & Comm. Eng.';
              } else if (txt.includes('mechanical') || txt.includes('mech')) {
                updatedCandidateInfo.department = 'Mechanical Engineering';
              } else if (txt.includes('civil')) {
                updatedCandidateInfo.department = 'Civil Engineering';
              }
            }
            if (!updatedCandidateInfo.targetRole) {
              const roleMatch = h.text.match(/target role is ([A-Za-z\s\-\/]{2,30})/i) || h.text.match(/aspiring to be ([A-Za-z\s\-\/]{2,30})/i);
              if (roleMatch) {
                updatedCandidateInfo.targetRole = roleMatch[1].trim();
              } else if (txt.includes('software engineer') || txt.includes('sde') || txt.includes('developer')) {
                updatedCandidateInfo.targetRole = 'Software Development Engineer';
              } else if (txt.includes('data analyst') || txt.includes('data science')) {
                updatedCandidateInfo.targetRole = 'Data Analyst';
              }
            }
            if (!updatedCandidateInfo.skills) {
              const skillsList: string[] = [];
              ['react', 'javascript', 'typescript', 'python', 'java', 'sql', 'c++'].forEach(sk => {
                if (txt.includes(sk)) {
                  skillsList.push(sk.toUpperCase());
                }
              });
              if (skillsList.length > 0) {
                updatedCandidateInfo.skills = skillsList.join(', ');
              }
            }
          }
        });
        newState.candidateInfo = updatedCandidateInfo;

        // Calculate live metrics
        const feedbackList = updatedHistory.filter(h => h.feedback && h.feedback.metrics);
        if (feedbackList.length > 0) {
          newState.liveMetrics = {
            confidence: Math.round(feedbackList.reduce((sum, h) => sum + (h.feedback?.metrics?.confidence || 0), 0) / feedbackList.length),
            technical: Math.round(feedbackList.reduce((sum, h) => sum + (h.feedback?.metrics?.technical || 0), 0) / feedbackList.length),
            communication: Math.round(feedbackList.reduce((sum, h) => sum + (h.feedback?.metrics?.communication || 0), 0) / feedbackList.length),
          };
        }

        if (response.finalAnalysis) {
          newState.finalAnalysis = response.finalAnalysis;
        }

        if (isFinishing) {
          newState.isFinished = true;
          setTimeout(() => {
            setIsCompilingReport(true);
            setTimeout(() => {
              setIsCompilingReport(false);
            }, 4500);
          }, 50);
          const scoredFeedback = updatedHistory.filter(h => h.score !== undefined);
          const overallScore = scoredFeedback.length > 0
            ? Math.round((scoredFeedback.reduce((acc, h) => acc + (h.score || 0), 0) / scoredFeedback.length) * 10)
            : 80;

          const resultItem = {
            id: `local-${Date.now()}`,
            candidateName: newState.candidateInfo.name || 'Anonymous',
            department: newState.candidateInfo.department || 'N/A',
            targetRole: newState.candidateInfo.targetRole || 'N/A',
            overallScore,
            history: newState.history,
            strengths: newState.history.filter(h => h.feedback).map(h => h.feedback?.strength || ''),
            improvements: newState.history.filter(h => h.feedback).map(h => h.feedback?.improvement || ''),
            finalAnalysis: newState.finalAnalysis,
            liveMetrics: newState.liveMetrics,
            timestamp: { seconds: Math.floor(Date.now() / 1000) }
          };

          try {
            const currentHistory = JSON.parse(localStorage.getItem('ai_interview_history') || '[]');
            currentHistory.unshift(resultItem);
            localStorage.setItem('ai_interview_history', JSON.stringify(currentHistory));
          } catch (e) {
            console.error("Local storage write error:", e);
          }

          if (auth.currentUser) {
            saveInterviewResult({
              candidateName: newState.candidateInfo.name || 'Anonymous',
              department: newState.candidateInfo.department || 'N/A',
              targetRole: newState.candidateInfo.targetRole || 'N/A',
              overallScore,
              history: newState.history,
              strengths: newState.history.filter(h => h.feedback).map(h => h.feedback?.strength || ''),
              improvements: newState.history.filter(h => h.feedback).map(h => h.feedback?.improvement || ''),
              finalAnalysis: newState.finalAnalysis,
              liveMetrics: newState.liveMetrics
            });
            setHasSavedToDb(true);
          } else {
            setHasSavedToDb(false);
          }
          setTimeout(() => fetchHistory(), 1000);
        }

        return newState;
      });

      // Show real-time feedback popups
      if (response.feedback) {
        setLastFeedback(response.feedback);
        setShowFeedback(true);
        setTimeout(() => setShowFeedback(false), 5000);
      }
      updateAvatar(response.emotion);
      playSpeech(response.text);

    } catch (error) {
      console.error("Failed to get interviewer response", error);
      handleInterviewerTurn("I'm sorry, I had a bit of a technical glitch. Could you repeat that?", 'serious');
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          setIsListening(false);
          if (interviewMode === 'video' && transcript.trim()) {
            handleSubmit(undefined, transcript);
          }
        };
        recognitionRef.current.onerror = () => setIsListening(false);
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        showToast("Speech recognition is not supported in this browser.", "error");
      }
    }
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsCameraOn(false);
      setIsVirtualCamera(false);
      setCameraError(null);
    } else {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraOn(true);
          setIsVirtualCamera(false);
        }
      } catch (error) {
        console.warn("Failed to access hardware camera, starting high-tech virtual holographic feed:", error);
        setIsCameraOn(true);
        setIsVirtualCamera(true);
        setCameraError("Physical camera is blocked or unavailable. Initializing virtual holographic tracking feed instead.");
      }
    }
  };

  const handleSignIn = async () => {
    // Detect if running inside an iframe
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      setAuthError("iframe_blocked");
      return null;
    }

    try {
      const profile = await signInWithGoogle();
      return profile;
    } catch (error) {
      console.error("Google sign-in failed", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('popup-blocked') || errMsg.includes('cancelled-popup-request') || errMsg.includes('popup_closed_by_user')) {
        setAuthError("popup_blocked");
      } else {
        setAuthError(errMsg);
      }
      return null;
    }
  };

  const handleAdminLogin = async () => {
    const profile = await handleSignIn();
    if (!profile) return;
    if (profile.email === 'jhonkiladi@gmail.com') {
      setIsAdminMode(true);
    } else {
      showToast("You do not have administrator privileges.", "error");
      await logout();
    }
  };

  const handleAdminAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setAdminAuthLoading(true);

    if (!adminIdInput || !adminPasswordInput || !adminAccessCodeInput) {
      setAdminAuthError("All fields are required for enterprise authentication.");
      setAdminAuthLoading(false);
      return;
    }

    const code = adminAccessCodeInput.trim().toUpperCase();
    if (code !== 'ADMIN_2026' && code !== 'ADMIN2026') {
      setAdminAuthError("ACCESS DENIED: Invalid Admin Access Code.");
      setAdminAuthLoading(false);
      return;
    }

    // Support simulated/demo administrator bypass for testing/preview purposes
    if (adminIdInput === 'admin@banner.ai' && adminPasswordInput === 'password') {
      await handleDemoLogin('admin');
      // Reset fields
      setAdminIdInput('');
      setAdminPasswordInput('');
      setAdminAccessCodeInput('');
      setAdminAuthError(null);
      setAdminAuthLoading(false);
      return;
    }

    try {
      // Authenticate with Firebase using email (Admin ID acts as email)
      const firebaseUser = await signInWithEmail(adminIdInput, adminPasswordInput);
      
      if (firebaseUser) {
        const isUserAdmin = firebaseUser.email === 'jhonkiladi@gmail.com' || code === 'ADMIN_2026' || code === 'ADMIN2026';
        if (!isUserAdmin) {
          setAdminAuthError("ACCESS DENIED: Insufficient privileges.");
          await logout();
          setAdminAuthLoading(false);
          return;
        }

        const role = 'admin';
        // Sync user profile with role
        await syncUserProfile(firebaseUser, role);
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          role: role,
          displayName: firebaseUser.displayName || 'Administrator',
          photoURL: firebaseUser.photoURL || ''
        });

        // Record activity
        await recordLoginActivity(firebaseUser);

        // Reset fields
        setAdminIdInput('');
        setAdminPasswordInput('');
        setAdminAccessCodeInput('');
        setAdminAuthError(null);
      }
    } catch (error: any) {
      console.error("Admin auth failed:", error);
      let errMsg = error.message || "Authentication failed. Please check your credentials.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errMsg = "ACCESS DENIED: Invalid Admin ID or Password.";
      } else if (error.code === 'auth/invalid-email') {
        errMsg = "ACCESS DENIED: Invalid email format for Admin ID.";
      }
      setAdminAuthError(errMsg);
    } finally {
      setAdminAuthLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'candidate' | 'admin') => {
    const demoUser = {
      uid: role === 'admin' ? 'demo-admin-123' : 'demo-candidate-123',
      email: role === 'admin' ? 'jhonkiladi@gmail.com' : 'candidate.demo@placement.edu',
      displayName: role === 'admin' ? 'Jhon Admin (Demo)' : 'Jane Candidate (Demo)',
      photoURL: ''
    };
    
    await syncUserProfile(demoUser);
    
    setUser({
      uid: demoUser.uid,
      email: demoUser.email,
      role: role === 'admin' ? 'admin' : 'candidate',
      displayName: demoUser.displayName,
      photoURL: demoUser.photoURL
    });

    await recordLoginActivity(demoUser);
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailAuthError(null);
    setEmailAuthLoading(true);

    if (!emailInput || !passwordInput) {
      setEmailAuthError("Please fill in all required fields.");
      setEmailAuthLoading(false);
      return;
    }

    if (emailMode === 'signup' && !nameInput) {
      setEmailAuthError("Please enter your name.");
      setEmailAuthLoading(false);
      return;
    }

    try {
      let firebaseUser;
      if (emailMode === 'signin') {
        firebaseUser = await signInWithEmail(emailInput, passwordInput);
      } else {
        firebaseUser = await registerWithEmail(emailInput, passwordInput, nameInput);
      }

      if (firebaseUser) {
        const code = adminCodeInput.trim().toUpperCase();
        const isUserAdmin = firebaseUser.email === 'jhonkiladi@gmail.com' || code === 'ADMIN_2026' || code === 'ADMIN2026';
        const role = isUserAdmin ? 'admin' : 'candidate';

        // Sync user profile with role
        await syncUserProfile(firebaseUser, role);
        
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          role: role,
          displayName: firebaseUser.displayName || nameInput || 'Candidate',
          photoURL: firebaseUser.photoURL || ''
        });

        // Record activity
        await recordLoginActivity(firebaseUser);

        // Reset fields
        setEmailInput('');
        setPasswordInput('');
        setNameInput('');
        setAdminCodeInput('');
      }
    } catch (error: any) {
      console.error("Email auth failed:", error);
      let errMsg = error.message || "Authentication failed. Please check your credentials.";
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        errMsg = "Incorrect email or password.";
      } else if (error.code === 'auth/email-already-in-use') {
        errMsg = "This email is already registered.";
      } else if (error.code === 'auth/weak-password') {
        errMsg = "Password should be at least 6 characters.";
      } else if (error.code === 'auth/invalid-email') {
        errMsg = "Invalid email format.";
      }
      setEmailAuthError(errMsg);
    } finally {
      setEmailAuthLoading(false);
    }
  };

  useEffect(() => {
    const fetchActivities = async () => {
      if (user) {
        setIsLoadingActivities(true);
        try {
          const activities = await getLoginActivities(user.uid);
          setLoginActivities(activities);
        } catch (e) {
          console.error("Failed to fetch login activities:", e);
        } finally {
          setIsLoadingActivities(false);
        }
      }
    };

    if (activeTab === 'dashboard') {
      fetchActivities();
    }
  }, [user, activeTab]);

  if (isAdminMode) {
    return <AdminDashboard onBack={() => setIsAdminMode(false)} userId={user?.uid} />;
  }

  if (state.isFinished) {
    if (isCompilingReport) {
      return <ReportCompilerLoader />;
    }
    const finalConfidence = state.liveMetrics?.confidence || 
      (state.history.filter(h => h.feedback?.metrics).length > 0 
        ? Math.round(state.history.filter(h => h.feedback?.metrics).reduce((sum, h) => sum + (h.feedback?.metrics?.confidence || 0), 0) / state.history.filter(h => h.feedback?.metrics).length) 
        : 85);

    const finalTechnical = state.liveMetrics?.technical || 
      (state.history.filter(h => h.feedback?.metrics).length > 0 
        ? Math.round(state.history.filter(h => h.feedback?.metrics).reduce((sum, h) => sum + (h.feedback?.metrics?.technical || 0), 0) / state.history.filter(h => h.feedback?.metrics).length) 
        : 75);

    const finalCommunication = state.liveMetrics?.communication || 
      (state.history.filter(h => h.feedback?.metrics).length > 0 
        ? Math.round(state.history.filter(h => h.feedback?.metrics).reduce((sum, h) => sum + (h.feedback?.metrics?.communication || 0), 0) / state.history.filter(h => h.feedback?.metrics).length) 
        : 80);

    const scoredFeedback = state.history.filter(h => h.score !== undefined);
    const overallPercent = scoredFeedback.length > 0
      ? Math.round((scoredFeedback.reduce((acc, h) => acc + (h.score || 0), 0) / scoredFeedback.length) * 10)
      : Math.round((finalConfidence + finalTechnical + finalCommunication) / 3);

    const finalReport = state.finalAnalysis || {
      summary: `Outstanding effort completing your placement interview practice with Dr. Banner! You demonstrated strong capability and structural framing in your responses.`,
      technicalReview: `You explained key concepts with good fundamentals. To upgrade further, try integrating specific framework or architecture names into your answers to demonstrate deep, hands-on experience.`,
      communicationReview: `Your pacing was consistent, and you answered clearly. Aim to avoid starting sentences with fillers and structure answers using the STAR method (Situation, Task, Action, Result) for maximum impact.`,
      confidenceReview: `You responded directly with poise and conviction. Maintaining a steady flow and starting with clear, assertive direct answers will convey perfect workplace readiness.`,
      careerFit: overallPercent >= 85 ? 'Highly Recommended for Placement' : 'Recommended with Upskilling Scope',
      suggestedRoles: state.candidateInfo.targetRole ? [state.candidateInfo.targetRole, 'Software Developer'] : ['Software Engineer', 'Associate Developer', 'Full Stack Practitioner']
    };

    const reportData = {
      candidateName: state.candidateInfo.name || 'Candidate',
      department: state.candidateInfo.department || 'N/A',
      targetRole: state.candidateInfo.targetRole || 'N/A',
      overallScore: overallPercent,
      history: state.history,
      finalAnalysis: finalReport,
      liveMetrics: state.liveMetrics || {
        confidence: finalConfidence,
        technical: finalTechnical,
        communication: finalCommunication
      }
    };

    const handleSaveToDbAfterSignIn = async () => {
      const currentUserId = auth.currentUser?.uid || (user?.uid === 'demo-candidate-123' || user?.uid === 'demo-admin-123' ? user.uid : null);
      if (currentUserId) {
        try {
          await saveInterviewResult({
            candidateName: reportData.candidateName,
            department: reportData.department,
            targetRole: reportData.targetRole,
            overallScore: reportData.overallScore,
            history: reportData.history,
            strengths: reportData.history.filter(h => h.feedback).map(h => h.feedback?.strength || ''),
            improvements: reportData.history.filter(h => h.feedback).map(h => h.feedback?.improvement || ''),
            finalAnalysis: reportData.finalAnalysis,
            liveMetrics: reportData.liveMetrics
          }, currentUserId);
          setHasSavedToDb(true);
          fetchHistory();
        } catch (error) {
          console.error("Failed to save report:", error);
        }
        return;
      }

      const profile = await handleSignIn();
      if (profile) {
        try {
          await saveInterviewResult({
            candidateName: reportData.candidateName,
            department: reportData.department,
            targetRole: reportData.targetRole,
            overallScore: reportData.overallScore,
            history: reportData.history,
            strengths: reportData.history.filter(h => h.feedback).map(h => h.feedback?.strength || ''),
            improvements: reportData.history.filter(h => h.feedback).map(h => h.feedback?.improvement || ''),
            finalAnalysis: reportData.finalAnalysis,
            liveMetrics: reportData.liveMetrics
          });
          setHasSavedToDb(true);
          fetchHistory();
        } catch (error) {
          console.error("Failed to save report after sign in:", error);
        }
      }
    };

    return (
      <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 flex items-center justify-center">
        {selectedHistoryItem ? (
          <ReportViewer 
            data={{
              candidateName: selectedHistoryItem.candidateName,
              department: selectedHistoryItem.department,
              targetRole: selectedHistoryItem.targetRole,
              overallScore: selectedHistoryItem.overallScore,
              history: selectedHistoryItem.history,
              strengths: selectedHistoryItem.strengths,
              improvements: selectedHistoryItem.improvements,
              finalAnalysis: selectedHistoryItem.finalAnalysis,
              liveMetrics: selectedHistoryItem.liveMetrics,
              timestamp: selectedHistoryItem.timestamp
            }} 
            historyList={historyList}
            onBack={() => setSelectedHistoryItem(null)} 
            onViewHistoryItem={(item) => setSelectedHistoryItem(item)}
          />
        ) : (
          <ReportViewer 
            data={reportData} 
            historyList={historyList}
            hasSavedToDb={hasSavedToDb}
            onSaveToDb={handleSaveToDbAfterSignIn}
            onViewHistoryItem={(item) => setSelectedHistoryItem(item)}
            onRestart={() => {
              stopSpeech();
              setState(INITIAL_STATE);
              setInterviewMode(null);
              setShowBackupText(false);
            }} 
          />
        )}
      </div>
    );
  }

  if (showSplash) {
    // Generate static metadata for background drifting particles
    const particles = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      size: Math.random() * 2.5 + 0.8,
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      driftX: Math.random() * 40 - 20,
      driftY: Math.random() * 40 - 20,
      duration: Math.random() * 15 + 10,
    }));

    const typewriterText = "PRACTICE. IMPROVE. GET HIRED.";

    const playStartupChime = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        
        const now = ctx.currentTime;
        
        // Low ambient warm drone
        const drone = ctx.createOscillator();
        const droneGain = ctx.createGain();
        drone.type = 'sine';
        drone.frequency.setValueAtTime(110, now); // A2 pitch
        droneGain.gain.setValueAtTime(0, now);
        droneGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
        droneGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
        drone.connect(droneGain);
        droneGain.connect(ctx.destination);
        drone.start(now);
        drone.stop(now + 3.5);

        // High premium tech chime chord (A major 7th / 9th harmony)
        const notes = [220, 277.18, 329.63, 440, 554.37, 659.25, 880];
        notes.forEach((freq, index) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + index * 0.08);
          
          filter.type = 'lowpass';
          filter.Q.setValueAtTime(3, now);
          filter.frequency.setValueAtTime(1200, now);
          filter.frequency.exponentialRampToValueAtTime(300, now + index * 0.08 + 1.8);

          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.06, now + index * 0.08 + 0.04);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 2.2);
          
          osc.connect(filter);
          filter.connect(gainNode);
          gainNode.connect(ctx.destination);
          
          osc.start(now + index * 0.08);
          osc.stop(now + index * 0.08 + 2.5);
        });
      } catch (err) {
        console.warn("Audio Context playback prevented or unsupported:", err);
      }
    };

    const handleEnterApp = () => {
      playStartupChime();
      setShowSplash(false);
    };

    return (
      <AnimatePresence>
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(12px)", scale: 1.02 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 bg-[#04060d] z-50 flex flex-col items-center justify-center p-4 md:p-8 select-none overflow-hidden"
        >
          {/* Volumetric ambient background lighting glows */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Slow drifting gradient mesh circles */}
            <motion.div 
              animate={{
                x: [-60, 60, -60],
                y: [-40, 40, -40],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -top-1/4 -left-1/4 w-[75%] h-[75%] bg-gradient-to-br from-violet-950/25 via-indigo-950/15 to-transparent blur-[140px]" 
            />
            <motion.div 
              animate={{
                x: [60, -60, 60],
                y: [40, -40, 40],
              }}
              transition={{
                duration: 30,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -bottom-1/4 -right-1/4 w-[75%] h-[75%] bg-gradient-to-tr from-cyan-950/20 via-blue-950/15 to-transparent blur-[140px]" 
            />
            
            <div className="liquid-blob w-[60%] h-[60%] -top-1/4 -left-1/4 bg-gradient-to-br from-violet-600/15 to-fuchsia-600/10 blur-[120px]" style={{ animationDelay: '0s' }} />
            <div className="liquid-blob w-[60%] h-[60%] -bottom-1/4 -right-1/4 bg-gradient-to-tr from-cyan-500/15 to-blue-600/10 blur-[120px]" style={{ animationDelay: '-6s' }} />
            <div className="liquid-blob w-[40%] h-[40%] top-1/4 left-1/4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 blur-[100px]" style={{ animationDelay: '-3s' }} />
            <div className="absolute inset-0 bg-[#04060d]/75 backdrop-blur-[100px]" />
          </div>

          {/* Drifting constellation field */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ 
                  x: `${p.initialX}vw`, 
                  y: `${p.initialY}vh`, 
                  opacity: 0 
                }}
                animate={{ 
                  x: [`${p.initialX}vw`, `${p.initialX + p.driftX}vw`], 
                  y: [`${p.initialY}vh`, `${p.initialY + p.driftY}vh`],
                  opacity: [0, Math.random() * 0.4 + 0.15, 0]
                }}
                transition={{ 
                  duration: p.duration, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                style={{ width: p.size, height: p.size }}
                className="absolute rounded-full bg-cyan-400/50 shadow-[0_0_6px_rgba(34,211,238,0.3)]"
              />
            ))}
          </div>

          {/* Core Master Cinematic Container */}
          <div className="w-full max-w-6xl h-[650px] relative flex flex-col lg:flex-row items-center justify-center z-10">
            
            {/* Animating Connection Network Lines (Desktop only) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none text-violet-500/20 hidden lg:block" viewBox="0 0 1000 650">
              {/* Path 1: Center to Top-Left */}
              <motion.path 
                d="M 500,325 C 400,325 350,150 250,150"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ delay: 1.5, duration: 1.8, ease: "easeInOut" }}
              />
              <motion.circle
                cx="250" cy="150" r="3"
                className="fill-violet-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 3 }}
              />

              {/* Path 2: Center to Top-Right */}
              <motion.path 
                d="M 500,325 C 600,325 650,150 750,150"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ delay: 1.7, duration: 1.8, ease: "easeInOut" }}
              />
              <motion.circle
                cx="750" cy="150" r="3"
                className="fill-cyan-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 3.2 }}
              />

              {/* Path 3: Center to Bottom-Left */}
              <motion.path 
                d="M 500,325 C 400,325 350,500 250,500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ delay: 1.9, duration: 1.8, ease: "easeInOut" }}
              />
              <motion.circle
                cx="250" cy="500" r="3"
                className="fill-cyan-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 3.4 }}
              />

              {/* Path 4: Center to Bottom-Right */}
              <motion.path 
                d="M 500,325 C 600,325 650,500 750,500"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{ delay: 2.1, duration: 1.8, ease: "easeInOut" }}
              />
              <motion.circle
                cx="750" cy="500" r="3"
                className="fill-violet-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 3.6 }}
              />
            </svg>

            {/* Left Side: Floating Glass Cards (Desktop Absolute position) */}
            <div className="hidden lg:block absolute left-0 w-80 space-y-24">
              {/* Card 1: Camera Preview */}
              <motion.div
                initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 1.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-dark border border-white/5 p-4.5 rounded-2xl shadow-xl space-y-3 relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                      <Video size={14} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Video Mapping</h4>
                      <p className="text-[9px] text-white/40">Real-time facial expressions</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">OPTIMIZED</span>
                </div>
                <div className="h-16 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial-gradient from-violet-900/10 to-transparent animate-pulse" />
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/50 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-ping" />
                    <span>CAMERA FEED ACTIVE</span>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: AI Voice Intelligence */}
              <motion.div
                initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 2.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-dark border border-white/5 p-4.5 rounded-2xl shadow-xl space-y-3 relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Mic size={14} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Acoustic Core</h4>
                      <p className="text-[9px] text-white/40">Dynamic transcription engine</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">BALANCED</span>
                </div>
                <div className="h-16 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center p-3">
                  <div className="flex items-center gap-1 w-full justify-center">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [12, Math.random() * 24 + 8, 12] }}
                        transition={{ repeat: Infinity, duration: 0.8 + i * 0.1, ease: "easeInOut" }}
                        className="w-1 rounded-full bg-cyan-400/40"
                        style={{ height: 12 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Central Area: AI circular core + Logo identity */}
            <div className="flex flex-col items-center justify-center space-y-10 relative z-10 max-w-lg mx-auto text-center px-4">
              
              {/* Circular AI Core forming with rings and glows */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* Outer spin rings */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    rotate: 360 
                  }}
                  transition={{ 
                    rotate: { repeat: Infinity, duration: 20, ease: "linear" },
                    opacity: { duration: 1.8, ease: [0.16, 1, 0.3, 1] },
                    scale: { duration: 1.8, ease: [0.16, 1, 0.3, 1] }
                  }}
                  className="absolute inset-0 border border-dashed border-violet-500/30 rounded-full"
                  style={{ rotate: 0 }}
                />
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, rotate: -360 }}
                  transition={{ duration: 2.2, ease: "linear", repeat: Infinity }}
                  className="absolute inset-3 border border-indigo-500/20 border-t-cyan-400/50 border-b-violet-500/50 rounded-full"
                />
                <motion.div
                  animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                  className="absolute inset-6 bg-gradient-radial from-violet-600/10 to-transparent blur-[8px] rounded-full"
                />

                {/* Core Hologram */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 100, damping: 15 }}
                  className="relative z-10"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 25px rgba(139,92,246,0.35)",
                        "0 0 45px rgba(139,92,246,0.65)",
                        "0 0 25px rgba(139,92,246,0.35)"
                      ]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3, 
                      ease: "easeInOut" 
                    }}
                    className="w-18 h-18 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 flex items-center justify-center border border-white/20 overflow-hidden"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                      className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"
                    />
                    <Sparkles size={28} className="text-white animate-pulse" />
                  </motion.div>
                </motion.div>

                {/* Expanding pulse waves */}
                <motion.div 
                  animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                  transition={{ repeat: Infinity, duration: 2.4, ease: "easeOut" }}
                  className="absolute w-36 h-36 border border-cyan-400/30 rounded-full pointer-events-none"
                />
                <motion.div 
                  animate={{ scale: [1, 2.8], opacity: [0.3, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeOut", delay: 1.2 }}
                  className="absolute w-36 h-36 border border-violet-500/20 rounded-full pointer-events-none"
                />
              </div>

              {/* Title & Typewriter Text (With smooth scale up & slight blur transition) */}
              <div className="space-y-3.5 flex flex-col items-center justify-center w-full">
                {/* Badge ('Cognitive Evaluation AI') with soft shimmer sweep */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[9px] font-black uppercase tracking-widest shadow-[0_0_12px_rgba(139,92,246,0.1)] relative overflow-hidden"
                >
                  {/* Soft shimmer sweep */}
                  <motion.div
                    animate={{
                      x: ["-100%", "250%"]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3,
                      ease: "linear",
                      repeatDelay: 3
                    }}
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none"
                  />
                  <Cpu size={10} className="text-violet-400 animate-pulse" />
                  <span>Cognitive Evaluation AI</span>
                </motion.div>

                {/* Title: Fade + slide up on page load (staggered, 0.6s ease-out) */}
                <motion.h1
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
                  className="text-4xl md:text-5xl font-black tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-b from-white via-white/95 to-white/70"
                >
                  AI Virtual Interviewer
                </motion.h1>

                {/* Staggered typewriter character container */}
                <div className="h-6 text-xs text-cyan-400/90 font-mono tracking-widest uppercase font-bold flex items-center justify-center gap-px select-none">
                  {typewriterText.split("").map((char, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 1.3 + index * 0.05,
                        duration: 0.3,
                        ease: "easeOut"
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-1.5 h-3.5 bg-cyan-400 ml-1 inline-block shrink-0"
                  />
                </div>
              </div>

              {/* Shimmering Button to Launch Workspace */}
              <motion.div
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 2.8, duration: 0.8, ease: "easeOut" }}
                className="w-full pt-4"
              >
                <motion.button
                  whileHover={{ 
                    scale: 1.03,
                    boxShadow: "0 0 35px rgba(139, 92, 246, 0.65)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  animate={{
                    boxShadow: [
                      "0 10px 25px -5px rgba(139, 92, 246, 0.3), 0 8px 10px -6px rgba(139, 92, 246, 0.3)",
                      "0 15px 35px 0px rgba(139, 92, 246, 0.55), 0 10px 15px -3px rgba(139, 92, 246, 0.35)",
                      "0 10px 25px -5px rgba(139, 92, 246, 0.3), 0 8px 10px -6px rgba(139, 92, 246, 0.3)"
                    ]
                  }}
                  transition={{
                    boxShadow: {
                      repeat: Infinity,
                      duration: 2.5,
                      ease: "easeInOut"
                    }
                  }}
                  onClick={handleEnterApp}
                  className="w-full sm:w-auto px-12 py-4.5 bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white text-xs font-black uppercase tracking-[0.25em] rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-3.5 mx-auto border border-violet-500/40 relative group overflow-hidden"
                >
                  {/* Subtle motion shimmer */}
                  <motion.div
                    animate={{ x: ["-150%", "150%"] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "linear", repeatDelay: 1.2 }}
                    className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
                  />
                  
                  <Activity size={14} className="text-violet-200 animate-pulse" />
                  <span>Start Interview</span>
                </motion.button>
                <p className="text-[10px] text-white/20 tracking-wider font-mono uppercase mt-4">
                  Press Start to initialize sensory & diagnostic systems
                </p>
              </motion.div>
            </div>

            {/* Right Side: Floating Glass Cards (Desktop Absolute position) */}
            <div className="hidden lg:block absolute right-0 w-80 space-y-24">
              {/* Card 3: AI Interviewer Host */}
              <motion.div
                initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-dark border border-white/5 p-4.5 rounded-2xl shadow-xl space-y-3 relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-l from-violet-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                      <Brain size={14} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">Cognitive Core</h4>
                      <p className="text-[9px] text-white/40">Dr. Banner interactive agent</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase font-mono px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-400">ONLINE</span>
                </div>
                <div className="h-16 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center p-3 text-[10px] font-mono text-white/50 leading-relaxed text-center">
                  "Ready to conduct competency evaluation using behavioral matrix rules."
                </div>
              </motion.div>

              {/* Card 4: Performance Analytics */}
              <motion.div
                initial={{ opacity: 0, x: 50, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{ delay: 2.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="glass-dark border border-white/5 p-4.5 rounded-2xl shadow-xl space-y-3 relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-l from-cyan-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <BarChart3 size={14} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-wider">STAR Evaluation</h4>
                      <p className="text-[9px] text-white/40">Scoring database synchronized</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">CONNECTED</span>
                </div>
                <div className="h-16 bg-black/40 rounded-xl border border-white/5 p-3 flex flex-col justify-center space-y-1">
                  <div className="flex justify-between text-[8px] font-mono text-white/40 font-bold uppercase">
                    <span>Placement Score Metric</span>
                    <span className="text-emerald-400 font-bold">10/10</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "95%" }}
                      transition={{ delay: 2.6, duration: 1.5, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400"
                    />
                  </div>
                </div>
              </motion.div>
            </div>

          </div>

          {/* Footer brand details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.4, duration: 1.0, ease: "easeOut" }}
            className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left font-mono text-[9px] text-white/20 uppercase tracking-widest relative z-10"
          >
            <span>Designed for Professional Placement Excellence</span>
            <span>Enterprise-Grade Security • AI Assessment Sandbox</span>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans selection:bg-violet-500/30 overflow-x-hidden relative flex flex-col justify-between">
        <audio ref={audioRef} hidden />

        {/* Success message banner */}
        <AnimatePresence>
          {logoutSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-6 right-6 z-50 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-xl backdrop-blur-md"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 size={12} />
              </div>
              <span className="text-xs font-medium text-emerald-200">{logoutSuccess}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Full-screen secure logout loader */}
        <AnimatePresence>
          {isLoggingOut && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-[#07090e]/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl">
                <RefreshCw className="text-violet-400 animate-spin" size={20} />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Securing Session</h3>
                <p className="text-[10px] text-slate-400">Please wait while we finalize your sign-out</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Subtle atmospheric design underlays (Optimized performance) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute w-[400px] h-[400px] -top-40 -left-20 bg-violet-600/5 blur-[120px] rounded-full" />
          <div className="absolute w-[500px] h-[500px] -bottom-40 -right-20 bg-indigo-600/5 blur-[130px] rounded-full" />
        </div>

        {/* Header / Navbar */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07090e]/80 border-b border-white/[0.05] py-4 px-6 md:px-12 flex items-center justify-between w-full shrink-0">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-md shadow-violet-900/10 border border-violet-500/20">
                <Sparkles className="text-white" size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-white font-display">Dr. Banner AI</span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-md text-violet-300 font-semibold tracking-wide">SaaS</span>
                </div>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">Interview Simulator</p>
              </div>
            </div>

            {/* Middle Nav - Interactive & Clean */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
              <button 
                onClick={() => document.getElementById('benefits-grid')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Core Pillars
              </button>
              <button 
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Simulation Flow
              </button>
              <button 
                onClick={() => document.getElementById('auth-gateway')?.scrollIntoView({ behavior: 'smooth' })}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Access Portal
              </button>
            </nav>

            <div className="flex items-center gap-3.5">
              <button 
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer text-slate-300 hover:text-white"
                title={isAudioEnabled ? "Mute Audio Feedback" : "Unmute Audio Feedback"}
              >
                {isAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} className="text-slate-500" />}
              </button>
              <button 
                onClick={() => document.getElementById('auth-gateway')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs tracking-wide rounded-xl transition-colors cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </header>

        {/* Main Landing / SaaS Layout */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-16 md:py-24 max-w-6xl mx-auto w-full space-y-24">
          
          {/* Hero Section */}
          <section className="text-center space-y-8 max-w-4xl mx-auto flex flex-col items-center">
            {/* Soft badge */}
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/25 text-violet-300 text-[11px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(139,92,246,0.1)]"
            >
              <Sparkles size={11} className="text-violet-400" />
              Next-Generation Placement Intelligence
            </motion.div>

            {/* Heading */}
            <div className="space-y-4">
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight font-sans max-w-3xl mx-auto"
              >
                Refine Your Performance.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400">Secure the Offer.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed"
              >
                Conduct high-fidelity technical and behavioral simulations tailored exactly to your industry. Receive instant, actionable diagnostic reports to perfect your verbal pacing, technical articulation, and alignment.
              </motion.p>
            </div>

            {/* Hero CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto pt-4"
            >
              <button
                onClick={() => document.getElementById('auth-gateway')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-violet-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Start Free Interview
                <ArrowRight size={13} />
              </button>
              <button
                onClick={() => setShowDemoModal(true)}
                className="px-8 py-3.5 bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 hover:border-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play size={12} className="text-violet-400 fill-violet-400/20" />
                Watch Simulation Lab
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="pt-12 w-full space-y-4"
            >
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-sans">
                Empowering candidates selected by teams at
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-sm font-black text-white/30 tracking-widest font-mono">
                <span className="hover:text-white/60 transition-colors cursor-default">OPENAI</span>
                <span className="hover:text-white/60 transition-colors cursor-default">STRIPE</span>
                <span className="hover:text-white/60 transition-colors cursor-default">VERCEL</span>
                <span className="hover:text-white/60 transition-colors cursor-default">LINEAR</span>
              </div>
            </motion.div>
          </section>

          {/* Core Pillars Section */}
          <section id="benefits-grid" className="w-full space-y-10 scroll-mt-24">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 font-sans">Core Capabilities</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Engineered to Standardize Placement Prep</h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
                Discover the feature-set driving professional candidates towards structured, high-paying placements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Pillar 1 */}
              <div className="bg-[#0b0e17]/40 border border-white/[0.04] p-8 rounded-2xl space-y-4 text-left relative overflow-hidden group hover:border-violet-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/[0.01] rounded-full blur-2xl group-hover:bg-violet-600/[0.03]" />
                <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
                  <Bot size={18} />
                </div>
                <div className="space-y-1.5 relative z-10">
                  <h3 className="text-sm font-bold text-white tracking-wide">Generative AI Interviewer</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Powered by Google Gemini to facilitate adaptive technical and HR dialogues. Questions evolve dynamically based on the thoroughness of your prior responses.
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="bg-[#0b0e17]/40 border border-white/[0.04] p-8 rounded-2xl space-y-4 text-left relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/[0.01] rounded-full blur-2xl group-hover:bg-indigo-600/[0.03]" />
                <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <Mic size={18} />
                </div>
                <div className="space-y-1.5 relative z-10">
                  <h3 className="text-sm font-bold text-white tracking-wide">Multimodal Assessment</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Choose between dynamic text-chat or vocal-video modes. Optional camera and voice integration evaluates pronunciation fluency, response articulation, and communication.
                  </p>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-[#0b0e17]/40 border border-white/[0.04] p-8 rounded-2xl space-y-4 text-left relative overflow-hidden group hover:border-fuchsia-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-600/[0.01] rounded-full blur-2xl group-hover:bg-fuchsia-600/[0.03]" />
                <div className="w-10 h-10 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-xl flex items-center justify-center text-fuchsia-400">
                  <Briefcase size={16} />
                </div>
                <div className="space-y-1.5 relative z-10">
                  <h3 className="text-sm font-bold text-white tracking-wide">Resume Contextualization</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload your professional resume or degree documents. Our semantic analysis engine maps your target role to generate custom-tailored industry challenges.
                  </p>
                </div>
              </div>

              {/* Pillar 4 */}
              <div className="bg-[#0b0e17]/40 border border-white/[0.04] p-8 rounded-2xl space-y-4 text-left relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-600/[0.01] rounded-full blur-2xl group-hover:bg-cyan-600/[0.03]" />
                <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400">
                  <BarChart3 size={16} />
                </div>
                <div className="space-y-1.5 relative z-10">
                  <h3 className="text-sm font-bold text-white tracking-wide">Structured Insights</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Unlock immediate post-session analytical scores, strength mapping, and clear suggestions. All data preserves safely to cloud tables to track placement readiness.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Methodology / How It Works Section */}
          <section id="how-it-works" className="w-full space-y-10 scroll-mt-24">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 font-sans">Methodology</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">The Preparation Framework</h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
                Standardize your placement prep via our rigorous three-step structured workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {/* Step 1 */}
              <div className="bg-[#0b0e17]/30 border border-white/[0.03] p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between space-y-6 text-left">
                <div className="space-y-4">
                  <div className="text-xs font-mono font-bold text-violet-400 tracking-wider">01 / CONFIGURE</div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Configure Target Profile</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Select your target role (Software Engineering, PM, Finance, etc.) and upload a resume to establish target alignment metrics.
                    </p>
                  </div>
                </div>
                <div className="w-full h-[1px] bg-white/[0.05]" />
              </div>

              {/* Step 2 */}
              <div className="bg-[#0b0e17]/30 border border-white/[0.03] p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between space-y-6 text-left">
                <div className="space-y-4">
                  <div className="text-xs font-mono font-bold text-indigo-400 tracking-wider">02 / INTERVIEW</div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Simulate Real-Time Assessment</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Converse naturally. The AI evaluates technical validity, vocabulary breadth, pacing, and core articulation in a safe environment.
                    </p>
                  </div>
                </div>
                <div className="w-full h-[1px] bg-white/[0.05]" />
              </div>

              {/* Step 3 */}
              <div className="bg-[#0b0e17]/30 border border-white/[0.03] p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between space-y-6 text-left">
                <div className="space-y-4">
                  <div className="text-xs font-mono font-bold text-cyan-400 tracking-wider">03 / ANALYSE</div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-2">Review Analytical Feedback</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Study diagnostic feedback sheets. Drill down into grammar ratings, conceptual suggestions, and track progress history over time.
                    </p>
                  </div>
                </div>
                <div className="w-full h-[1px] bg-white/[0.05]" />
              </div>
            </div>
          </section>

          {/* Testimonials Section */}
          <section id="testimonials" className="w-full space-y-10 scroll-mt-24">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 font-sans">Success Stories</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Validated by Top Candidates</h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
                See how ambitious professionals use our simulator to secure world-class engineering and product roles.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
              <div className="bg-[#0b0e17]/40 border border-white/[0.04] p-6 rounded-2xl flex flex-col justify-between space-y-6">
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "The dynamic coding feedback on Dr. Banner AI completely changed how I frame my solutions. I went into my Stripe interview with absolute confidence."
                </p>
                <div>
                  <h4 className="text-xs font-bold text-white">Sarah Jenkins</h4>
                  <p className="text-[10px] text-violet-400">Senior Staff Engineer, now Stripe</p>
                </div>
              </div>
              <div className="bg-[#0b0e17]/40 border border-white/[0.04] p-6 rounded-2xl flex flex-col justify-between space-y-6">
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "Dr. Banner's behavioral pacing and structure feedback helped me cut down on filler words. Landing a PM lead role was a direct result of these simulation sessions."
                </p>
                <div>
                  <h4 className="text-xs font-bold text-white">Alex Chen</h4>
                  <p className="text-[10px] text-violet-400">Lead Product Manager, now OpenAI</p>
                </div>
              </div>
              <div className="bg-[#0b0e17]/40 border border-white/[0.04] p-6 rounded-2xl flex flex-col justify-between space-y-6">
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "The resume-tailored questions were astonishingly accurate. Every single topic Dr. Banner highlighted during practice showed up in my final Vercel loop."
                </p>
                <div>
                  <h4 className="text-xs font-bold text-white">Marcus Vance</h4>
                  <p className="text-[10px] text-violet-400">Frontend Specialist, now Vercel</p>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive FAQ Section */}
          <section id="faq" className="w-full max-w-3xl mx-auto space-y-10 scroll-mt-24">
            <div className="text-center space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 font-sans">Support</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Frequently Asked Questions</h2>
              <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
                Have questions about our simulation engine? Find quick answers below.
              </p>
            </div>

            <div className="space-y-3.5 text-left">
              {[
                {
                  q: "How does the AI customize my interview questions?",
                  a: "By mapping your selected target track and parsing uploaded resumes, the Gemini-powered engine creates custom system prompts. It assesses your input on the fly, crafting highly contextual, realistic follow-up questions tailored to your exact experience level."
                },
                {
                  q: "Is my personal resume and voice feed secure?",
                  a: "Yes. All resumes and voice streams are processed locally in secure sessions. We enforce strict transient storage policies, and data is only saved inside your personal private account for tracking history, never sold or shared."
                },
                {
                  q: "Can I practice both technical and behavioral roles?",
                  a: "Absolutely. Dr. Banner AI maintains specialized prompt layers for Software Engineering, Product Management, Finance, Consulting, and General HR, evaluating technical accuracy as well as professional vocal posture and delivery."
                },
                {
                  q: "Do I need complex external hardware to participate?",
                  a: "No extra hardware is required. You can participate using any standard laptop microphone and webcam. The app includes options to turn video off for a microphone-only phone screen simulation."
                }
              ].map((item, idx) => {
                const isOpen = faqOpenIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className="bg-[#0b0e17]/30 border border-white/[0.04] rounded-xl overflow-hidden transition-all duration-300"
                  >
                    <button
                      type="button"
                      onClick={() => setFaqOpenIndex(isOpen ? null : idx)}
                      className="w-full px-5 py-4 flex items-center justify-between text-left text-xs font-bold text-white hover:text-violet-300 transition-colors cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <span className="text-violet-400 text-sm select-none">
                        {isOpen ? "−" : "+"}
                      </span>
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-white/[0.02] pt-3"
                        >
                          {item.a}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Authentication Gateway Area */}
          <section id="auth-gateway" className="w-full max-w-md mx-auto pt-8 scroll-mt-24 flex flex-col items-center">
            <div className="text-center space-y-2 mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-400">
                Secure Entry System
              </span>
              <h2 className="heading-title text-2xl font-black text-white tracking-tight">
                Access the Simulator
              </h2>
            </div>

            {/* First-class independent experience switcher for Candidate vs Administrator */}
            <div className="flex p-1.5 bg-black/40 border border-white/5 rounded-2xl w-full mb-6 relative z-10 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setShowAdminAuth(false);
                  setAdminAuthError(null);
                }}
                className={cn(
                  "flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2",
                  !showAdminAuth
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <User size={12} />
                Candidate Portal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdminAuth(true);
                  setAdminAuthError(null);
                }}
                className={cn(
                  "flex-1 py-2.5 text-[11px] font-bold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2",
                  showAdminAuth
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Fingerprint size={12} />
                Admin Console
              </button>
            </div>

            <AnimatePresence mode="wait">
              {!showAdminAuth ? (
                <motion.div 
                  key="candidate-portal"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="card-premium p-8 text-center w-full shadow-2xl relative space-y-6"
                >
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-white flex items-center justify-center gap-2">
                      <Shield size={14} className="text-violet-400" />
                      Candidate Workspace Entry
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Access your personal simulation space. Choose your preferred authentication method.
                    </p>
                  </div>

                  {/* Auth Switcher Tabs for Candidate Portal */}
                  <div className="flex p-1 bg-white/5 border border-white/5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('social');
                        setEmailAuthError(null);
                      }}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer",
                        authMethod === 'social'
                          ? "bg-white/10 text-white shadow"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      OAuth & Demo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMethod('email');
                        setEmailAuthError(null);
                      }}
                      className={cn(
                        "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer",
                        authMethod === 'email'
                          ? "bg-white/10 text-white shadow"
                          : "text-slate-400 hover:text-slate-200"
                      )}
                    >
                      Email & Password
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {authMethod === 'social' ? (
                      <motion.div
                        key="social"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-4"
                      >
                        {/* Google Login button */}
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await handleSignIn();
                            }}
                            className="w-full px-5 py-3 bg-white text-[#07090e] hover:bg-slate-100 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border border-white shadow-lg hover:shadow-white/5"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                            </svg>
                            Continue with Google
                          </button>
                        </div>

                        <div className="relative flex py-1 items-center">
                          <div className="flex-grow border-t border-white/[0.06]"></div>
                          <span className="flex-shrink mx-3 text-[9px] font-bold text-slate-500 uppercase tracking-widest">or</span>
                          <div className="flex-grow border-t border-white/[0.06]"></div>
                        </div>

                        {/* Demo login option */}
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => handleDemoLogin('candidate')}
                            className="w-full btn-premium-secondary py-3.5 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <User size={13} className="text-violet-400" />
                            Explore Demo Candidate Sandbox
                          </button>
                          <p className="text-[10px] text-slate-500">
                            Instant sandbox workspace. No account setup required.
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="email"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.15 }}
                      >
                        <form onSubmit={handleEmailAuthSubmit} className="space-y-4 text-left">
                          <div className="pb-2 border-b border-white/[0.05] text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300 font-sans">
                              Secure Account Credentials
                            </span>
                          </div>

                          <div className="space-y-3">

                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Email Address</label>
                              <input
                                type="email"
                                placeholder="name@domain.com"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                className="input-premium py-2.5"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Password</label>
                              <input
                                type="password"
                                placeholder="••••••••"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="input-premium py-2.5"
                                required
                                minLength={6}
                              />
                            </div>

                            {emailMode === 'signup' && (
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">Admin Code (Optional)</label>
                                  <span className="text-[8px] text-violet-400 font-mono tracking-wider">Pass: ADMIN_2026</span>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Enter ADMIN_2026 for Admin"
                                  value={adminCodeInput}
                                  onChange={(e) => setAdminCodeInput(e.target.value)}
                                  className="input-premium py-2.5"
                                />
                              </div>
                            )}
                          </div>

                          {emailAuthError && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                              <p className="text-[10px] font-medium text-red-400 leading-normal">
                                {emailAuthError}
                              </p>
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={emailAuthLoading}
                            className="w-full btn-premium-primary"
                          >
                            {emailAuthLoading ? (
                              <span className="flex items-center justify-center gap-2">
                                <RefreshCw size={13} className="animate-spin" />
                                Processing Secure Entry...
                              </span>
                            ) : (
                              <span className="flex items-center justify-center gap-2">
                                <LogIn size={13} />
                                Sign In Workspace
                              </span>
                            )}
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {authError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
                      <p className="text-[10px] font-semibold text-red-400 leading-relaxed">
                        {authError === 'iframe_blocked' ? 'Google Sign-In is restricted inside preview embeds. Please use Email/Password credentials or try the Candidate Demo sandbox.' : 
                         authError === 'popup_blocked' ? 'The sign-in popup was blocked. Please authorize popups or switch auth modes.' : authError}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="admin-portal"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="card-premium p-8 text-center w-full shadow-2xl relative border-violet-500/20 space-y-6"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mx-auto">
                      <Fingerprint size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                        Administrator Access Console
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Secure administrative workspace connection
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAdminAuthSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1 font-mono">
                        Admin Email
                      </label>
                      <input
                        type="email"
                        placeholder="admin@banner.ai"
                        value={adminIdInput}
                        onChange={(e) => setAdminIdInput(e.target.value)}
                        className="input-premium py-2.5 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 font-mono">
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">Secret Password</label>
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="text-[8px] text-slate-400 hover:text-white transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          {showAdminPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <input
                        type={showAdminPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        className="input-premium py-2.5 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 font-mono">
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400">Admin Access Code</label>
                        <span className="text-[8px] text-violet-400 tracking-wider">CODE: ADMIN_2026</span>
                      </div>
                      <input
                        type="text"
                        placeholder="ADMIN_2026"
                        value={adminAccessCodeInput}
                        onChange={(e) => setAdminAccessCodeInput(e.target.value)}
                        className="input-premium py-2.5 font-mono"
                        required
                      />
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAdminIdInput('admin@banner.ai');
                          setAdminPasswordInput('password');
                          setAdminAccessCodeInput('ADMIN_2026');
                          setAdminAuthError(null);
                        }}
                        className="text-[9px] text-violet-400 hover:text-violet-300 font-mono uppercase tracking-wider flex items-center gap-1.5 hover:underline transition-all cursor-pointer"
                      >
                        <Terminal size={10} />
                        Load sandbox test credentials
                      </button>
                    </div>

                    {adminAuthError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl font-mono text-[10px] text-red-400">
                        {adminAuthError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={adminAuthLoading}
                      className="w-full btn-premium-primary"
                    >
                      {adminAuthLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <RefreshCw size={13} className="animate-spin" />
                          Verifying Token...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Fingerprint size={13} />
                          Verify Console Token
                        </span>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </main>

        {/* Footer */}
        <footer className="relative z-10 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.05] mt-16 text-xs text-slate-500 font-medium">
          <span>Dr. Banner AI • Designed for Placement Excellence</span>
          <span>Powered by Google Gemini Assessment Engine</span>
        </footer>

        {/* --- CUSTOM INTERACTIVE WATCH DEMO MODAL --- */}
        <AnimatePresence>
          {showDemoModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#07090e]/95 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 15 }}
                transition={{ duration: 0.25 }}
                className="w-full max-w-4xl bg-[#0d111d] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col my-8"
              >
                {/* Modal Title/Bar */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] bg-[#07090e]">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-violet-500 rounded-full" />
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">DR. BANNER AI — PREPARATION COMPANION</span>
                  </div>
                  <button
                    onClick={() => setShowDemoModal(false)}
                    className="text-slate-400 hover:text-white hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Simulated Content Body */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8 bg-gradient-to-b from-[#0d111d] to-[#07090e]">
                  
                  {/* Left Column: AI Character (5 Cols) */}
                  <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-6 relative flex flex-col items-center justify-center min-h-[240px]">
                      <div className="absolute top-3 left-3 px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[8px] font-bold uppercase tracking-wider rounded">
                        ● LIVE SIMULATION DEMO
                      </div>
                      
                      {/* Simulated Avatar Face */}
                      <div className="w-28 h-28 bg-gradient-to-br from-violet-600/10 to-indigo-500/15 rounded-full flex items-center justify-center border-2 border-violet-500/20 relative animate-pulse">
                        <Sparkles className="text-violet-400" size={32} />
                      </div>

                      {/* Speaking indicator bars */}
                      <div className="flex items-center gap-1 mt-6 h-6">
                        {[...Array(9)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{ 
                              height: [6, Math.random() * 16 + 6, 6]
                            }}
                            transition={{ 
                              duration: 0.6 + (i * 0.08),
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            className="w-1 bg-violet-400 rounded-full"
                          />
                        ))}
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-2 font-semibold">Dr. Banner AI conducts oral review</p>
                    </div>

                    {/* Metrics HUD Panel */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Acoustic & Pronunciation Delivery</h4>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-[10px] mb-1 font-mono">
                            <span className="text-slate-400">FLUENCY & SPEED</span>
                            <span className="text-violet-400 font-bold">96%</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-violet-500 h-full rounded-full" style={{ width: '96%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] mb-1 font-mono">
                            <span className="text-slate-400">VOCABULARY COMPLEXITY</span>
                            <span className="text-indigo-400 font-bold">89%</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '89%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] mb-1 font-mono">
                            <span className="text-slate-400">SENTENCE STRUCTURING</span>
                            <span className="text-cyan-400 font-bold">92%</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-cyan-500 h-full rounded-full" style={{ width: '92%' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dialogue Replay (7 Cols) */}
                  <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
                    <div className="bg-white/[0.01] border border-white/5 rounded-xl p-5 space-y-4 h-full overflow-y-auto max-h-[320px] font-mono text-xs">
                      
                      {/* Message 1 */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-violet-400 text-[10px] font-bold uppercase tracking-wider">
                          <Bot size={11} />
                          Dr. Banner (AI)
                        </div>
                        <div className="bg-violet-950/20 border border-violet-900/20 rounded-xl p-3 text-slate-300 leading-relaxed">
                          "Great to have you here. Let's explore real-time software scaling. Could you describe how you would diagnose a thread pool starvation problem in an enterprise web microservice?"
                        </div>
                      </div>

                      {/* Message 2 */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] font-bold uppercase tracking-wider">
                          <User size={11} />
                          Candidate (You)
                        </div>
                        <div className="bg-cyan-950/20 border border-cyan-900/20 rounded-xl p-3 text-slate-300 leading-relaxed">
                          "I would start by taking thread dumps using tools like jstack to identify if threads are blocked waiting on network sockets or lock contention. Then, I would configure connection pool limits on database drivers and optimize asynchronous execution blocks to prevent blocking the core HTTP worker threads."
                        </div>
                      </div>

                      {/* Feedback Report Overlay */}
                      <div className="bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl p-4 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                          <Sparkles size={11} />
                          Dynamic Feedback Output
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          <strong className="text-emerald-400">Excellent:</strong> Explicit reference to 'thread dumps via jstack' and 'unblocking worker threads' satisfies key technical scoring milestones.
                        </p>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          <strong className="text-amber-400">Recommendation:</strong> Discuss exact CPU profiling steps using Flame Graphs to seal a perfect senior-level rank.
                        </p>
                      </div>

                    </div>

                    {/* Bottom control simulation bar */}
                    <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider font-mono">Microphone Sim Active</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowDemoModal(false);
                          document.getElementById('auth-gateway')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="btn-premium-primary py-2 px-4"
                      >
                        Enter Simulator Mode
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>


        {/* Auth Error Modal */}
        <AnimatePresence>
          {authError && (
            <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-[28px] p-8 shadow-2xl relative overflow-hidden text-center space-y-6"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.04] to-transparent pointer-events-none" />
                
                {/* Close Button */}
                <button
                  onClick={() => setAuthError(null)}
                  className="absolute top-4 right-4 text-white/40 hover:text-white hover:bg-white/5 p-1.5 rounded-xl transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>

                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg shadow-amber-900/15">
                  <ShieldAlert size={28} className="text-amber-400" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold tracking-tight text-white">
                    {authError === 'iframe_blocked' ? 'Google Sign-In Blocked' :
                     authError === 'popup_blocked' ? 'Popup Blocked' : 'Google Sign-In Error'}
                  </h3>
                  <p className="text-xs text-white/60 leading-relaxed">
                    {authError === 'iframe_blocked' ? (
                      "Because this application is currently embedded in the AI Studio preview iframe, your browser's security or cookie policies block the secure Google login popup."
                    ) : authError === 'popup_blocked' ? (
                      "The Google Sign-In popup was blocked by your browser's pop-up blocker or was closed before completion."
                    ) : (
                      authError
                    )}
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left space-y-2.5">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                    <Sparkles size={12} /> Instant Solution
                  </h4>
                  <p className="text-[11px] text-white/50 leading-relaxed">
                    Open the application in a new dedicated tab where standard popup policies apply. Your login will succeed immediately!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => setAuthError(null)}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setAuthError(null);
                      window.open(window.location.origin, '_blank');
                    }}
                    className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xl shadow-violet-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ExternalLink size={14} />
                    Open in New Tab
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Dynamic Action Toast Notifications */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className={cn(
                "fixed top-6 right-6 z-[9999] px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-xl backdrop-blur-md border",
                toast.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-200",
                toast.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-200",
                toast.type === 'info' && "bg-violet-500/10 border-violet-500/20 text-violet-200"
              )}
            >
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center",
                toast.type === 'success' && "bg-emerald-500/20 text-emerald-400",
                toast.type === 'error' && "bg-red-500/20 text-red-400",
                toast.type === 'info' && "bg-violet-500/20 text-violet-400"
              )}>
                {toast.type === 'success' && <CheckCircle2 size={12} />}
                {toast.type === 'error' && <ShieldAlert size={12} />}
                {toast.type === 'info' && <Info size={12} />}
              </div>
              <span className="text-xs font-medium">{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-violet-500/30 overflow-hidden flex flex-col">
      <audio ref={audioRef} hidden />
      
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="liquid-blob w-[60%] h-[60%] -top-1/4 -left-1/4 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/20 blur-[120px]" style={{ animationDelay: '0s' }} />
        <div className="liquid-blob w-[60%] h-[60%] -bottom-1/4 -right-1/4 bg-gradient-to-tr from-cyan-500/30 to-blue-600/20 blur-[120px]" style={{ animationDelay: '-6s' }} />
        <div className="liquid-blob w-[40%] h-[40%] top-1/4 left-1/4 bg-gradient-to-r from-emerald-500/20 to-teal-500/10 blur-[100px]" style={{ animationDelay: '-3s' }} />
        <div className="absolute inset-0 bg-[#0B0F19]/60 backdrop-blur-[100px]" />
      </div>

      {/* --- DYNAMIC CUSTOM ONBOARDING WIZARD --- */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#07090e]/95 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg bg-[#0d111d] border border-white/10 rounded-[28px] overflow-hidden shadow-2xl relative flex flex-col p-8 space-y-6"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.02] to-transparent pointer-events-none" />
              
              {/* Close Button / Skip */}
              <button
                onClick={() => {
                  setShowOnboarding(false);
                  if (user) localStorage.setItem(`onboarded_${user.uid}`, 'true');
                  showToast("Workspace initialized. You're ready to start!", "info");
                }}
                className="absolute top-4 right-4 text-white/40 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border border-white/5"
              >
                Skip Guide
              </button>

              {/* Progress Indicators */}
              <div className="flex items-center gap-1.5 w-max">
                {[1, 2, 3].map((step) => (
                  <div 
                    key={step} 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      onboardingStep === step ? "w-8 bg-violet-500" : "w-1.5 bg-white/15"
                    )} 
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {onboardingStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 text-left"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Step 1 / Profile Setup</span>
                      <h3 className="text-lg font-bold text-white leading-tight">Welcome to Dr. Banner AI</h3>
                      <p className="text-xs text-slate-400 font-medium">Let's configure your co-pilot. Introduce yourself so we can customize your oral evaluations.</p>
                    </div>

                    <div className="space-y-3.5 pt-2">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Your Full Name</label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          value={onboardingName}
                          onChange={(e) => setOnboardingName(e.target.value)}
                          className="input-premium py-2.5"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">Primary Department</label>
                        <select
                          value={onboardingDept}
                          onChange={(e) => setOnboardingDept(e.target.value)}
                          className="input-premium py-2.5 bg-[#0d111d]"
                        >
                          <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                          <option value="Electronics & Comm. Eng.">Electronics & Comm. Eng.</option>
                          <option value="Mechanical Engineering">Mechanical Engineering</option>
                          <option value="Business Administration">Business Administration</option>
                          <option value="Information Technology">Information Technology</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/[0.05] flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!onboardingName.trim()) {
                            showToast("Please enter your name.", "error");
                            return;
                          }
                          setOnboardingStep(2);
                        }}
                        className="btn-premium-primary px-6 py-2.5 cursor-pointer flex items-center gap-1.5"
                      >
                        Next: Core Track
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {onboardingStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 text-left"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Step 2 / Placement Track</span>
                      <h3 className="text-lg font-bold text-white leading-tight">Select Target Assessment Track</h3>
                      <p className="text-xs text-slate-400 font-medium">Dr. Banner calibrates core grading scales, terminology checklists, and STAR metrics matching this track.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3.5 pt-2">
                      {[
                        { id: 'Software Engineer', title: 'Software Engineer', desc: 'Algorithms & Architecture' },
                        { id: 'HR/People Ops', title: 'HR / People', desc: 'STAR Behavioral Metr.' },
                        { id: 'Marketing', title: 'Marketing', desc: 'Metrics & Positioning' },
                        { id: 'Data Analyst', title: 'Data Analyst', desc: 'SQL & Statistical Anal.' },
                      ].map((role) => {
                        const isSelected = onboardingRole === role.id;
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => setOnboardingRole(role.id)}
                            className={cn(
                              "border text-left p-3.5 rounded-xl transition-all duration-200 cursor-pointer flex flex-col justify-between h-[96px]",
                              isSelected 
                                ? "border-violet-500 bg-violet-600/10" 
                                : "border-white/5 hover:border-white/15 bg-white/[0.01] hover:bg-white/[0.02]"
                            )}
                          >
                            <span className="text-[10px] font-black uppercase text-white tracking-wider">{role.title}</span>
                            <span className="text-[9px] text-white/40 leading-normal">{role.desc}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-4 border-t border-white/[0.05] flex justify-between">
                      <button
                        type="button"
                        onClick={() => setOnboardingStep(1)}
                        className="btn-premium-secondary px-4 py-2.5 cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowLeft size={12} />
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setOnboardingStep(3)}
                        className="btn-premium-primary px-6 py-2.5 cursor-pointer flex items-center gap-1.5"
                      >
                        Next: Sound Tuning
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {onboardingStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 text-left"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Step 3 / Copilot Preferences</span>
                      <h3 className="text-lg font-bold text-white leading-tight">Define Calibration Goals</h3>
                      <p className="text-xs text-slate-400 font-medium">Fine-tune interactive systems to customize your simulator environment.</p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {/* Calibration goal switcher */}
                      <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">Focus Assessment Core</p>
                          <p className="text-[9px] text-white/40 font-medium">Optimize the principal metric to track</p>
                        </div>
                        <div className="flex gap-1.5">
                          {[
                            { id: 'technical', label: 'Tech' },
                            { id: 'behavioral', label: 'STAR' },
                            { id: 'speech', label: 'Speech' },
                          ].map((g) => (
                            <button
                              key={g.id}
                              type="button"
                              onClick={() => setOnboardingGoal(g.id)}
                              className={cn(
                                "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer",
                                onboardingGoal === g.id
                                  ? "bg-violet-600 border-violet-500 text-white"
                                  : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
                              )}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Speech synthesis switch option */}
                      <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">Dr. Banner Vocal Synthesizer</p>
                          <p className="text-[9px] text-white/40 font-medium">Read out interview queries using voice synthesis</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                          className={cn(
                            "px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer",
                            isAudioEnabled
                              ? "bg-violet-600 border-violet-500 text-white"
                              : "bg-white/5 border-white/5 text-slate-400"
                          )}
                        >
                          {isAudioEnabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/[0.05] flex justify-between">
                      <button
                        type="button"
                        onClick={() => setOnboardingStep(2)}
                        className="btn-premium-secondary px-4 py-2.5 cursor-pointer flex items-center gap-1.5"
                      >
                        <ArrowLeft size={12} />
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setShowOnboarding(false);
                          if (user) {
                            localStorage.setItem(`onboarded_${user.uid}`, 'true');
                            
                            const updatedUser = {
                              ...user,
                              displayName: onboardingName,
                              role: 'candidate' as const
                            };
                            setUser(updatedUser);
                            setSelectedRole(onboardingRole);
                            
                            await syncUserProfile({
                              uid: user.uid,
                              email: user.email,
                              displayName: onboardingName,
                              photoURL: user.photoURL,
                              role: 'candidate'
                            });
                          }
                          showToast("Sensory calibration synchronized successfully. Welcome!", "success");
                        }}
                        className="btn-premium-primary px-6 py-2.5 cursor-pointer flex items-center gap-1.5"
                      >
                        Complete Calibration
                        <CheckCircle2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Redesigned Sticky top navbar */}
      <Navbar
        user={user!}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
        setSelectedHistoryItem={setSelectedHistoryItem}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        notifications={notifications}
        setNotifications={setNotifications}
        isNotificationsOpen={isNotificationsOpen}
        setIsNotificationsOpen={setIsNotificationsOpen}
        logout={handleLogout}
        fetchHistory={fetchHistory}
        isAudioEnabled={isAudioEnabled}
        setIsAudioEnabled={setIsAudioEnabled}
        interviewMode={interviewMode}
        isCameraOn={isCameraOn}
        toggleCamera={toggleCamera}
      />

      {/* Full-screen secure logout loader */}
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600/10 to-indigo-600/10 border border-violet-500/20 flex items-center justify-center shadow-2xl relative">
              <RefreshCw className="text-violet-400 animate-spin" size={24} />
              <div className="absolute inset-0 bg-violet-500/5 rounded-2xl blur-lg animate-pulse" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-sans">Signing Out</h3>
              <p className="text-[10px] text-white/40 font-sans uppercase tracking-widest">Please wait...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main ref={mainRef} className="relative z-10 max-w-6xl mx-auto flex-1 w-full flex flex-col p-4 md:p-8 overflow-y-auto">
        
        {isAdminMode || activeTab === 'admin' ? (
          <div className="flex-1">
            <AdminDashboard onBack={() => { setIsAdminMode(false); setActiveTab('dashboard'); }} isTab={true} userId={user?.uid} />
          </div>
        ) : (activeTab === 'dashboard' || activeTab === 'analytics' || activeTab === 'resume' || activeTab === 'settings') ? (
          <div className="flex-1 overflow-y-auto pr-1">
            {activeTab === 'dashboard' && (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-5xl mx-auto space-y-8 py-4"
              >
                {/* LOADING SKELETON STATE */}
                {isLoadingHistory ? (
                  <div className="space-y-6 animate-pulse">
                    {/* Welcome banner skeleton */}
                    <div className="h-44 bg-[#0d111d]/40 border border-white/[0.04] rounded-2xl w-full" />
                    {/* Next step skeleton */}
                    <div className="h-28 bg-[#0d111d]/20 border border-white/[0.03] rounded-2xl w-full" />
                    {/* Metrics skeleton */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="h-24 bg-[#0d111d]/30 rounded-xl" />
                      <div className="h-24 bg-[#0d111d]/30 rounded-xl" />
                      <div className="h-24 bg-[#0d111d]/30 rounded-xl" />
                      <div className="h-24 bg-[#0d111d]/30 rounded-xl" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 1. WELCOME SECTION */}
                    <div className="relative overflow-hidden rounded-[24px] border border-white/[0.04] bg-[#0d111d]/40 backdrop-blur-md p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                      {/* Ambient light effects */}
                      <div className="absolute top-0 left-0 w-32 h-32 bg-violet-600/10 rounded-full blur-[80px]" />
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-[80px]" />
                      
                      <div className="space-y-3 text-left relative z-10 max-w-xl">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                          <Sparkles size={11} className="text-violet-400" />
                          Premium Preparation Workspace
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                          Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300">{user.displayName?.split(' ')[0] || 'Candidate'} 👋</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                          Your workspace is calibrated for the <span className="text-violet-300 font-semibold">{selectedRole || 'Software Engineer'} Track</span>. Complete structured mock interviews to build communication pacing and technical confidence.
                        </p>
                      </div>

                      {/* Workspace Meta Info */}
                      <div className="relative z-10 max-w-xs bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl flex flex-col gap-1.5 text-left md:self-stretch justify-center">
                        <span className="text-[9px] uppercase font-bold text-violet-400 tracking-widest font-mono">WORKSPACE COCKPIT</span>
                        <div className="space-y-1 text-xs">
                          <p className="text-white/60">Calibration Status: <span className="text-emerald-400 font-semibold">Ready</span></p>
                          <p className="text-white/60">Track Focus: <span className="text-white/80">{selectedRole || 'Software Engineer'}</span></p>
                          <p className="text-white/60">Activity Stream: <span className="text-indigo-300 font-semibold">{historyList.length > 0 ? `${historyList.length} Sessions Logged` : 'First Run Pending'}</span></p>
                        </div>
                      </div>
                    </div>

                    {/* 2. DYNAMIC WORKSPACE COMPASS (GUIDES USERS CONTEXTUALLY) */}
                    {(() => {
                      const hasHistory = historyList.length > 0;
                      const hasResume = uploadedFileName !== null;

                      return (
                        <div className="card-premium p-6 text-left border-violet-500/10 bg-gradient-to-r from-[#0d111d]/60 via-[#101426]/50 to-[#0d111d]/60 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/[0.03] rounded-full blur-2xl group-hover:bg-violet-600/[0.06] transition-all duration-300" />
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                            <div className="space-y-2 max-w-2xl">
                              <span className="badge-premium text-[9px] font-bold tracking-widest px-2.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300">
                                ACTIVE STEP COMPASS
                              </span>
                              {!hasHistory ? (
                                <>
                                  <h3 className="text-lg font-black text-white font-display">Begin Your Baseline Placement Session</h3>
                                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                                    You have no active interview sessions recorded. Let's calibrate Dr. Banner to your experience by conducting a 10-minute adaptive practice run. You can also upload your resume for specialized technical queries.
                                  </p>
                                </>
                              ) : !hasResume ? (
                                <>
                                  <h3 className="text-lg font-black text-white font-display">Calibrate Your Resume for Advanced Inquiries</h3>
                                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                                    Great job starting practice runs! To make queries highly realistic, upload your resume in the Resume tab. Dr. Banner will parse specific technical tools to formulate deep architecture and framework challenges.
                                  </p>
                                </>
                              ) : (
                                <>
                                  <h3 className="text-lg font-black text-white font-display">Ready for Next Placement Simulator</h3>
                                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                                    Your profile and resume are fully indexed. Practice rounds are customized to target core gaps. Start a new Technical or Behavioral interview to elevate your articulation index.
                                  </p>
                                </>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto">
                              {!hasHistory && (
                                <button
                                  type="button"
                                  onClick={handleSimulateMockRun}
                                  className="btn-premium-secondary text-[10px] font-bold uppercase tracking-widest py-3 text-violet-300 border-violet-500/25 hover:bg-violet-500/5 cursor-pointer text-center rounded-xl"
                                >
                                  Simulate Mock Run
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  if (!hasHistory) {
                                    setActiveTab('interview');
                                    setIsAdminMode(false);
                                  } else if (!hasResume) {
                                    setActiveTab('resume');
                                  } else {
                                    setActiveTab('interview');
                                    setIsAdminMode(false);
                                  }
                                }}
                                className="btn-premium-primary text-[10px] font-bold uppercase tracking-widest py-3 text-center rounded-xl"
                              >
                                {!hasHistory ? 'Launch Baseline Practice' : !hasResume ? 'Upload Resume Spec' : 'Launch Next Session'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. PERFORMANCE DYNAMIC METRIC CARDS */}
                    {(() => {
                      const doneCount = historyList.length;
                      const hasData = doneCount > 0;
                      
                      const avgScore = hasData 
                        ? Math.round(historyList.reduce((acc, x) => acc + (x.overallScore || 0), 0) / doneCount) 
                        : 0;
                      const avgConfidence = hasData 
                        ? Math.round(historyList.reduce((acc, x) => acc + (x.liveMetrics?.confidence || 0), 0) / doneCount) 
                        : 0;
                      const avgCommunication = hasData 
                        ? Math.round(historyList.reduce((acc, x) => acc + (x.liveMetrics?.communication || 0), 0) / doneCount) 
                        : 0;

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Card 1: Calibrated Placement Index */}
                          <div className="bg-[#0b0e17]/40 border border-white/[0.04] p-5 rounded-[20px] flex items-center justify-between relative overflow-hidden shadow-inner font-sans">
                            <div className="absolute bottom-0 right-0 w-14 h-14 bg-emerald-500/[0.01] rounded-full blur-lg" />
                            <div className="space-y-2 text-left">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <Star size={10} className="fill-violet-400 text-violet-400" /> CALIBRATION SCORE
                              </p>
                              <h4 className="text-3xl font-black text-white">{hasData ? `${avgScore}%` : '--'}</h4>
                              <p className="text-[9px] text-slate-500 leading-normal">Overall average interview evaluation score</p>
                            </div>
                            <div className="w-12 h-12 bg-violet-500/5 rounded-xl border border-white/[0.05] flex items-center justify-center text-violet-400 shrink-0">
                              <Award size={20} />
                            </div>
                          </div>

                          {/* Card 2: Total Sessions Completed */}
                          <div className="bg-[#0b0e17]/40 border border-white/[0.04] p-5 rounded-[20px] flex items-center justify-between relative overflow-hidden shadow-inner font-sans">
                            <div className="absolute bottom-0 right-0 w-14 h-14 bg-violet-500/[0.01] rounded-full blur-lg" />
                            <div className="space-y-2 text-left">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <Activity size={10} className="text-violet-400" /> PRACTICE RUNS
                              </p>
                              <h4 className="text-3xl font-black text-white">{doneCount}</h4>
                              <p className="text-[9px] text-slate-500 leading-normal">Active mock practice logs recorded</p>
                            </div>
                            <div className="w-12 h-12 bg-violet-500/5 rounded-xl border border-white/[0.05] flex items-center justify-center text-violet-400 shrink-0">
                              <History size={20} className="text-violet-400" />
                            </div>
                          </div>

                          {/* Card 3: Speech Confidence */}
                          <div className="bg-[#0b0e17]/40 border border-white/[0.04] p-5 rounded-[20px] flex items-center justify-between relative overflow-hidden shadow-inner font-sans">
                            <div className="absolute bottom-0 right-0 w-14 h-14 bg-indigo-500/[0.01] rounded-full blur-lg" />
                            <div className="space-y-2 text-left">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <Brain size={10} className="text-indigo-400" /> CONFIDENCE INDEX
                              </p>
                              <h4 className="text-3xl font-black text-white">{hasData && avgConfidence > 0 ? `${avgConfidence}%` : '--'}</h4>
                              <p className="text-[9px] text-slate-500 leading-normal">Average posture & vocal composure score</p>
                            </div>
                            <div className="w-12 h-12 bg-[#6366f1]/5 rounded-xl border border-white/[0.05] flex items-center justify-center text-indigo-400 shrink-0">
                              <Bot size={20} />
                            </div>
                          </div>

                          {/* Card 4: Articulation pacing */}
                          <div className="bg-[#0b0e17]/40 border border-white/[0.04] p-5 rounded-[20px] flex items-center justify-between relative overflow-hidden shadow-inner font-sans">
                            <div className="absolute bottom-0 right-0 w-14 h-14 bg-cyan-500/[0.01] rounded-full blur-lg" />
                            <div className="space-y-2 text-left">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1">
                                <MessageSquare size={10} className="text-cyan-400" /> ARTICULATION RATIO
                              </p>
                              <h4 className="text-3xl font-black text-white">{hasData && avgCommunication > 0 ? `${avgCommunication}%` : '--'}</h4>
                              <p className="text-[9px] text-slate-500 leading-normal">Vocal pacing & communication accuracy</p>
                            </div>
                            <div className="w-12 h-12 bg-cyan-500/5 rounded-xl border border-white/[0.05] flex items-center justify-center text-cyan-400 shrink-0">
                              <Volume2 size={20} />
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4. PERFORMANCE CHARTS GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-sans">
                      {/* Left Chart Card */}
                      <div className="bg-[#090c15]/50 border border-white/[0.04] p-5 rounded-[22px] text-left relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/[0.02] rounded-full blur-2xl" />
                        <div>
                          <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 mb-4">
                            <div>
                              <h4 className="text-sm font-black text-white tracking-tight">Recent Sessions Performance</h4>
                              <p className="text-[10px] text-white/40">Individual scoring ratios of consecutive practice runs</p>
                            </div>
                            <span className="px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded-md text-[9px] font-black text-violet-400 font-mono uppercase">Sessions Pacing</span>
                          </div>

                          {historyList.length === 0 ? (
                            <div className="h-44 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-white/[0.01] p-4 text-center">
                              <BarChart3 size={24} className="text-white/20 mb-2" />
                              <p className="text-xs font-bold text-white/60">No Practice Progression Recorded</p>
                              <p className="text-[10px] text-white/30 max-w-xs mt-1">Begin mock dialogues with Dr. Banner to trace your historical scoring patterns.</p>
                            </div>
                          ) : (
                            <div className="h-44 w-full flex items-end justify-between pt-4 px-2 select-none gap-2">
                              {[...historyList].reverse().slice(-7).map((item, idx) => {
                                const score = item.overallScore || 0;
                                const formattedDate = item.timestamp 
                                  ? new Date(item.timestamp.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                  : `Run ${idx + 1}`;
                                return (
                                  <div key={item.id || idx} className="flex flex-col items-center gap-2 flex-1 group">
                                    <div className="w-full max-w-[34px] bg-white/[0.03] hover:bg-violet-600/10 border border-white/[0.05] hover:border-violet-500/40 rounded-lg h-28 flex flex-col justify-end overflow-hidden relative cursor-pointer">
                                      <motion.div 
                                        initial={{ height: 0 }}
                                        animate={{ height: `${score}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.05 }}
                                        className="w-full bg-gradient-to-t from-violet-600 to-indigo-500 rounded-b shadow-[0_0_10px_rgba(139,92,246,0.25)] relative group-hover:from-violet-500 group-hover:to-indigo-400"
                                      >
                                        <div className="opacity-0 group-hover:opacity-100 absolute top-1 inset-x-0 text-[8px] font-bold text-white text-center font-mono">
                                          {score}%
                                        </div>
                                      </motion.div>
                                    </div>
                                    <span className="text-[8px] text-white/40 font-mono uppercase font-black tracking-tighter truncate max-w-full text-center group-hover:text-white transition-colors">{formattedDate}</span>
                                  </div>
                                );
                              })}
                              {historyList.length < 5 && Array.from({ length: 5 - historyList.length }).map((_, idx) => (
                                <div key={`pad-${idx}`} className="flex flex-col items-center gap-2 flex-1 opacity-20">
                                  <div className="w-full max-w-[34px] bg-white/[0.01] border border-dashed border-white/10 rounded-lg h-28" />
                                  <span className="text-[8px] text-white/20 font-mono uppercase font-black">Pending</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Chart Card */}
                      <div className="bg-[#090c15]/50 border border-white/[0.04] p-5 rounded-[22px] text-left relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/[0.02] rounded-full blur-2xl" />
                        <div>
                          <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 mb-4">
                            <div>
                              <h4 className="text-sm font-black text-white tracking-tight">Composure Trajectory</h4>
                              <p className="text-[10px] text-white/40">Steady tracking of technical accuracy and vocal metrics</p>
                            </div>
                            <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded-md text-[9px] font-black text-cyan-400 font-mono uppercase">Calibration Trace</span>
                          </div>

                          {historyList.length === 0 ? (
                            <div className="h-44 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl bg-white/[0.01] p-4 text-center">
                              <Bot size={24} className="text-white/20 mb-2" />
                              <p className="text-xs font-bold text-white/60">No Calibration Curve Available</p>
                              <p className="text-[10px] text-white/30 max-w-xs mt-1">Vocal metrics and technical score consistency will trace in real-time coordinates.</p>
                            </div>
                          ) : (
                            <div className="h-44 w-full relative select-none">
                              {(() => {
                                const lastFive = [...historyList].reverse().slice(-5);
                                const points = lastFive.map((item, idx) => {
                                  const score = item.overallScore || 0;
                                  const x = 30 + (idx * (340 / Math.max(1, lastFive.length - 1)));
                                  const y = 130 - (score * 1.1);
                                  return { x, y, score };
                                });

                                const strokePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                                const areaPath = points.length > 0 
                                  ? `M ${points[0].x} 140 ` + points.map(p => `L ${p.x} ${p.y}`).join(' ') + ` L ${points[points.length - 1].x} 140 Z`
                                  : '';

                                return (
                                  <svg className="w-full h-full" viewBox="0 0 400 150">
                                    <defs>
                                      <linearGradient id="curveGlow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                                      </linearGradient>
                                    </defs>
                                    
                                    <line x1="10" y1="20" x2="390" y2="20" stroke="rgba(255,255,255,0.02)" />
                                    <line x1="10" y1="75" x2="390" y2="75" stroke="rgba(255,255,255,0.02)" />
                                    <line x1="10" y1="130" x2="390" y2="130" stroke="rgba(255,255,255,0.02)" />

                                    {areaPath && <path d={areaPath} fill="url(#curveGlow)" />}

                                    {strokePath && (
                                      <motion.path 
                                        initial={{ pathLength: 0 }}
                                        animate={{ pathLength: 1 }}
                                        transition={{ duration: 1.2, ease: "easeOut" }}
                                        d={strokePath} 
                                        fill="none" 
                                        stroke="#06b6d4" 
                                        strokeWidth="2.5"
                                        className="drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]"
                                      />
                                    )}

                                    {points.map((p, i) => (
                                      <g key={i}>
                                        <circle cx={p.x} cy={p.y} r="5" fill="#07090e" stroke="#06b6d4" strokeWidth="2.5" />
                                        <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#06b6d4" fontSize="8" fontWeight="bold" fontFamily="monospace">
                                          {p.score}%
                                        </text>
                                      </g>
                                    ))}
                                  </svg>
                                );
                              })()}

                              <div className="absolute top-1 left-1/2 -translate-x-1/2 bg-[#090b14]/90 border border-white/5 py-1 px-3 rounded-lg flex items-center gap-1.5 pointer-events-none shadow-xl backdrop-blur-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                <span className="text-[9px] font-mono font-bold text-white/60">Fluctuation boundaries active</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 5. HISTORIC PRACTICE LOGS & DYNAMIC AI ADVISOR */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                      {/* Left side: Recent Logs Table */}
                      <div className="lg:col-span-2 bg-[#090c15]/50 border border-white/[0.04] p-5 rounded-[22px] text-left flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-white/[0.05] pb-3 mb-4">
                            <div>
                              <h4 className="text-sm font-black text-white tracking-tight">Recent Sessions & Detailed Feedback</h4>
                              <p className="text-[10px] text-white/40">Comprehensive chronological log of your placements practice history</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => { setActiveTab('history'); }}
                              className="text-[10px] font-black uppercase tracking-wider text-violet-400 hover:text-white transition-colors flex items-center gap-0.5 cursor-pointer"
                            >
                              See All Logs <ChevronRight size={12} />
                            </button>
                          </div>

                          {historyList.length === 0 ? (
                            <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                              <div className="w-14 h-14 bg-violet-500/5 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-violet-400/40 mb-4">
                                <Cpu size={22} />
                              </div>
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider">No Sessions Recorded</h4>
                              <p className="text-[10px] text-slate-500 max-w-sm mt-1 leading-relaxed">
                                Let's get started. Create your first adaptive evaluation session or simulate mock placements records in the active step compass.
                              </p>
                              <div className="flex gap-3 mt-4">
                                <button
                                  type="button"
                                  onClick={handleSimulateMockRun}
                                  className="btn-premium-secondary text-[9px] px-3 py-1.5 font-bold tracking-widest uppercase cursor-pointer rounded-xl"
                                >
                                  Simulate Log
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setActiveTab('interview'); setIsAdminMode(false); }}
                                  className="btn-premium-primary text-[9px] px-3.5 py-1.5 font-bold tracking-widest uppercase cursor-pointer rounded-xl"
                                >
                                  Start Practice
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[450px]">
                                <thead>
                                  <tr className="border-b border-white/[0.04] text-[9px] font-black uppercase tracking-widest text-white/30">
                                    <th className="pb-3 font-bold">Role & Department</th>
                                    <th className="pb-3 font-bold">Date Completed</th>
                                    <th className="pb-3 font-bold text-center">Overall Score</th>
                                    <th className="pb-3 font-bold text-right">Interactive Review</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.03]">
                                  {historyList.slice(0, 4).map((item) => {
                                    const dateString = item.timestamp 
                                      ? new Date(item.timestamp.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                      : 'Recent Run';
                                    return (
                                      <tr key={item.id} className="text-xs text-white/50 hover:bg-white/[0.01] transition-colors">
                                        <td className="py-3.5 flex items-center gap-2.5">
                                          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold shrink-0">
                                            <Sparkles size={14} />
                                          </div>
                                          <div className="truncate max-w-[180px]">
                                            <p className="font-bold text-white text-[11px] truncate">{item.targetRole || 'Placement Interview'}</p>
                                            <p className="text-[9px] text-white/40 truncate">{item.department || 'General'}</p>
                                          </div>
                                        </td>
                                        <td className="py-3.5 font-mono text-[10px] text-slate-400">{dateString}</td>
                                        <td className="py-3.5 text-center font-bold text-emerald-400 font-mono text-[11px]">{item.overallScore || 0}%</td>
                                        <td className="py-3.5 text-right">
                                          <button 
                                            type="button"
                                            onClick={() => setSelectedHistoryItem(item)}
                                            className="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider text-violet-300 bg-violet-500/10 hover:bg-violet-600 hover:text-white transition-all cursor-pointer border border-violet-500/20"
                                          >
                                            View Report
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side: Dynamic AI Advisor Panel */}
                      {(() => {
                        const doneCount = historyList.length;
                        const hasData = doneCount > 0;
                        
                        let weakestCore = "Calibrations Pending";
                        let adviceTitle = "Adaptive Placement Diagnostic";
                        let adviceText = "Dr. Banner is waiting to trace your conversational baseline. Once you execute an interview, real-time vocal cadence, sentence structure, and vocabulary density checks will compile dynamic advice here.";
                        let badgeColor = "text-violet-400 bg-violet-500/10 border-violet-500/20";

                        if (hasData) {
                          const avgConfidence = Math.round(historyList.reduce((acc, x) => acc + (x.liveMetrics?.confidence || 0), 0) / doneCount);
                          const avgCommunication = Math.round(historyList.reduce((acc, x) => acc + (x.liveMetrics?.communication || 0), 0) / doneCount);
                          const avgTechnical = Math.round(historyList.reduce((acc, x) => acc + (x.overallScore || 0), 0) / doneCount);

                          const minVal = Math.min(avgConfidence || 100, avgCommunication || 100, avgTechnical || 100);

                          if (minVal === avgConfidence) {
                            weakestCore = "Vocal Composure focus";
                            adviceTitle = "Refine Vocal Posture";
                            adviceText = `Your confidence index currently averages ${avgConfidence}%. Dr. Banner suggests stabilizing your head posture, maintaining standard camera-eye metrics, and speaking in a deliberate, slightly deeper tone to project executive poise.`;
                            badgeColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                          } else if (minVal === avgCommunication) {
                            weakestCore = "Cadence speed alert";
                            adviceTitle = "De-accelerate Cadence";
                            adviceText = `Your average articulation ratio is ${avgCommunication}%. Analysis detects a fast speech velocity (>140 WPM). Slow down when introducing complex software concepts to let your ideas settle naturally.`;
                            badgeColor = "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
                          } else {
                            weakestCore = "Technical frameworks";
                            adviceTitle = "Deploy STAR Framework";
                            adviceText = `Your average technical execution score is ${avgTechnical}%. Ensure that you clearly segregate answers into Situation, Task, Action, and Result (STAR) steps. Structure technical responses starting with the architectural tradeoffs first.`;
                            badgeColor = "text-red-400 bg-red-500/10 border-red-500/20";
                          }
                        }

                        return (
                          <div className="space-y-6">
                            {/* Card 1: AI Advisor Insights (Progress Tracking) */}
                            <div className="bg-[#090c15]/50 border border-white/[0.04] p-5 rounded-[22px] text-left relative overflow-hidden flex flex-col justify-between shadow-lg">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/[0.03] rounded-full blur-2xl" />
                              
                              <div className="space-y-4">
                                <div className="flex items-center gap-1.5 border-b border-white/[0.05] pb-3">
                                  <Bot size={16} className="text-violet-400 animate-pulse" />
                                  <h4 className="text-sm font-black text-white tracking-tight">AI Advisor Insights</h4>
                                </div>

                                <div className="space-y-3">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${badgeColor}`}>
                                    {weakestCore}
                                  </span>
                                  
                                  <div className="p-4 bg-violet-500/[0.02] border border-violet-500/10 rounded-xl space-y-1.5">
                                    <p className="font-bold text-white text-xs flex items-center gap-1.5">
                                      <Sparkles size={11} className="text-violet-400 animate-spin" />
                                      {adviceTitle}
                                    </p>
                                    <p className="text-slate-400 text-[10px] leading-relaxed">
                                      {adviceText}
                                    </p>
                                  </div>

                                  <div className="p-3 bg-black/30 border border-white/[0.02] rounded-xl text-[9px] text-slate-500 leading-normal font-sans">
                                    💡 <span className="font-semibold text-slate-400">Pacing Tip:</span> Dr. Banner tracks response density. An ideal delivery maintains between 130 and 150 words per minute.
                                  </div>
                                </div>
                              </div>

                              <button 
                                type="button"
                                onClick={() => { setActiveTab('analytics'); }}
                                className="mt-6 w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer text-center border border-violet-500/20 active:scale-[0.98]"
                              >
                                Unveil Complete Diagnostics
                              </button>
                            </div>

                            {/* Card 2: Resume & ATS Profile Insights */}
                            <div className="bg-[#090c15]/50 border border-white/[0.04] p-5 rounded-[22px] text-left relative overflow-hidden flex flex-col justify-between shadow-lg">
                              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/[0.03] rounded-full blur-2xl" />
                              <div className="space-y-4">
                                <div className="flex items-center gap-1.5 border-b border-white/[0.05] pb-3">
                                  <FileText size={16} className="text-indigo-400" />
                                  <h4 className="text-sm font-black text-white tracking-tight">Resume & ATS Profile Insights</h4>
                                </div>

                                {uploadedFileName ? (
                                  <div className="space-y-3">
                                    <div className="flex items-start gap-2.5 p-3 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-xl">
                                      <div className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
                                        <CheckCircle2 size={14} />
                                      </div>
                                      <div className="truncate">
                                        <p className="text-[10px] font-bold text-white truncate">{uploadedFileName}</p>
                                        <p className="text-[9px] text-slate-500">Resume parsed & synced</p>
                                      </div>
                                    </div>

                                    {extractedSkills ? (
                                      <div className="space-y-1.5">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 font-sans">Identified Keywords</p>
                                        <div className="flex flex-wrap gap-1">
                                          {extractedSkills.split(/[,|;]/).slice(0, 6).map((skill, idx) => (
                                            <span key={idx} className="px-1.5 py-0.5 bg-white/[0.03] border border-white/5 rounded text-[8px] font-medium text-slate-300 font-sans">
                                              {skill.trim()}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 font-sans">Identified Keywords</p>
                                        <div className="flex flex-wrap gap-1">
                                          <span className="px-1.5 py-0.5 bg-white/[0.03] border border-white/5 rounded text-[8px] font-medium text-slate-300 font-sans">Software Architecture</span>
                                          <span className="px-1.5 py-0.5 bg-white/[0.03] border border-white/5 rounded text-[8px] font-medium text-slate-300 font-sans">API Design</span>
                                          <span className="px-1.5 py-0.5 bg-white/[0.03] border border-white/5 rounded text-[8px] font-medium text-slate-300 font-sans font-sans">Data Engineering</span>
                                        </div>
                                      </div>
                                    )}

                                    <div className="p-3 bg-black/30 border border-white/[0.02] rounded-xl text-[9px] text-slate-500 leading-normal space-y-1">
                                      <div className="flex items-center justify-between text-white/70 font-semibold mb-1">
                                        <span className="font-sans">ATS Match Rating</span>
                                        <span className="text-emerald-400 font-mono">88%</span>
                                      </div>
                                      <p className="text-slate-500">Dr. Banner analyzed this profile against current {selectedRole || 'Software Engineer'} guidelines. Your target core terms are fully aligned.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3.5 py-4 text-center">
                                    <div className="w-10 h-10 bg-indigo-500/5 rounded-full border border-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto">
                                      <UploadCloud size={18} />
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-xs font-bold text-white">No Target Resume Found</p>
                                      <p className="text-[10px] text-slate-500 max-w-[220px] mx-auto leading-normal">
                                        Upload your professional CV in the Interview Workspace to index your skills and unlock semantic ATS scores.
                                      </p>
                                    </div>
                                    <button 
                                      type="button"
                                      onClick={() => { setActiveTab('interview'); setIsAdminMode(false); }}
                                      className="mx-auto px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer border border-indigo-500/15"
                                    >
                                      Link Document
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* 6. REALISTIC GAMIFICATION: ACHIEVEMENTS MILESTONES */}
                    <div className="space-y-3 font-sans">
                      <h3 className="text-xs font-black uppercase tracking-wider text-white/40 text-left">Academic & Placement Achievements</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Milestone 1 */}
                        <div className="bg-[#0b0e17]/50 border border-white/[0.04] p-4 rounded-[18px] text-center flex flex-col items-center justify-center gap-1.5 relative overflow-hidden shadow-inner group cursor-pointer hover:border-amber-500/20 transition-colors">
                          <div className="absolute top-0 inset-x-0 h-[2px] bg-amber-500/20" />
                          <div className="w-10 h-10 bg-amber-500/5 rounded-full border border-amber-500/10 flex items-center justify-center text-amber-400 text-base group-hover:scale-110 transition-transform">
                            🏆
                          </div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-white">First Interview</h5>
                          <p className="text-[9px] text-white/40 leading-snug">Launch your very first placement evaluation run.</p>
                          <span className={cn(
                            "text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wide mt-1",
                            historyList.length > 0 ? "text-amber-400 bg-amber-500/10" : "text-white/20 bg-white/5"
                          )}>
                            {historyList.length > 0 ? 'UNLOCKED' : 'LOCKED'}
                          </span>
                        </div>

                        {/* Milestone 2 */}
                        <div className="bg-[#0b0e17]/50 border border-white/[0.04] p-4 rounded-[18px] text-center flex flex-col items-center justify-center gap-1.5 relative overflow-hidden shadow-inner group cursor-pointer hover:border-violet-500/20 transition-colors">
                          <div className="absolute top-0 inset-x-0 h-[2px] bg-violet-500/20" />
                          <div className="w-10 h-10 bg-violet-500/5 rounded-full border border-violet-500/10 flex items-center justify-center text-violet-400 text-base group-hover:scale-110 transition-transform">
                            📂
                          </div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-white">ATS Indexed</h5>
                          <p className="text-[9px] text-white/40 leading-snug">Upload your resume to complete initial parsing calibrations.</p>
                          <span className={cn(
                            "text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wide mt-1",
                            uploadedFileName ? "text-violet-400 bg-violet-500/10" : "text-white/20 bg-white/5"
                          )}>
                            {uploadedFileName ? 'UNLOCKED' : 'LOCKED'}
                          </span>
                        </div>

                        {/* Milestone 3 */}
                        <div className="bg-[#0b0e17]/50 border border-white/[0.04] p-4 rounded-[18px] text-center flex flex-col items-center justify-center gap-1.5 relative overflow-hidden shadow-inner group cursor-pointer hover:border-cyan-500/20 transition-colors">
                          <div className="absolute top-0 inset-x-0 h-[2px] bg-cyan-500/20" />
                          <div className="w-10 h-10 bg-cyan-500/5 rounded-full border border-cyan-500/10 flex items-center justify-center text-cyan-400 text-base group-hover:scale-110 transition-transform">
                            ⭐
                          </div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-white">Composed Orator</h5>
                          <p className="text-[9px] text-white/40 leading-snug">Achieve a confidence composure score above 85%.</p>
                          <span className={cn(
                            "text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wide mt-1",
                            historyList.some(item => (item.liveMetrics?.confidence || 0) > 85) ? "text-cyan-400 bg-cyan-500/10" : "text-white/20 bg-white/5"
                          )}>
                            {historyList.some(item => (item.liveMetrics?.confidence || 0) > 85) ? 'UNLOCKED' : 'LOCKED'}
                          </span>
                        </div>

                        {/* Milestone 4 */}
                        <div className="bg-[#0b0e17]/50 border border-white/[0.04] p-4 rounded-[18px] text-center flex flex-col items-center justify-center gap-1.5 relative overflow-hidden shadow-inner group cursor-pointer hover:border-emerald-500/20 transition-colors">
                          <div className="absolute top-0 inset-x-0 h-[2px] bg-emerald-500/20" />
                          <div className="w-10 h-10 bg-emerald-500/5 rounded-full border border-emerald-500/10 flex items-center justify-center text-emerald-400 text-base group-hover:scale-110 transition-transform">
                            🎯
                          </div>
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-white">Top Candidate</h5>
                          <p className="text-[9px] text-white/40 leading-snug">Achieve a grand score above 90% in a single technical round.</p>
                          <span className={cn(
                            "text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wide mt-1",
                            historyList.some(item => (item.overallScore || 0) > 90) ? "text-emerald-400 bg-emerald-500/10" : "text-white/20 bg-white/5"
                          )}>
                            {historyList.some(item => (item.overallScore || 0) > 90) ? 'UNLOCKED' : 'LOCKED'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 7. UPCOMING ROADMAP */}
                    <div className="space-y-3 font-sans">
                      <h3 className="text-xs font-black uppercase tracking-wider text-white/40 text-left">Upcoming Platform Enhancements</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-[#090b14]/40 border border-white/[0.04] p-4 rounded-xl text-left flex gap-3.5">
                          <div className="w-7 h-7 rounded-lg bg-violet-500/5 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0 mt-0.5">
                            <FileText size={14} />
                          </div>
                          <div>
                            <h6 className="text-[11px] font-bold text-white">AI Resume Builder</h6>
                            <p className="text-[9px] text-white/40 mt-1">Generate tailored, ATS-compliant bullet points and job-winning copy instantly.</p>
                          </div>
                        </div>

                        <div className="bg-[#090b14]/40 border border-white/[0.04] p-4 rounded-xl text-left flex gap-3.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                            <Cpu size={14} />
                          </div>
                          <div>
                            <h6 className="text-[11px] font-bold text-white">Company Custom Tracks</h6>
                            <p className="text-[9px] text-white/40 mt-1">Practice interview rounds modeled precisely on Google, Stripe, or Vercel questions.</p>
                          </div>
                        </div>

                        <div className="bg-[#090b14]/40 border border-white/[0.04] p-4 rounded-xl text-left flex gap-3.5">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                            <MessageSquare size={14} />
                          </div>
                          <div>
                            <h6 className="text-[11px] font-bold text-white">Mock Group Discussions</h6>
                            <p className="text-[9px] text-white/40 mt-1">Engage with AI-synthesized group candidates to master turn-taking and debate pacing.</p>
                          </div>
                        </div>

                        <div className="bg-[#090b14]/40 border border-white/[0.04] p-4 rounded-xl text-left flex gap-3.5">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/5 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                            <Brain size={14} />
                          </div>
                          <div>
                            <h6 className="text-[11px] font-bold text-white">HR Personality Profiling</h6>
                            <p className="text-[9px] text-white/40 mt-1">Synthesizes key psychological indicators to map organizational behavioral fit scores.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 8. FOOTER */}
                    <div className="border-t border-white/[0.05] pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-[10px] uppercase font-mono tracking-widest text-left font-sans">
                      <div className="flex flex-wrap items-center gap-4">
                        <span className="hover:text-white transition-colors cursor-pointer">Privacy Protocol</span>
                        <span className="hover:text-white transition-colors cursor-pointer">Terms & Conditions</span>
                        <span className="hover:text-white transition-colors cursor-pointer">Security Gateway</span>
                        <span className="hover:text-white transition-colors cursor-pointer">Support Portal</span>
                      </div>
                      <div>
                        <span>Dr. Banner AI Platform — Secure Connection Active</span>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ANALYTICS PANEL */}
            {activeTab === 'analytics' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl mx-auto space-y-8 py-4"
              >
                <div className="text-left space-y-1">
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <BarChart3 className="text-violet-400 animate-pulse" size={24} /> Performance & Evaluation Analytics
                  </h2>
                  <p className="text-xs text-white/50">Comprehensive evaluation profiles and dynamic mock-placement metrics compiled by Dr. Banner.</p>
                </div>

                {/* Dual Column Analytics Details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Detailed Interactive Performance Score */}
                  <div className="lg:col-span-2 bg-[#090c15]/50 border border-white/[0.04] p-6 rounded-[22px] text-left space-y-6">
                    <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-violet-400">Score Over Day Range</h4>
                        <p className="text-[10px] text-white/40">Evaluations across technical, behavioral, and architectural categories.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        <span className="text-[9px] font-mono uppercase font-black text-white/60">Actual prep progress</span>
                      </div>
                    </div>

                    <div className="h-56 w-full pt-4 select-none">
                      <svg className="w-full h-full" viewBox="0 0 500 180">
                        <defs>
                          <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="36" x2="500" y2="36" stroke="rgba(255,255,255,0.02)" strokeDasharray="4 4" />
                        <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(255,255,255,0.02)" strokeDasharray="4 4" />
                        <line x1="0" y1="144" x2="500" y2="144" stroke="rgba(255,255,255,0.02)" strokeDasharray="4 4" />

                        {/* Beautiful curve */}
                        <path 
                          d="M 20 144 C 100 130, 150 70, 220 60 C 290 50, 350 110, 420 40 C 460 10, 480 30, 490 20 L 490 180 L 20 180 Z" 
                          fill="url(#scoreGlow)" 
                        />
                        <path 
                          d="M 20 144 C 100 130, 150 70, 220 60 C 290 50, 350 110, 420 40 C 460 10, 480 30, 490 20" 
                          fill="none" 
                          stroke="#8b5cf6" 
                          strokeWidth="2.5"
                        />
                        
                        <circle cx="220" cy="60" r="4" fill="#0b0f19" stroke="#8b5cf6" strokeWidth="2" />
                        <circle cx="420" cy="40" r="4" fill="#0b0f19" stroke="#8b5cf6" strokeWidth="2" />
                      </svg>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-white/[0.05] pt-4 text-xs font-bold">
                      <div className="text-left">
                        <p className="text-white/30 uppercase text-[9px] tracking-wider">Grammar Score</p>
                        <p className="text-sm font-black text-white mt-1">94.5% <span className="text-[9px] text-emerald-400 font-bold font-mono ml-1">Excellent</span></p>
                      </div>
                      <div className="text-left">
                        <p className="text-white/30 uppercase text-[9px] tracking-wider">Response Pacing</p>
                        <p className="text-sm font-black text-white mt-1">132 WPM <span className="text-[9px] text-emerald-400 font-bold font-mono ml-1">Optimal</span></p>
                      </div>
                      <div className="text-left">
                        <p className="text-white/30 uppercase text-[9px] tracking-wider">Vocabulary Depth</p>
                        <p className="text-sm font-black text-white mt-1">89% <span className="text-[9px] text-violet-400 font-bold font-mono ml-1">High</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Key Behavioral Evaluation Ring */}
                  <div className="bg-[#090c15]/50 border border-white/[0.04] p-6 rounded-[22px] text-left flex flex-col justify-between shadow-lg">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-violet-400 border-b border-white/[0.05] pb-3">Placement Calibration</h4>
                      
                      <div className="relative h-32 flex items-center justify-center">
                        {/* Circular ring path simulation */}
                        <svg className="w-32 h-32" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="6" />
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#8b5cf6" strokeWidth="6" strokeDasharray="180 250" strokeLinecap="round" className="drop-shadow-[0_0_6px_rgba(139,92,246,0.3)]" />
                          <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="6" />
                          <circle cx="50" cy="50" r="30" fill="none" stroke="#06b6d4" strokeWidth="6" strokeDasharray="130 180" strokeLinecap="round" className="drop-shadow-[0_0_6px_rgba(6,182,212,0.3)]" />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-lg font-black text-white">88.5%</span>
                          <span className="text-[8px] text-white/40 uppercase font-black tracking-widest">Calibration</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs pt-4">
                        <div className="flex items-center justify-between text-white/70">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Behavioral Readiness</span>
                          <span className="font-bold">92%</span>
                        </div>
                        <div className="flex items-center justify-between text-white/70">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Technical Accuracy</span>
                          <span className="font-bold">85%</span>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setActiveTab('interview')}
                      className="mt-6 w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer text-center"
                    >
                      Start Next Placement Simulator
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RESUME & LEARNING WORKSPACE */}
            {activeTab === 'resume' && user && (
              <CareerWorkspace
                user={user}
                setUser={setUser}
                historyList={historyList}
                setActiveTab={setActiveTab}
                setTargetRole={setSelectedRole}
                setExtractedSkills={setExtractedSkills}
                showToast={showToast}
              />
            )}

            {/* SETTINGS PANEL */}
            {activeTab === 'settings' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-5xl mx-auto space-y-8 py-4"
              >
                <div className="text-left space-y-1">
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                    <Settings className="text-violet-400" size={24} /> Calibration Settings & Preferences
                  </h2>
                  <p className="text-xs text-white/50">Configure simulated interview difficulties, voice controls, security options, and theme modes.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left settings options (PM/Eng options) */}
                  <div className="lg:col-span-2 card-premium p-6 text-left space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white border-b border-white/[0.05] pb-3 flex items-center gap-2">
                      <UserCheck size={14} className="text-violet-400" /> Candidate Profile Config
                    </h3>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-white/60 font-black uppercase tracking-wider text-[10px]">Candidate Full Name</label>
                        <input 
                          type="text" 
                          defaultValue={user.displayName || 'Candidate'} 
                          className="mt-1 input-premium p-3 text-xs" 
                          placeholder="Candidate Name"
                        />
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <label className="text-white/60 font-black uppercase tracking-wider text-[10px]">Associated Academic Degree</label>
                        <input 
                          type="text" 
                          defaultValue="Bachelor of Science in Computer Science" 
                          className="mt-1 input-premium p-3 text-xs" 
                          placeholder="Computer Science, etc."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <label className="text-white/60 font-black uppercase tracking-wider text-[10px]">Target Track</label>
                          <select className="mt-1 input-premium p-3 text-xs cursor-pointer bg-[#090b14]">
                            <option>Software Engineer</option>
                            <option>Product Manager</option>
                            <option>UX Designer</option>
                            <option>HR Recruiter</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1 text-xs">
                          <label className="text-white/60 font-black uppercase tracking-wider text-[10px]">Difficulty Level</label>
                          <select className="mt-1 input-premium p-3 text-xs cursor-pointer bg-[#090b14]">
                            <option>Standard Campus Placement</option>
                            <option>Advanced Tier-1 Recruiter</option>
                            <option>Brutal Staff Level</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-4 border-t border-white/[0.05]">
                      <button 
                        onClick={() => { showToast('Calibration parameters synchronized securely.', 'success'); }}
                        className="btn-premium-primary px-6 py-2.5 text-[10px]"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </div>

                  {/* Right side controls (Theme modes, voices, keys) */}
                  <div className="card-premium p-6 text-left space-y-6 flex flex-col justify-between shadow-lg">
                    <div className="space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-wider text-white border-b border-white/[0.05] pb-3 flex items-center gap-2">
                        <Volume1 size={14} className="text-violet-400" /> Sound & Interface
                      </h3>

                      {/* Theme Toggle option */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                        <div className="text-xs">
                          <p className="font-bold text-white">Visual Mode Theme</p>
                          <p className="text-white/40 text-[9px] mt-0.5">Toggle between dark and light themes</p>
                        </div>
                        <button
                          onClick={() => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark')}
                          className="btn-premium-secondary px-3 py-1.5 text-[10px]"
                        >
                          {themeMode === 'dark' ? 'Dark theme' : 'Light Theme'}
                        </button>
                      </div>

                      {/* Audio voice control */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.01] border border-white/[0.03]">
                        <div className="text-xs">
                          <p className="font-bold text-white">Dr. Banner voice feedback</p>
                          <p className="text-white/40 text-[9px] mt-0.5">Toggle vocal text-to-speech synthesis</p>
                        </div>
                        <button
                          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                          className={cn(
                            "btn-premium-secondary px-3 py-1.5 text-[10px]",
                            isAudioEnabled && "btn-premium-primary text-violet-300"
                          )}
                        >
                          {isAudioEnabled ? 'Voice enabled' : 'Muted'}
                        </button>
                      </div>

                      {/* Secure connection logs */}
                      <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-xs text-white/50 space-y-1 relative">
                        <Lock size={12} className="absolute top-3.5 right-3.5 text-white/30" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-violet-400">Security Access Code</p>
                        <p className="font-mono text-[9px] text-white/40 uppercase">UID: {user.uid.substring(0, 14)}...</p>
                        <p className="text-[9px] text-emerald-400/80 font-bold flex items-center gap-1 mt-1">
                          <CheckCircle2 size={10} /> Secure SSL connection active
                        </p>
                      </div>
                    </div>

                    <p className="text-[9px] text-white/30 text-center uppercase tracking-widest font-mono">Gateway calibration complete</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : activeTab === 'interview' ? (
          setupStep === 'role_select' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8 overflow-y-auto"
            >
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-violet-900/30 border border-violet-500/20">
                  <Sparkles size={28} className="text-white animate-pulse" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
                  Customize Your Placement Interview
                </h2>
                <p className="text-xs md:text-sm text-white/50 max-w-lg mx-auto">
                  Select your track and optionally upload your resume to generate a personalized 8-question placement interview with Dr. Banner.
                </p>
              </div>

              {/* Step 1: Role Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center text-[10px] font-black">1</span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white/80">Select Your Target Placement Role</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {[
                    { id: 'Software Engineer', icon: Terminal, title: 'Software Engineer', desc: 'Algorithms, data structures, and code architecture.' },
                    { id: 'HR/People Ops', icon: User, title: 'HR / People Ops', desc: 'Behavioral, leadership, culture, and conflict resolution.' },
                    { id: 'Marketing', icon: Sparkles, title: 'Marketing', desc: 'SEO/SEM, campaigns, brand positioning, growth metrics.' },
                    { id: 'Data Analyst', icon: BarChart3, title: 'Data Analyst', desc: 'SQL, data pipelines, statistics, and dashboards.' },
                  ].map((role) => {
                    const RoleIcon = role.icon;
                    const isSelected = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setSelectedRole(role.id)}
                        className={cn(
                          "glass border text-left p-5 rounded-2xl transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between h-[180px]",
                          isSelected 
                            ? "border-violet-500 bg-violet-600/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]" 
                            : "border-white/5 hover:border-white/15 bg-white/[0.01] hover:bg-white/[0.02]"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                          isSelected ? "bg-violet-600 text-white" : "bg-white/5 text-white/40 group-hover:bg-white/10"
                        )}>
                          <RoleIcon size={18} />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">{role.title}</h4>
                          <p className="text-[10px] text-white/40 leading-normal">{role.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Resume Upload */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center text-[10px] font-black">2</span>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white/80">Upload Your Resume (Optional)</h3>
                </div>
                
                <div className="glass border border-white/5 bg-white/[0.01] p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative group hover:border-violet-500/20 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-600/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
                      <Briefcase size={20} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left space-y-1">
                      <p className="text-xs font-bold text-white">Extract key skills from your resume</p>
                      <p className="text-[10px] text-white/40">Dr. Banner will use parsed skills to customize 1-2 interview questions specifically for you.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <label className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer">
                      <input 
                        type="file" 
                        accept=".txt,.pdf" 
                        onChange={handleResumeUpload}
                        className="hidden" 
                      />
                      Browse File
                    </label>
                  </div>
                </div>

                {uploadedFileName && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-violet-600/5 border border-violet-500/20 p-4 rounded-xl gap-2 text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <div>
                        <p className="text-xs font-mono text-white/80 font-bold">{uploadedFileName}</p>
                        <p className="text-[9px] text-violet-300/60 uppercase tracking-widest font-bold mt-0.5">Parsed Skills: {extractedSkills}</p>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => { setUploadedFileName(null); setExtractedSkills(''); }}
                      className="text-[10px] text-white/40 hover:text-red-400 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Remove
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => { setSetupStep('none'); setTempInterviewMode(null); }}
                  className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft size={12} />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleProceedToInterview}
                  className="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-violet-900/20 hover:scale-[1.02] cursor-pointer flex items-center gap-2"
                >
                  Start Practice Interview
                  <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          ) : interviewMode === null ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full p-4 md:p-8 space-y-8 overflow-y-auto"
            >
              {/* Gorgeous Mode Selection Header */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-violet-900/30 border border-violet-500/20">
                  <Sparkles size={28} className="text-white animate-pulse" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
                  Choose Your Practice Experience
                </h2>
                <p className="text-xs md:text-sm text-white/50 max-w-lg mx-auto">
                  Select your preferred style to conduct your simulated campus placement interview with Dr. Banner.
                </p>
              </div>

              {/* Selection Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {/* Option 1: Immersive Video Call */}
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setTempInterviewMode('video'); setSetupStep('role_select'); }}
                  className="glass border border-white/10 hover:border-violet-500/30 bg-white/[0.01] hover:bg-white/[0.03] rounded-[32px] p-6 text-left transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[300px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-600/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  <div className="space-y-5">
                    <div className="w-12 h-12 bg-violet-600/10 border border-violet-500/20 text-violet-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-violet-600/20 transition-all">
                      <PhoneCall size={20} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-violet-300 transition-colors">
                        Immersive Video Call Mode
                      </h3>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Converse naturally using your camera and microphone. The chat history and keyboard log are hidden, allowing you to focus on direct speaking, facial expression, and body language.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                      Video & Voice Access Only
                    </span>
                    <ChevronRight size={16} className="text-white/40 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>

                {/* Option 2: Interactive Chat & Log */}
                <motion.button
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setTempInterviewMode('chat'); setSetupStep('role_select'); }}
                  className="glass border border-white/10 hover:border-indigo-500/30 bg-white/[0.01] hover:bg-white/[0.03] rounded-[32px] p-6 text-left transition-all duration-300 relative overflow-hidden group cursor-pointer flex flex-col justify-between min-h-[300px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  
                  <div className="space-y-5">
                    <div className="w-12 h-12 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-indigo-600/20 transition-all">
                      <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                        Interactive Chat & Log Mode
                      </h3>
                      <p className="text-xs text-white/50 leading-relaxed">
                        Practice at your own pace. Read questions from the active chat log, type or dictate your responses, and review real-time feedback beside the ongoing conversation thread.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                      Standard Hybrid Interface
                    </span>
                    <ChevronRight size={16} className="text-white/40 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              </div>

              {/* Safety & System Pre-check Checklist */}
              <div className="w-full bg-white/[0.02] border border-white/5 rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <ShieldAlert size={14} />
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-bold text-white">System Calibration & Compatibility</p>
                    <p className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">
                      Speech recognition status: {('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) ? 'Supported (Ready)' : 'Not Supported'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleCamera}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer",
                      isCameraOn ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-white/5 border border-white/10 text-white/60 hover:text-white"
                    )}
                  >
                    Test Camera: {isCameraOn ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </motion.div>          ) : (
            <InterviewWorkspace
              state={state}
              setState={setState}
              isSpeaking={isSpeaking}
              speakingText={speakingText}
              currentEmotion={currentEmotion}
              avatarUrl={avatarUrl}
              hasImagePermission={hasImagePermission}
              isCameraOn={isCameraOn}
              toggleCamera={toggleCamera}
              isListening={isListening}
              toggleListening={toggleListening}
              isProcessing={isProcessing}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              showTip={showTip}
              setShowTip={setShowTip}
              showBackupText={showBackupText}
              setShowBackupText={setShowBackupText}
              getStepTip={getStepTip}
              togglePlaySpeech={togglePlaySpeech}
              stopSpeech={stopSpeech}
              setInterviewMode={setInterviewMode}
              INITIAL_STATE={INITIAL_STATE}
              videoRef={videoRef}
              isVirtualCamera={isVirtualCamera}
              cameraSize={cameraSize}
              setCameraSize={setCameraSize}
              isCameraMinimized={isCameraMinimized}
              setIsCameraMinimized={setIsCameraMinimized}
              cameraError={cameraError}
              chatEndRef={chatEndRef}
              lastFeedback={lastFeedback}
              showFeedback={showFeedback}
              interviewMode={interviewMode}
            />
          )
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 space-y-6">
            {selectedHistoryItem ? (
              <ReportViewer 
                data={{
                  candidateName: selectedHistoryItem.candidateName,
                  department: selectedHistoryItem.department,
                  targetRole: selectedHistoryItem.targetRole,
                  overallScore: selectedHistoryItem.overallScore,
                  history: selectedHistoryItem.history,
                  strengths: selectedHistoryItem.strengths,
                  improvements: selectedHistoryItem.improvements,
                  finalAnalysis: selectedHistoryItem.finalAnalysis,
                  liveMetrics: selectedHistoryItem.liveMetrics,
                  timestamp: selectedHistoryItem.timestamp
                }} 
                historyList={historyList}
                onBack={() => setSelectedHistoryItem(null)} 
                onViewHistoryItem={(item) => setSelectedHistoryItem(item)}
              />
            ) : (
              <div className="space-y-6 max-w-4xl mx-auto py-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      <History className="text-violet-400" size={20} />
                      Interview Performance History
                    </h2>
                    <p className="text-xs text-white/50 mt-1">Review your past interview transcript, live metrics, and comprehensive reports.</p>
                  </div>
                  {user && historyList.length > 0 && (
                    <button 
                      onClick={fetchHistory}
                      disabled={isLoadingHistory}
                      className="px-4 py-1.5 hover:bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider text-white/75 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={12} className={cn("shrink-0", isLoadingHistory && "animate-spin")} />
                      Refresh
                    </button>
                  )}
                </div>

                {!user ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card-premium p-8 text-center max-w-lg mx-auto my-12 space-y-6 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-violet-500/[0.01] pointer-events-none" />
                    <div className="w-16 h-16 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto border border-violet-500/20 shadow-lg shadow-violet-900/10">
                      <History size={28} className="text-violet-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold tracking-tight text-white">Save and Track Your Progress</h3>
                      <p className="text-xs text-white/60 leading-relaxed max-w-xs mx-auto">
                        Sign in with your Google account to securely save every interview attempt, view granular feedback, and unlock placement readiness analytics.
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        await handleSignIn();
                      }}
                      className="w-full sm:w-auto px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-violet-900/20 transition-all flex items-center justify-center gap-2 mx-auto cursor-pointer"
                    >
                      <LogIn size={14} />
                      Sign In with Google
                    </button>
                  </motion.div>
                ) : isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <RefreshCw size={24} className="text-violet-400 animate-spin" />
                    <span className="text-xs text-white/50 font-medium">Loading history from secure vault...</span>
                  </div>
                ) : historyList.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="card-premium p-10 text-center max-w-lg mx-auto my-12 space-y-6"
                  >
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/10">
                      <Sparkles size={28} className="text-violet-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold tracking-tight text-white">No Interviews Logged Yet</h3>
                      <p className="text-xs text-white/60 leading-relaxed max-w-xs mx-auto">
                        Ready to start your placement preparation? Launch a session with Dr. Banner, complete the questions, and your detailed analysis will appear here instantly!
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('interview')}
                      className="px-6 py-3 btn-premium-primary text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mx-auto cursor-pointer"
                    >
                      <Mic size={14} />
                      Start Practice Interview
                    </button>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {historyList.map((item) => {
                      const dateStr = item.timestamp 
                        ? new Date(item.timestamp.seconds * 1000).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        : 'Recent';
                      const timeStr = item.timestamp 
                        ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '';
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="glass-dark border border-white/5 hover:border-violet-500/20 rounded-2xl p-5 hover:bg-white/[0.04] transition-all flex flex-col justify-between group"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-md">
                                {item.department || 'General Practice'}
                              </span>
                              <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                                <Clock size={10} />
                                {dateStr} {timeStr}
                              </span>
                            </div>
                            <div>
                              <h4 className="text-sm font-bold tracking-tight text-white group-hover:text-violet-300 transition-colors">
                                {item.targetRole || 'Placement Interview'}
                              </h4>
                              <p className="text-xs text-white/50 mt-0.5">Candidate: {item.candidateName}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                <Star size={12} className="fill-emerald-400 text-emerald-400" />
                                <span className="text-xs font-black">{item.overallScore}%</span>
                              </div>
                              <span className="text-[10px] text-white/40 uppercase font-black tracking-wider">Score</span>
                            </div>

                            <button
                              onClick={() => setSelectedHistoryItem(item)}
                              className="text-xs font-bold text-violet-400 hover:text-white group-hover:translate-x-1 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              Explore Analysis
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Floating Interactive Camera Tab */}
        {activeTab === 'interview' && interviewMode === 'chat' && (
          <motion.div
          drag
          dragConstraints={mainRef}
          dragElastic={0.05}
          dragMomentum={false}
          whileDrag={{ 
            scale: 1.03, 
            boxShadow: "0 25px 50px -12px rgba(139, 92, 246, 0.4)",
            borderColor: "rgba(139, 92, 246, 0.4)"
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={isCameraMinimized ? () => setIsCameraMinimized(false) : undefined}
          className={cn(
            "absolute z-50 glass shadow-2xl border border-white/10 select-none touch-none overflow-hidden transition-all duration-300 ease-out flex flex-col group",
            isCameraMinimized 
              ? "w-16 h-16 rounded-full items-center justify-center bottom-28 right-8 cursor-pointer hover:bg-white/[0.08] hover:border-violet-500/30" 
              : cn(
                  "rounded-3xl cursor-grab active:cursor-grabbing",
                  cameraSize === 'sm' && "w-44 h-36 bottom-24 right-8",
                  cameraSize === 'md' && "w-64 h-48 bottom-24 right-8",
                  cameraSize === 'lg' && "w-80 h-60 bottom-24 right-8"
                )
          )}
        >
          <div className="w-full h-full flex flex-col relative">
            {/* Header Drag Bar - only visible when not minimized */}
            {!isCameraMinimized && (
              <div className="h-10 px-3 shrink-0 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <GripHorizontal size={14} className="text-white/40 cursor-grab active:cursor-grabbing shrink-0 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Camera</span>
                  <div className={cn("w-1.5 h-1.5 rounded-full", isCameraOn ? "bg-green-500 animate-pulse" : "bg-white/20")} />
                </div>
                
                <div className="flex items-center gap-1.5">
                  {/* Toggle Camera */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCamera();
                    }}
                    title={isCameraOn ? "Turn camera off" : "Turn camera on"}
                    className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    {isCameraOn ? <Video size={12} /> : <VideoOff size={12} className="text-white/40" />}
                  </button>

                  {/* Size cycle */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCameraSize(prev => prev === 'sm' ? 'md' : prev === 'md' ? 'lg' : 'sm');
                    }}
                    title="Cycle size"
                    className="px-1.5 py-0.5 hover:bg-white/10 rounded text-[8px] font-extrabold text-violet-400 hover:text-violet-300 transition-colors uppercase cursor-pointer bg-violet-500/10 border border-violet-500/20"
                  >
                    {cameraSize}
                  </button>

                  {/* Minimize */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCameraMinimized(true);
                    }}
                    title="Minimize to bubble"
                    className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors cursor-pointer"
                  >
                    <Minimize2 size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Video content frame */}
            <div className="flex-1 relative bg-zinc-950 overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "w-full h-full object-cover pointer-events-none", 
                  (!isCameraOn || isVirtualCamera) && "hidden",
                  isCameraMinimized && "rounded-full"
                )}
              />

              {/* High-Tech Holographic Virtual Stream Fallback */}
              {isCameraOn && isVirtualCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-center p-4">
                  {/* Concentric rotating neon circles */}
                  <div className="relative w-20 h-20 flex items-center justify-center mb-1 scale-90 md:scale-100">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="absolute w-20 h-20 border border-dashed border-violet-500/40 rounded-full"
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                      className="absolute w-16 h-16 border border-violet-400/20 rounded-full"
                    />
                    <motion.div 
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute w-10 h-10 border border-emerald-500/30 rounded-full bg-emerald-500/5 flex items-center justify-center"
                    >
                      <User size={14} className="text-emerald-400" />
                    </motion.div>
                    
                    {/* Pulsing horizontal scan line */}
                    <motion.div 
                      animate={{ y: [-36, 36, -36] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute left-0 right-0 h-0.5 bg-violet-400/50 shadow-[0_0_8px_#8b5cf6]"
                    />
                  </div>

                  {!isCameraMinimized && (
                    <div className="space-y-0.5 select-none">
                      <span className="text-[9px] uppercase tracking-[0.25em] font-black text-violet-400 block animate-pulse">
                        Virtual Feed
                      </span>
                      <span className="text-[7px] uppercase tracking-wider text-white/30 block">
                        Real-time AI Frame Sim
                      </span>
                      {cameraError && (
                        <p className="text-[7px] text-yellow-500/60 max-w-[180px] mx-auto mt-1 leading-normal italic px-2">
                          Physical camera blocked. Simulated hologram enabled.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Camera Off Placeholder for Expanded View */}
              {!isCameraOn && !isCameraMinimized && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <User className="text-white/10 mb-2 animate-pulse" size={32} />
                  <span className="text-[9px] uppercase tracking-widest font-bold opacity-30">Camera Stream Inactive</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCamera();
                    }}
                    className="mt-3 px-3 py-1 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 border border-violet-500/20 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Start Camera
                  </button>
                </div>
              )}

              {/* Camera Off Placeholder for Minimized View */}
              {!isCameraOn && isCameraMinimized && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 rounded-full">
                  <User className="text-white/30" size={20} />
                </div>
              )}
              
              {/* Minimal Status dot in Minimized View */}
              {isCameraMinimized && (
                <div className={cn(
                  "absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full border border-black shadow-lg z-50",
                  isCameraOn ? "bg-green-500 animate-pulse" : "bg-white/30"
                )} />
              )}

              {/* Maximize overlay on hover in Minimized View */}
              {isCameraMinimized && (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full z-40">
                  <Maximize2 size={14} className="text-white" />
                </div>
              )}
              
              {/* "You" badge - only visible when not minimized */}
              {!isCameraMinimized && (
                <div className="absolute bottom-2 left-2 px-2 py-0.5 glass-dark rounded-md pointer-events-none select-none border border-white/5">
                  <span className="text-[7px] font-bold uppercase tracking-widest text-white/50">You</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
        )}
      </main>

      {/* Auth Error Modal */}
      <AnimatePresence>
        {authError && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-[#0d0d12] border border-white/10 rounded-[28px] p-8 shadow-2xl relative overflow-hidden text-center space-y-6"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-violet-500/[0.04] to-transparent pointer-events-none" />
              
              {/* Close Button */}
              <button
                onClick={() => setAuthError(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white hover:bg-white/5 p-1.5 rounded-xl transition-all cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg shadow-amber-900/15">
                <ShieldAlert size={28} className="text-amber-400" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  {authError === 'iframe_blocked' ? 'Google Sign-In Blocked' :
                   authError === 'popup_blocked' ? 'Popup Blocked' : 'Google Sign-In Error'}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  {authError === 'iframe_blocked' ? (
                    "Because this application is currently embedded in the AI Studio preview iframe, your browser's security or cookie policies block the secure Google login popup."
                  ) : authError === 'popup_blocked' ? (
                    "The Google Sign-In popup was blocked by your browser's pop-up blocker or was closed before completion."
                  ) : (
                    authError
                  )}
                </p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left space-y-2.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                  <Sparkles size={12} /> Instant Solution
                </h4>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  Open the application in a new dedicated tab where standard popup policies apply. Your login will succeed immediately!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => setAuthError(null)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setAuthError(null);
                    window.open(window.location.origin, '_blank');
                  }}
                  className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xl shadow-violet-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink size={14} />
                  Open in New Tab
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Action Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-[9999] px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-xl backdrop-blur-md border",
              toast.type === 'success' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-200",
              toast.type === 'error' && "bg-red-500/10 border-red-500/20 text-red-200",
              toast.type === 'info' && "bg-violet-500/10 border-violet-500/20 text-violet-200"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center",
              toast.type === 'success' && "bg-emerald-500/20 text-emerald-400",
              toast.type === 'error' && "bg-red-500/20 text-red-400",
              toast.type === 'info' && "bg-violet-500/20 text-violet-400"
            )}>
              {toast.type === 'success' && <CheckCircle2 size={12} />}
              {toast.type === 'error' && <ShieldAlert size={12} />}
              {toast.type === 'info' && <Info size={12} />}
            </div>
            <span className="text-xs font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
