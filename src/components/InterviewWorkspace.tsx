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
  Video,
  VideoOff,
  Minimize2,
  Maximize2,
  X,
  Sparkles,
  Info,
  Activity,
  Brain,
  MessageSquare,
  Sliders,
  ChevronLeft,
  Keyboard,
  ArrowRight,
  Lock,
  Compass,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  MessageCircle,
  SlidersHorizontal,
  LogOut,
  Sparkle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Emotion, InterviewState } from '../types';
import { HanaAvatar } from './HanaAvatar';

interface InterviewWorkspaceProps {
  state: InterviewState;
  setState: React.Dispatch<React.SetStateAction<InterviewState>>;
  isSpeaking: boolean;
  speakingText: string | null;
  currentEmotion: Emotion;
  avatarUrl: string | null;
  hasImagePermission: boolean;
  isCameraOn: boolean;
  toggleCamera: () => void;
  isListening: boolean;
  toggleListening: () => void;
  isProcessing: boolean;
  input: string;
  setInput: (val: string) => void;
  handleSubmit: (e?: React.FormEvent) => void;
  showTip: boolean;
  setShowTip: (val: boolean) => void;
  showBackupText: boolean;
  setShowBackupText: (val: boolean) => void;
  getStepTip: (step: any) => string;
  togglePlaySpeech: (text: string) => void;
  stopSpeech: () => void;
  setInterviewMode: (mode: 'video' | 'chat' | null) => void;
  INITIAL_STATE: InterviewState;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isVirtualCamera: boolean;
  cameraSize: 'sm' | 'md' | 'lg';
  setCameraSize: React.Dispatch<React.SetStateAction<'sm' | 'md' | 'lg'>>;
  isCameraMinimized: boolean;
  setIsCameraMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  cameraError: string | null;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  lastFeedback: any;
  showFeedback: boolean;
  interviewMode: 'video' | 'chat';
}

export const InterviewWorkspace: React.FC<InterviewWorkspaceProps> = ({
  state,
  setState,
  isSpeaking,
  speakingText,
  currentEmotion,
  avatarUrl,
  hasImagePermission,
  isCameraOn,
  toggleCamera,
  isListening,
  toggleListening,
  isProcessing,
  input,
  setInput,
  handleSubmit,
  showTip,
  setShowTip,
  showBackupText,
  setShowBackupText,
  getStepTip,
  togglePlaySpeech,
  stopSpeech,
  setInterviewMode,
  INITIAL_STATE,
  videoRef,
  isVirtualCamera,
  cameraSize,
  setCameraSize,
  isCameraMinimized,
  setIsCameraMinimized,
  cameraError,
  chatEndRef,
  lastFeedback,
  showFeedback,
  interviewMode
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  const INTERVIEW_STEPS = [
    { id: 'intro', label: 'Welcome', desc: 'Greeting & Intro', icon: MessageSquare },
    { id: 'personal_info', label: 'Academic', desc: 'Profile & Role', icon: GraduationCap },
    { id: 'hr', label: 'HR behavioral', desc: 'Behavioral & Fit', icon: Briefcase },
    { id: 'technical', label: 'Technical', desc: 'Domain Basics', icon: Brain },
    { id: 'project', label: 'Project review', desc: 'Architecture & Hurdle', icon: Award },
    { id: 'situational', label: 'Situational', desc: 'Crisis Resolution', icon: Sliders },
  ];

  const currentStepIndex = INTERVIEW_STEPS.findIndex(s => s.id === state.step);
  const activeIndex = currentStepIndex !== -1 ? currentStepIndex : 0;
  const currentQuestionNum = state.subStep || 1;
  const progressPercent = Math.min(100, Math.round((currentQuestionNum / 8) * 100));

  // Auto-scroll transcript sidebar
  useEffect(() => {
    if (isSidebarOpen && chatEndRef?.current) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  }, [state.history.length, isSidebarOpen]);

  // Track session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Find latest interviewer prompt
  const currentInterviewerMsg = state.history
    .filter(h => h.role === 'interviewer')
    .slice(-1)[0]?.text;

  // Derive the active conversational state
  const getAIState = () => {
    if (isProcessing) return 'evaluating';
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    return 'idle';
  };

  const aiState = getAIState();

  const handleToggleChatSidebar = () => {
    setIsSidebarOpen(prev => !prev);
    setIsDiagnosticOpen(false); // Close other drawer to prevent screen clutter
  };

  const handleToggleDiagnosticSidebar = () => {
    setIsDiagnosticOpen(prev => !prev);
    setIsSidebarOpen(false); // Close other drawer to prevent screen clutter
  };

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0 select-none font-sans" id="interview-workspace-container">
      
      {/* 1. PROFESSIONAL MEETING HEADER */}
      <div className="backdrop-blur-md bg-zinc-900/60 border border-white/[0.04] rounded-2xl px-6 py-4 shadow-xl shrink-0 flex items-center justify-between gap-4" id="interview-meeting-header">
        
        {/* Meeting Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Activity className="animate-pulse" size={16} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Live Call Connected</p>
            </div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Dr. Banner AI • <span className="text-white/60 font-medium">Technical Simulation</span>
            </h3>
          </div>
        </div>

        {/* Meeting Progress Tracker (Sleek Horizontal Ribbon) */}
        <div className="hidden lg:flex items-center gap-2 bg-white/[0.02] border border-white/[0.04] px-4 py-2 rounded-xl">
          {INTERVIEW_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isCompleted = idx < activeIndex;
            const isActive = idx === activeIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-1.5 px-1">
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center border text-xs transition-all",
                    isCompleted 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                      : isActive 
                        ? "bg-violet-600/20 border-violet-500/40 text-violet-300 shadow-[0_0_12px_rgba(139,92,246,0.1)]" 
                        : "bg-white/[0.01] border-white/5 text-white/30"
                  )}>
                    <StepIcon size={12} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium tracking-wide",
                    isCompleted ? "text-emerald-400/80" : isActive ? "text-violet-300 font-bold" : "text-white/40"
                  )}>
                    {step.label}
                  </span>
                </div>
                {idx < INTERVIEW_STEPS.length - 1 && (
                  <ChevronRight size={12} className="text-white/10" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Call Timer & Toolbar */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-white/40 leading-none">Session Time</span>
            <span className="text-sm font-mono font-bold text-violet-400 mt-1 leading-none">{formatTime(sessionDuration)}</span>
          </div>
          
          <div className="h-6 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleToggleChatSidebar}
              className={cn(
                "p-2.5 rounded-xl border transition-all cursor-pointer relative",
                isSidebarOpen 
                  ? "bg-violet-600/10 border-violet-500/30 text-violet-300" 
                  : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:bg-white/[0.04]"
              )}
              title="Meeting Chat & Transcript"
            >
              <MessageSquare size={14} />
              {state.history.length > 0 && !isSidebarOpen && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-400" />
              )}
            </button>
            
            <button
              onClick={handleToggleDiagnosticSidebar}
              className={cn(
                "p-2.5 rounded-xl border transition-all cursor-pointer",
                isDiagnosticOpen 
                  ? "bg-cyan-600/10 border-cyan-500/30 text-cyan-300" 
                  : "bg-white/[0.02] border-white/5 text-white/40 hover:text-white hover:bg-white/[0.04]"
              )}
              title="Performance Insights"
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* 2. PRIMARY LAYOUT: INTERVIEW COLLABORATIVE CALL ENVIRONMENT */}
      <div className="flex-1 flex gap-4 min-h-0 items-stretch relative" id="interview-main-stage">
        
        {/* Main Video Call Area */}
        <div className="flex-1 flex flex-col gap-4 min-h-0 relative">
          
          {/* Edge-to-edge Cinematic AI Interview Stream Container */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-zinc-950 border border-white/[0.04] shadow-2xl flex flex-col justify-between p-6" id="interviewer-video-frame">
            
            {/* Ambient Lighting Gradients */}
            <div className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none transition-all duration-1000 opacity-30",
              aiState === 'listening' ? "bg-rose-500/5" :
              aiState === 'speaking' ? "bg-violet-500/10" :
              aiState === 'evaluating' ? "bg-cyan-500/10" :
              "bg-zinc-800/5"
            )} />

            {/* AI Avatar Stream Layer */}
            <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <img 
                    key={currentEmotion}
                    src={avatarUrl} 
                    alt="Dr. Banner AI"
                    className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              ) : hasImagePermission ? (
                <div className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-950">
                  <RefreshCw className="animate-spin text-violet-500/20" size={32} />
                </div>
              ) : (
                <div className="absolute inset-0 z-0 flex items-center justify-center">
                  <HanaAvatar emotion={currentEmotion} isSpeaking={isSpeaking} />
                </div>
              )}
            </div>

            {/* Quiet grid lines layer (Professional minimal layout) */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-[1]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none z-[1]" />

            {/* Top Row: AI Conversational State Indicator (Top Left) */}
            <div className="absolute top-4 left-4 z-10">
              <AnimatePresence mode="wait">
                {aiState === 'speaking' && (
                  <motion.div 
                    key="speaking"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-violet-600 border border-violet-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-xl backdrop-blur-md"
                  >
                    <div className="flex gap-0.5 items-end h-3 w-4">
                      <span className="w-0.5 h-2.5 bg-white rounded-full animate-[pulse_0.4s_infinite_alternate]" />
                      <span className="w-0.5 h-4 bg-white rounded-full animate-[pulse_0.4s_infinite_0.15s_alternate]" />
                      <span className="w-0.5 h-1.5 bg-white rounded-full animate-[pulse_0.4s_infinite_0.3s_alternate]" />
                      <span className="w-0.5 h-3 bg-white rounded-full animate-[pulse_0.4s_infinite_0.05s_alternate]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">Dr. Banner Speaking</span>
                  </motion.div>
                )}

                {aiState === 'evaluating' && (
                  <motion.div 
                    key="evaluating"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-cyan-600 border border-cyan-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-xl backdrop-blur-md"
                  >
                    <RefreshCw size={12} className="animate-spin text-white" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">AI is Thinking...</span>
                  </motion.div>
                )}

                {aiState === 'listening' && (
                  <motion.div 
                    key="listening"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-rose-600 border border-rose-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2.5 shadow-xl backdrop-blur-md"
                  >
                    <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">Listening (Speak now)</span>
                  </motion.div>
                )}

                {aiState === 'idle' && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-zinc-900/90 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg backdrop-blur-md"
                  >
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">Session Connected</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Immersive centered Question Overlay Captions (Teleprompter) */}
            <div className="flex-1 flex items-end justify-center z-10 w-full mb-4" id="interviewer-teleprompter-box">
              <AnimatePresence mode="wait">
                {currentInterviewerMsg && (
                  <motion.div 
                    key={currentInterviewerMsg}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                    className="w-full max-w-2xl bg-zinc-950/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 shadow-[0_24px_50px_rgba(0,0,0,0.8)] text-left flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400 flex items-center gap-1.5">
                        <MessageSquare size={12} className="text-violet-400" /> Dr. Banner's Query
                      </span>
                      {isSpeaking && (
                        <button 
                          onClick={stopSpeech} 
                          className="text-[10px] text-white/40 hover:text-white uppercase font-bold tracking-wider transition-colors cursor-pointer"
                        >
                          Mute Audio Feed
                        </button>
                      )}
                    </div>
                    <p className="text-sm md:text-base font-medium text-white/90 leading-relaxed tracking-wide select-text antialiased">
                      {currentInterviewerMsg}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Elegant Video Badge (Bottom Left) */}
            <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
              <span className="px-2.5 py-1 bg-zinc-900/90 border border-white/10 text-white/80 text-[9px] font-mono font-bold uppercase tracking-wider rounded-lg backdrop-blur-md">
                Dr. Banner AI • Main Feed
              </span>
            </div>

            {/* Floating Picture-in-Picture Webcam Box (Dynamic User View) */}
            <AnimatePresence>
              {isCameraOn && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1,
                    width: isCameraMinimized ? "130px" : "240px",
                    height: isCameraMinimized ? "70px" : "180px",
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  className="absolute right-4 bottom-4 rounded-xl overflow-hidden bg-zinc-950 border border-white/10 shadow-2xl z-20 flex flex-col justify-between group"
                  id="candidate-floating-pip"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={cn(
                      "w-full h-full object-cover absolute inset-0 z-0 scale-x-[-1] transition-transform", 
                      isVirtualCamera && "hidden"
                    )}
                  />

                  {/* Virtual Video Feed Overlay */}
                  {isVirtualCamera && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-center p-2 z-0">
                      <div className="relative w-8 h-8 flex items-center justify-center mb-1">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                          className="absolute w-8 h-8 border border-dashed border-violet-500/20 rounded-full"
                        />
                        <User size={10} className="text-violet-400" />
                      </div>
                      <span className="text-[7px] uppercase tracking-wider font-semibold text-violet-400 block animate-pulse">
                        Virtual Feed
                      </span>
                    </div>
                  )}

                  {/* Picture-in-Picture Vignette overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none z-[1] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* PIP Controls / Labels */}
                  {!isCameraMinimized && (
                    <>
                      {/* Top Bar inside PIP */}
                      <div className="absolute top-2 inset-x-2 z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wide backdrop-blur-md border",
                          isListening 
                            ? "bg-rose-600/90 border-rose-500/30 text-white" 
                            : "bg-zinc-900/90 border-white/5 text-white/60"
                        )}>
                          {isListening ? "Mic On" : "Muted"}
                        </span>
                        
                        <button
                          onClick={() => setIsCameraMinimized(true)}
                          className="p-1 rounded bg-black/50 text-white/60 hover:text-white transition-colors cursor-pointer"
                          title="Minimize Pip"
                        >
                          <Minimize2 size={10} />
                        </button>
                      </div>

                      {/* Bottom Label inside PIP */}
                      <div className="absolute bottom-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="px-1.5 py-0.5 bg-black/50 text-white/80 rounded text-[7px] font-bold uppercase tracking-wider backdrop-blur-sm">
                          Candidate (You)
                        </span>
                      </div>
                    </>
                  )}

                  {/* Minimized HUD placeholder */}
                  {isCameraMinimized && (
                    <div 
                      className="absolute inset-0 flex items-center justify-between px-3 bg-zinc-900/95 backdrop-blur-md cursor-pointer z-20 group"
                      onClick={() => setIsCameraMinimized(false)}
                      title="Expand View"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          isListening ? "bg-rose-500 animate-pulse" : "bg-zinc-500"
                        )} />
                        <span className="text-[9px] font-semibold uppercase text-white/70">Candidate</span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCameraMinimized(false);
                        }}
                        className="p-1 text-white/40 hover:text-white transition-colors"
                      >
                        <Maximize2 size={10} />
                      </button>
                    </div>
                  )}

                  {/* Camera Connection Error HUD state */}
                  {cameraError && (
                    <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-2 text-center z-10">
                      <span className="text-[8px] text-red-400 font-bold uppercase leading-tight mb-1">Camera Error</span>
                      <span className="text-[7px] text-white/40 line-clamp-2">{cameraError}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* SIMULATION TIPS DECK */}
          <AnimatePresence>
            {showTip && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-zinc-900/60 border border-white/[0.04] p-4 rounded-xl text-left relative backdrop-blur-md shrink-0"
                id="answering-tip-container"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-violet-300 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-violet-400 animate-pulse" /> Executive Answering Strategy
                  </span>
                  <button 
                    onClick={() => setShowTip(false)}
                    className="text-white/30 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-white/60 leading-relaxed font-sans font-medium">
                  {getStepTip(state.step)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* 3. SIDE-OUT MEETING SIDEBAR DRAWERS */}
        <AnimatePresence mode="wait">
          
          {/* Transcript/Chat Sidebar */}
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: 50, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "320px" }}
              exit={{ opacity: 0, x: 50, width: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="flex flex-col bg-zinc-900/80 border border-white/[0.04] rounded-2xl overflow-hidden relative backdrop-blur-xl shrink-0"
              id="transcript-sidebar"
            >
              <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-300 flex items-center gap-2">
                  <MessageSquare size={14} /> Live Transcript Log
                </span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin text-left">
                {state.history.length > 0 ? (
                  state.history.map((msg, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "flex flex-col max-w-[85%] space-y-1",
                        msg.role === 'interviewer' ? "self-start" : "self-end items-end ml-auto"
                      )}
                    >
                      <div className={cn(
                        "px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-lg",
                        msg.role === 'interviewer' 
                          ? "bg-white/[0.03] border border-white/5 text-white/90 rounded-tl-none" 
                          : "bg-violet-600 text-white rounded-tr-none"
                      )}>
                        {msg.text}
                      </div>
                      <span className="text-[8px] font-medium uppercase tracking-wider text-white/35">
                        {msg.role === 'interviewer' ? 'Dr. Banner' : 'You (Candidate)'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4 opacity-40 space-y-2">
                    <Activity size={20} className="animate-pulse text-violet-500" />
                    <p className="text-[10px] font-semibold tracking-wide uppercase">Connection Streams Initialized</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-3 border-t border-white/5 text-[9px] font-mono text-center uppercase tracking-wider text-white/20 shrink-0">
                Encrypted Session Transcript
              </div>
            </motion.div>
          )}

          {/* Performance Evaluation Diagnostics Sidebar */}
          {isDiagnosticOpen && (
            <motion.div
              initial={{ opacity: 0, x: 50, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "320px" }}
              exit={{ opacity: 0, x: 50, width: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 26 }}
              className="flex flex-col bg-zinc-900/80 border border-white/[0.04] rounded-2xl overflow-hidden relative backdrop-blur-xl shrink-0"
              id="diagnostics-panel"
            >
              <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-cyan-400" /> Live Session Analysis
                </span>
                <button 
                  onClick={() => setIsDiagnosticOpen(false)}
                  className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Performance Details */}
              <div className="flex-1 overflow-y-auto space-y-4 p-4 scrollbar-thin text-left">
                
                {[
                  { 
                    label: 'Confidence & Delivery', 
                    value: state.liveMetrics?.confidence ? `${state.liveMetrics.confidence}%` : 'Pending', 
                    icon: Award, 
                    color: 'text-amber-400',
                    bgColor: 'bg-amber-400/10',
                    borderColor: 'border-amber-400/20',
                    desc: 'Pacing, clarity & vocal confidence'
                  },
                  { 
                    label: 'Technical Precision', 
                    value: state.liveMetrics?.technical ? `${state.liveMetrics.technical}%` : 'Pending', 
                    icon: Brain, 
                    color: 'text-violet-400',
                    bgColor: 'bg-violet-400/10',
                    borderColor: 'border-violet-400/20',
                    desc: 'Technical structure & core accuracy'
                  },
                  { 
                    label: 'Professional Impact', 
                    value: state.liveMetrics?.communication ? `${state.liveMetrics.communication}%` : 'Pending', 
                    icon: Briefcase, 
                    color: 'text-emerald-400',
                    bgColor: 'bg-emerald-400/10',
                    borderColor: 'border-emerald-400/20',
                    desc: 'Strategic thinking & conciseness'
                  },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center border", stat.bgColor, stat.borderColor)}>
                          <stat.icon size={11} className={stat.color} />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{stat.label}</span>
                      </div>
                      {stat.value !== 'Pending' && (
                        <span className="text-xs font-mono font-bold text-white">{stat.value}</span>
                      )}
                    </div>
                    
                    {stat.value !== 'Pending' ? (
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full" 
                          style={{ width: stat.value }}
                        />
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-white/30 italic block">Evaluating voice stream...</span>
                    )}
                    <p className="text-[9px] text-white/40">{stat.desc}</p>
                  </div>
                ))}

                {/* Qualitative Feedback Block */}
                <div className="border-t border-white/5 pt-4 mt-2 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block">Immediate AI Feedback</span>
                  {showFeedback && lastFeedback ? (
                    <div className="bg-violet-600/5 border border-violet-500/15 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Qualitative Analytics</span>
                        <div className="flex items-center gap-1 text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded-lg border border-amber-400/25 text-[10px] font-bold">
                          <Star size={10} className="fill-amber-400" />
                          <span>{lastFeedback.score}/10</span>
                        </div>
                      </div>
                      <div className="space-y-3 text-[11px] leading-relaxed">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold mb-1">Key Strength</p>
                          <p className="text-white/70">{lastFeedback.strength}</p>
                        </div>
                        <div className="h-px bg-white/5" />
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-blue-400 font-bold mb-1">Opportunity</p>
                          <p className="text-white/70">{lastFeedback.improvement}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-white/5 bg-white/[0.01] p-5 rounded-xl text-center">
                      <p className="text-xs text-white/35 italic leading-relaxed">Qualitative reports compile automatically as your responses streams complete.</p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>

      {/* 4. PREMIUM FLOATING CONTROL DECK (COLLABORATIVE DOCK) */}
      <div className="backdrop-blur-md bg-zinc-900/60 border border-white/[0.04] p-3 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 relative overflow-hidden" id="interview-control-pill-bar">
        
        {/* Left block: Sim Guide / Tips */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTip(!showTip)}
            className={cn(
              "px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold tracking-wide",
              showTip 
                ? "bg-violet-600/15 border-violet-500/30 text-violet-300 shadow-md" 
                : "bg-white/[0.01] border-white/5 text-white/40 hover:text-white hover:bg-white/[0.03]"
            )}
            title="Toggle Answering Tips"
          >
            <HelpCircle size={14} />
            <span>Sim Guide</span>
          </button>
        </div>

        {/* Center block: Primary Call/Stream controls */}
        <div className="flex items-center gap-3">
          
          {/* Microphone/Voice Controller */}
          <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-2xl" id="mic-status-waveform">
            <button
              type="button"
              onClick={toggleListening}
              disabled={isSpeaking || isProcessing}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-md border relative cursor-pointer",
                isListening 
                  ? "bg-rose-500 text-white border-rose-400 shadow-rose-500/20 scale-105" 
                  : isSpeaking || isProcessing
                    ? "bg-white/5 text-white/20 border-white/10 cursor-not-allowed"
                    : "bg-gradient-to-br from-violet-600 to-indigo-700 text-white border-violet-500/20 hover:from-violet-500 hover:to-indigo-600"
              )}
              title={isListening ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isListening ? <Mic size={16} /> : <MicOff size={16} />}
              {isListening && (
                <span className="absolute inset-[-2px] rounded-xl border border-rose-500 animate-ping opacity-50 pointer-events-none" />
              )}
            </button>

            {/* Micro Waveform animation */}
            <div className="flex items-center gap-0.5 h-4 w-12">
              {isListening ? (
                <>
                  <span className="w-0.5 h-2.5 bg-rose-500 rounded-full animate-[pulse_0.35s_infinite_alternate]" />
                  <span className="w-0.5 h-4.5 bg-rose-400 rounded-full animate-[pulse_0.35s_infinite_0.08s_alternate]" />
                  <span className="w-0.5 h-1.5 bg-rose-500 rounded-full animate-[pulse_0.35s_infinite_0.15s_alternate]" />
                  <span className="w-0.5 h-4 bg-rose-400 rounded-full animate-[pulse_0.35s_infinite_0.05s_alternate]" />
                  <span className="w-0.5 h-2 bg-rose-500 rounded-full animate-[pulse_0.35s_infinite_0.12s_alternate]" />
                </>
              ) : (
                <>
                  <span className="w-0.5 h-1 bg-white/20 rounded-full" />
                  <span className="w-0.5 h-1 bg-white/20 rounded-full" />
                  <span className="w-0.5 h-1 bg-white/20 rounded-full" />
                  <span className="w-0.5 h-1 bg-white/20 rounded-full" />
                  <span className="w-0.5 h-1 bg-white/20 rounded-full" />
                </>
              )}
            </div>
          </div>

          {/* Camera/Webcam Toggle */}
          <button
            type="button"
            onClick={toggleCamera}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-md border cursor-pointer",
              isCameraOn 
                ? "bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/5 hover:text-white" 
                : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
            )}
            title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
          >
            {isCameraOn ? <Video size={16} /> : <VideoOff size={16} />}
          </button>

          {/* Core Action: Send/Submit Response */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={isProcessing || isSpeaking || !input.trim()}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs tracking-wide px-5 h-11 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-violet-950/20 border border-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            id="control-submit-answer"
          >
            {isProcessing ? (
              <RefreshCw size={13} className="animate-spin text-white" />
            ) : (
              <>
                <Send size={12} />
                <span>Submit Response</span>
              </>
            )}
          </button>

        </div>

        {/* Right block: Keyboard toggle / Exit meeting */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBackupText(!showBackupText)}
            className={cn(
              "px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-semibold tracking-wide",
              showBackupText 
                ? "bg-violet-600/15 border-violet-500/30 text-violet-300 shadow-md" 
                : "bg-white/[0.01] border-white/5 text-white/40 hover:text-white hover:bg-white/[0.03]"
            )}
            title="Type Response Directly"
          >
            <Keyboard size={14} />
            <span>Type Answer</span>
          </button>

          <button 
            onClick={() => {
              stopSpeech();
              setInterviewMode(null);
              setState(INITIAL_STATE);
            }}
            className="px-4 py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 font-bold text-xs tracking-wide rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
            id="control-exit-interview"
          >
            <LogOut size={13} />
            <span>End Call</span>
          </button>
        </div>

        {/* Drawer panel: Typewriter box overlay */}
        <AnimatePresence>
          {showBackupText && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="absolute inset-x-3 bottom-3 bg-zinc-900 border border-white/10 rounded-xl p-3 flex items-center gap-3 z-30 shadow-2xl"
              id="sliding-manual-input-box"
            >
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} 
                className="flex items-center gap-3 w-full"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isListening ? "Streaming transcripts... Modify directly" : "Enter text response..."}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-violet-500/50 flex-1"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !input.trim()}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                >
                  <Send size={12} /> Send
                </button>
                <button
                  type="button"
                  onClick={() => setShowBackupText(false)}
                  className="p-1 text-white/30 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
};
