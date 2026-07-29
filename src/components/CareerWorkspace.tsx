import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  Award, 
  FolderGit2, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Compass, 
  Flame, 
  Play, 
  UploadCloud, 
  ArrowRight, 
  HelpCircle, 
  X, 
  Clock, 
  UserCheck, 
  ChevronRight,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile, ResumeData } from '../types';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CareerWorkspaceProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  historyList: any[];
  setActiveTab: (tab: 'dashboard' | 'interview' | 'history' | 'analytics' | 'resume' | 'settings' | 'admin') => void;
  setTargetRole: (role: string) => void;
  setExtractedSkills: (skills: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

type WorkspaceSubTab = 'resume' | 'learning';

export default function CareerWorkspace({
  user,
  setUser,
  historyList,
  setActiveTab,
  setTargetRole,
  setExtractedSkills,
  showToast
}: CareerWorkspaceProps) {
  const [subTab, setSubTab] = useState<WorkspaceSubTab>('resume');
  const [dragActive, setDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStage, setParsingStage] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [showTextPaste, setShowTextPaste] = useState(false);
  const [activeResumeSection, setActiveResumeSection] = useState<'skills' | 'experience' | 'projects' | 'education'>('skills');

  // Loading indicator helper during analysis
  useEffect(() => {
    if (!isParsing) return;
    const stages = [
      'Initializing secure connection to Dr. Banner parsing node...',
      'Decompressing and scanning structural document layers...',
      'Extracting professional milestones, timeline markers, and credential blocks...',
      'Mapping keywords to industry-standard ATS taxonomies...',
      'Running AI-assisted scoring calibration and preparing strategic insights...'
    ];
    let currentIdx = 0;
    setParsingStage(stages[0]);

    const interval = setInterval(() => {
      currentIdx = (currentIdx + 1) % stages.length;
      setParsingStage(stages[currentIdx]);
    }, 2800);

    return () => clearInterval(interval);
  }, [isParsing]);

  // Handle Drag-and-Drop files
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Helper to read and analyze plain text file content
  const processResumeContent = async (text: string, fileName: string) => {
    setIsParsing(true);
    try {
      const response = await fetch('/api/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: text })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server parsing error');
      }

      const parsedData: Omit<ResumeData, 'fileName' | 'uploadedAt'> = await response.json();
      
      const fullResumeData: ResumeData = {
        ...parsedData,
        fileName,
        uploadedAt: new Date().toISOString()
      };

      // Persist directly to Firestore user document
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { resume: fullResumeData }, { merge: true });

      // Update local react state
      setUser({
        ...user,
        resume: fullResumeData
      });

      // Synchronize key parameters to App state
      setTargetRole(fullResumeData.roleAlignment);
      setExtractedSkills(fullResumeData.extractedSkills.join(', '));

      showToast('ATS Resume Intelligence calibrations completed and persisted.', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to complete resume parsing analysis.', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await handleFileSelection(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleFileSelection(file);
    }
  };

  const handleFileSelection = async (file: File) => {
    if (file.type !== 'text/plain' && !file.name.endsWith('.txt') && file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      showToast('Please upload a standard .txt or .pdf resume file.', 'error');
      return;
    }

    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string || '';
        await processResumeContent(text, file.name);
      };
      reader.readAsText(file);
    } else {
      // For PDF, we can notify the user that we are extracting its structural lines, or recommend pasting plain text for highest parsing precision.
      const reader = new FileReader();
      reader.onload = async (event) => {
        const binary = event.target?.result as string || '';
        // Basic plain text fallback parser for PDF structures in browser
        let extractedText = binary.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]/g, " ").replace(/\s+/g, " ");
        await processResumeContent(extractedText, file.name);
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleManualPasteSubmit = async () => {
    if (!resumeText.trim()) {
      showToast('Please enter or paste your resume text.', 'error');
      return;
    }
    await processResumeContent(resumeText, 'pasted_resume_workspace.txt');
    setShowTextPaste(false);
    setResumeText('');
  };

  const handleRemoveResume = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { resume: null }, { merge: true });
      setUser({
        ...user,
        resume: undefined
      });
      showToast('Resume profile removed from cloud persistence.', 'info');
    } catch (err) {
      showToast('Failed to remove persistent resume profile.', 'error');
    }
  };

  // Configure active interview targeting the extracted resume roles and skills
  const handleConfigureMockSession = () => {
    if (!user.resume) return;
    setTargetRole(user.resume.roleAlignment);
    setExtractedSkills(user.resume.extractedSkills.join(', '));
    setActiveTab('interview');
    showToast(`Dr. Banner calibrated for ${user.resume.roleAlignment} target path!`, 'success');
  };

  // Derive detailed progression statistics from past interview histories
  const getAggregatedLearningStats = () => {
    const sessions = historyList || [];
    if (sessions.length === 0) {
      return {
        completedCount: 0,
        averageScore: 0,
        technicalAverage: 0,
        communicationAverage: 0,
        confidenceAverage: 0,
        streakDays: 1,
        skillTrends: []
      };
    }

    const totalScore = sessions.reduce((sum, s) => sum + (s.overallScore || 0), 0);
    const averageScore = Math.round(totalScore / sessions.length);

    let techSum = 0, commSum = 0, confSum = 0, count = 0;
    sessions.forEach(s => {
      if (s.liveMetrics) {
        techSum += s.liveMetrics.technical || 0;
        commSum += s.liveMetrics.communication || 0;
        confSum += s.liveMetrics.confidence || 0;
        count++;
      }
    });

    const techAvg = count > 0 ? Math.round(techSum / count) : averageScore;
    const commAvg = count > 0 ? Math.round(commSum / count) : averageScore;
    const confAvg = count > 0 ? Math.round(confSum / count) : averageScore;

    // Daily streak estimation
    const streakDays = Math.min(sessions.length + 1, 5);

    return {
      completedCount: sessions.length,
      averageScore,
      technicalAverage: techAvg,
      communicationAverage: commAvg,
      confidenceAverage: confAvg,
      streakDays,
      sessions
    };
  };

  const learningStats = getAggregatedLearningStats();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 py-4 font-sans text-left">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/[0.05] pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Compass className="text-violet-400" size={24} /> AI Career Workspace
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Redesigning professional preparedness using structured ATS resumes and targeted simulation metrics.
          </p>
        </div>

        {/* Workspace Mode Sub-Tabs */}
        <div className="flex bg-white/[0.02] border border-white/[0.05] p-1 rounded-xl">
          <button
            onClick={() => setSubTab('resume')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2",
              subTab === 'resume' 
                ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border border-violet-500/20 shadow-md"
                : "text-white/40 hover:text-white"
            )}
          >
            <FileText size={14} />
            Resume Intelligence
          </button>
          <button
            onClick={() => setSubTab('learning')}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2",
              subTab === 'learning' 
                ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border border-violet-500/20 shadow-md"
                : "text-white/40 hover:text-white"
            )}
          >
            <BookOpen size={14} />
            Learning Workspace
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isParsing ? (
          /* STATEFUL ELEGET LOAD STATE */
          <motion.div
            key="parsing-loader"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="card-premium p-12 text-center flex flex-col items-center justify-center space-y-6 min-h-[400px] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/[0.02] rounded-full blur-3xl animate-pulse" />
            <div className="w-16 h-16 bg-violet-600/10 border border-violet-500/30 rounded-2xl flex items-center justify-center text-violet-400 relative">
              <Sparkles className="animate-spin text-violet-300" size={28} />
              <div className="absolute inset-0 border border-t-transparent border-violet-400 rounded-2xl animate-spin" />
            </div>
            
            <div className="space-y-2 max-w-md">
              <h3 className="text-sm font-black uppercase tracking-widest text-white">Extracting ATS Signals</h3>
              <p className="text-[10px] text-white/40 uppercase font-mono tracking-wider">Calibration process active</p>
              <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden mx-auto mt-2">
                <motion.div 
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                  className="w-1/2 h-full bg-gradient-to-r from-violet-500 to-indigo-500" 
                />
              </div>
            </div>

            <p className="text-xs text-white/60 font-mono italic max-w-lg leading-relaxed animate-pulse">
              "{parsingStage}"
            </p>
          </motion.div>
        ) : subTab === 'resume' ? (
          /* ========================================================= */
          /* 1. RESUME WORKSPACE                                      */
          /* ========================================================= */
          <motion.div
            key="resume-workspace"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {!user.resume ? (
              /* ONBOARDING EMPTY UPLOAD STATE */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upload drag zone */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="text-left">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Central Intelligence Feed</h3>
                    <p className="text-[11px] text-white/40 mt-0.5">Upload your document to bootstrap Dr. Banner's behavioral question profiles.</p>
                  </div>

                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    className={cn(
                      "border-2 border-dashed rounded-[22px] p-10 flex flex-col items-center justify-center text-center space-y-4 transition-all duration-300 relative overflow-hidden group cursor-pointer min-h-[280px]",
                      dragActive 
                        ? "border-violet-500 bg-violet-500/[0.02]" 
                        : "border-white/10 bg-[#070912]/50 hover:border-violet-500/30"
                    )}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/[0.01] rounded-full blur-2xl group-hover:bg-violet-600/[0.03] transition-all" />
                    
                    <div className="w-12 h-12 bg-violet-600/10 border border-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform duration-300">
                      <UploadCloud size={22} />
                    </div>

                    <div className="space-y-1.5 max-w-xs">
                      <p className="text-xs font-bold text-white leading-normal">
                        Drag and drop your file here, or <span className="text-violet-400 hover:text-violet-300 underline">browse computer</span>
                      </p>
                      <p className="text-[10px] text-white/40">Accepts standard .txt or .pdf files up to 10MB.</p>
                    </div>

                    <input
                      type="file"
                      accept=".txt,.pdf"
                      onChange={handleFileInput}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>

                  {/* Text paste alternate option */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowTextPaste(!showTextPaste)}
                      className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    >
                      <span>Or paste raw resume text instead</span>
                      <ChevronDown size={12} className={cn("transition-transform", showTextPaste && "rotate-180")} />
                    </button>

                    <AnimatePresence>
                      {showTextPaste && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden space-y-3 pt-1"
                        >
                          <textarea
                            value={resumeText}
                            onChange={(e) => setResumeText(e.target.value)}
                            placeholder="Paste full resume plain text here..."
                            className="w-full h-40 input-premium p-3 text-xs font-mono"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={handleManualPasteSubmit}
                              className="btn-premium-primary px-5 py-2 text-[10px]"
                            >
                              Analyze Text Block
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Benefits / FAQ panel */}
                <div className="card-premium p-6 text-left space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-400">Calibration Benefits</h4>
                    
                    <div className="space-y-3.5">
                      <div className="flex gap-3">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-white">Dynamic Follow-ups</p>
                          <p className="text-[10px] text-white/40 leading-relaxed mt-0.5">Allows Dr. Banner to formulate technical cross-examination based on your actual projects.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-white">ATS Impact Audits</p>
                          <p className="text-[10px] text-white/40 leading-relaxed mt-0.5">Calculates keyword density and identifies critical gaps compared to Enterprise role targets.</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-white">Curated Coaching</p>
                          <p className="text-[10px] text-white/40 leading-relaxed mt-0.5">Generates precise micro-remedy steps targeting formatting, impact verbs, and stack skills.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl text-[9px] text-white/40 leading-relaxed flex items-start gap-2">
                    <Sparkles className="text-violet-400 shrink-0 mt-0.5" size={10} />
                    Parsed resume profiles are stored securely in your private cloud user profile database.
                  </div>
                </div>
              </div>
            ) : (
              /* ACTIVE PERSISTENT PROFILE VIEW */
              <div className="space-y-6">
                {/* Overall Score Banner */}
                <div className="card-premium p-6 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/[0.02] rounded-full blur-3xl" />
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 z-10">
                    {/* Score radial/gauge representation */}
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/20 flex flex-col items-center justify-center relative shadow-inner shrink-0">
                      <span className="text-2xl font-black text-white">{user.resume.score}%</span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-violet-300 mt-0.5">ATS index</span>
                    </div>

                    <div className="space-y-1 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-block text-[8px] font-black tracking-wider uppercase px-2 py-0.5 bg-violet-500/10 border border-violet-500/20 text-violet-300 rounded">
                          ATS Scorecard calibrated
                        </span>
                        <span className="text-[10px] text-white/30 font-mono">
                          Parsed: {new Date(user.resume.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-white">{user.resume.fileName}</h3>
                      <p className="text-xs text-white/50">
                        Target Path: <span className="text-violet-400 font-bold">{user.resume.roleAlignment}</span> — matched with high keyword alignment.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0 z-10 w-full md:w-auto">
                    <button
                      onClick={handleConfigureMockSession}
                      className="flex-1 md:flex-none btn-premium-primary py-2.5 px-5 text-[10px] flex items-center justify-center gap-1.5"
                    >
                      <Play size={11} />
                      Practice This Track
                    </button>
                    <button
                      onClick={handleRemoveResume}
                      className="flex-1 md:flex-none btn-premium-secondary py-2.5 px-4 text-[10px] text-white/50 hover:text-red-400"
                    >
                      Remove File
                    </button>
                  </div>
                </div>

                {/* Bento layout recommendations and details */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Parsed categories */}
                  <div className="lg:col-span-2 space-y-5">
                    {/* Inner tab navigator */}
                    <div className="flex border-b border-white/[0.05] gap-4">
                      {(['skills', 'experience', 'projects', 'education'] as const).map((section) => (
                        <button
                          key={section}
                          onClick={() => setActiveResumeSection(section)}
                          className={cn(
                            "pb-3 text-[11px] font-black uppercase tracking-wider transition-all relative",
                            activeResumeSection === section 
                              ? "text-violet-400" 
                              : "text-white/40 hover:text-white"
                          )}
                        >
                          {section}
                          {activeResumeSection === section && (
                            <motion.div layoutId="active-section-line" className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="min-h-[280px]">
                      {activeResumeSection === 'skills' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="card-premium p-5 text-left space-y-4"
                        >
                          <div>
                            <h4 className="text-xs font-bold text-white">Detected Skill Stack</h4>
                            <p className="text-[10px] text-white/40 mt-0.5">Parsed index of core technologies, methodologies, and framework competencies.</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {user.resume.extractedSkills.map((skill, index) => (
                              <span 
                                key={index}
                                className="px-3 py-1.5 rounded-xl bg-violet-600/[0.04] hover:bg-violet-600/[0.08] border border-violet-500/15 text-violet-200 text-xs font-mono font-bold transition-all"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {activeResumeSection === 'experience' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          {user.resume.experience.length === 0 ? (
                            <div className="py-12 text-center text-white/30 text-xs">No parsed experience modules found</div>
                          ) : (
                            user.resume.experience.map((exp, index) => (
                              <div key={index} className="card-premium p-5 text-left space-y-3 relative group hover:border-violet-500/15 transition-all">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-white/[0.03] pb-2.5">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-violet-600/5 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                                      <Briefcase size={14} />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-black text-white">{exp.role}</h4>
                                      <p className="text-[10px] text-white/50">{exp.company}</p>
                                    </div>
                                  </div>
                                  <span className="text-[9px] font-mono font-bold bg-white/5 text-white/40 py-0.5 px-2 rounded-md self-start sm:self-center">
                                    {exp.period}
                                  </span>
                                </div>

                                <ul className="space-y-1.5 pl-3">
                                  {exp.highlights.map((bullet, bIdx) => (
                                    <li key={bIdx} className="text-xs text-white/70 leading-relaxed list-disc">
                                      {bullet}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))
                          )}
                        </motion.div>
                      )}

                      {activeResumeSection === 'projects' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                          {user.resume.projects.length === 0 ? (
                            <div className="col-span-2 py-12 text-center text-white/30 text-xs">No parsed projects identified</div>
                          ) : (
                            user.resume.projects.map((proj, index) => (
                              <div key={index} className="card-premium p-5 text-left flex flex-col justify-between space-y-4 hover:border-violet-500/15 transition-colors">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <FolderGit2 className="text-violet-400 shrink-0" size={15} />
                                    <h4 className="text-xs font-black text-white">{proj.title}</h4>
                                  </div>
                                  <p className="text-[11px] text-white/60 leading-relaxed">{proj.description}</p>
                                </div>

                                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.03]">
                                  {proj.tech.map((t, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-white/40 text-[9px] font-mono font-bold">{t}</span>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </motion.div>
                      )}

                      {activeResumeSection === 'education' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-4"
                        >
                          {user.resume.education.length === 0 ? (
                            <div className="py-12 text-center text-white/30 text-xs">No education records resolved</div>
                          ) : (
                            user.resume.education.map((edu, index) => (
                              <div key={index} className="card-premium p-5 text-left flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-violet-600/5 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                                    <GraduationCap size={16} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-black text-white">{edu.degree}</h4>
                                    <p className="text-[10px] text-white/40 mt-0.5">{edu.school}</p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-mono font-bold bg-white/5 text-white/40 py-0.5 px-2 rounded-md shrink-0">
                                  {edu.period}
                                </span>
                              </div>
                            ))
                          )}

                          {user.resume.certifications.length > 0 && (
                            <div className="card-premium p-5 text-left space-y-3">
                              <h4 className="text-xs font-black text-white flex items-center gap-2">
                                <Award className="text-violet-400" size={14} /> Professional Certifications
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {user.resume.certifications.map((cert, index) => (
                                  <span key={index} className="px-2.5 py-1 rounded bg-violet-500/5 border border-violet-500/10 text-white/70 text-[10px] font-mono font-bold">{cert}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: AI recommendations */}
                  <div className="space-y-5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-400">Actionable AI Recommendations</h4>
                    
                    <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                      {user.resume.recommendations.map((rec, index) => (
                        <div 
                          key={index} 
                          className="card-premium p-4.5 text-left relative overflow-hidden flex gap-3 hover:border-violet-500/15 transition-all"
                        >
                          <div className={cn(
                            "w-1 absolute left-0 top-0 bottom-0",
                            rec.priority === 'high' ? 'bg-red-500' : rec.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                          )} />
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={cn(
                                "text-[7px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider",
                                rec.priority === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : rec.priority === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              )}>
                                {rec.priority} Priority
                              </span>
                              <span className="text-[7px] font-bold uppercase tracking-wider text-white/30 font-mono">
                                {rec.category}
                              </span>
                            </div>
                            
                            <h5 className="text-xs font-bold text-white">{rec.title}</h5>
                            <p className="text-[10px] text-white/50 leading-relaxed">{rec.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* ========================================================= */
          /* 2. LEARNING HUB                                          */
          /* ========================================================= */
          <motion.div
            key="learning-hub"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {learningStats.completedCount === 0 ? (
              /* ONBOARDING STATE: NO PAST INTERVIEWS TAKEN */
              <div className="card-premium p-12 text-center flex flex-col items-center justify-center space-y-6 min-h-[350px]">
                <div className="w-14 h-14 bg-violet-600/5 border border-violet-500/20 rounded-2xl flex items-center justify-center text-violet-400 shadow-inner">
                  <TrendingUp size={22} className="animate-bounce" />
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white">Dynamic Learning Roadmap</h3>
                  <p className="text-xs text-white/50 leading-relaxed">
                    Take your first practice interview session with Dr. Banner to unlock real-time performance synthesis, skill progression, and customized coaching plans.
                  </p>
                </div>

                <button
                  onClick={() => { setActiveTab('interview'); showToast('Starting practice simulator...', 'info'); }}
                  className="btn-premium-primary px-6 py-2.5 text-[10px] flex items-center gap-1.5"
                >
                  <Play size={10} />
                  Conduct Initial Practice Run
                </button>
              </div>
            ) : (
              /* ACTIVE PERFORMANCE PROFILE & ANALYTICAL DASHBOARD */
              <div className="space-y-6">
                {/* Stats indicators bento block */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="card-premium p-4.5 text-left space-y-1 relative">
                    <span className="text-[8px] font-black text-white/40 uppercase font-mono tracking-wider">Practice Loops</span>
                    <p className="text-2xl font-black text-white">{learningStats.completedCount}</p>
                    <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
                      <CheckCircle2 size={9} /> Loop calibrated
                    </p>
                  </div>

                  <div className="card-premium p-4.5 text-left space-y-1 relative">
                    <span className="text-[8px] font-black text-white/40 uppercase font-mono tracking-wider">Average Evaluation</span>
                    <p className="text-2xl font-black text-white">{learningStats.averageScore}%</p>
                    <p className="text-[9px] text-white/30 uppercase font-mono mt-1">Placement goal is 85%</p>
                  </div>

                  <div className="card-premium p-4.5 text-left space-y-1 relative">
                    <span className="text-[8px] font-black text-white/40 uppercase font-mono tracking-wider">Practice Streak</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Flame size={16} className="text-orange-500 animate-pulse" />
                      <p className="text-2xl font-black text-white">{learningStats.streakDays} Days</p>
                    </div>
                    <p className="text-[9px] text-orange-400 font-bold uppercase tracking-wider mt-1">1.2x boost calibrated</p>
                  </div>

                  <div className="card-premium p-4.5 text-left space-y-1 relative">
                    <span className="text-[8px] font-black text-white/40 uppercase font-mono tracking-wider">Placement Tier</span>
                    <p className="text-lg font-black text-violet-400 mt-1 uppercase tracking-tight">
                      {learningStats.averageScore >= 80 ? 'Placement Ready' : 'In-Development'}
                    </p>
                    <p className="text-[9px] text-white/30 uppercase font-mono mt-1">Calibrated from sessions</p>
                  </div>
                </div>

                {/* Analytical charts & focus suggestions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left panel: Aggregated progression pillars */}
                  <div className="lg:col-span-2 card-premium p-5 text-left space-y-5">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-wider">Historical Skill Progression</h4>
                      <p className="text-[10px] text-white/40 mt-0.5">Aggregated metrics compiled across all active practice sessions.</p>
                    </div>

                    <div className="space-y-4">
                      {/* Pillars */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-white/70">
                          <span>Technical Skill Corrector</span>
                          <span className="font-mono text-violet-400">{learningStats.technicalAverage}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${learningStats.technicalAverage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500" 
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-white/70">
                          <span>Communication Delivery</span>
                          <span className="font-mono text-violet-400">{learningStats.communicationAverage}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${learningStats.communicationAverage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500" 
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-white/70">
                          <span>Poise & Presentation Confidence</span>
                          <span className="font-mono text-violet-400">{learningStats.confidenceAverage}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${learningStats.confidenceAverage}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-white/[0.04] pt-4.5 mt-4 text-[10px] text-white/40 leading-relaxed space-y-1 bg-white/[0.01] p-3 rounded-xl border border-white/[0.03]">
                      <p className="font-bold text-white/60">💡 Placement Analyst Diagnosis:</p>
                      <p>
                        {learningStats.technicalAverage < 80 
                          ? "Focus on expanding your conceptual breadth. Use clear architectural examples with specific tech stack keyword citations." 
                          : "Strong technical foundations! Push for the Staff level by polishing delivery speed and structuring behavioral loops."}
                      </p>
                    </div>
                  </div>

                  {/* Right panel: Adaptive micro recommendations */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-violet-400">Target Coaching Directives</h4>
                    
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      <div className="card-premium p-4 text-left space-y-2 hover:border-violet-500/15 transition-colors">
                        <span className="text-[7px] font-black uppercase tracking-wider bg-violet-500/10 border border-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">STAR METHODOLOGY</span>
                        <h5 className="text-xs font-bold text-white">Structure Behavioral Responses</h5>
                        <p className="text-[10px] text-white/50 leading-relaxed">Ensure all behavioral answers clearly frame the Situation, Task, Action, and explicit quantitative Outcome.</p>
                      </div>

                      <div className="card-premium p-4 text-left space-y-2 hover:border-violet-500/15 transition-colors">
                        <span className="text-[7px] font-black uppercase tracking-wider bg-violet-500/10 border border-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded">VIRTUAL PRESENCE</span>
                        <h5 className="text-xs font-bold text-white">Vocal Tone & Pace Calibration</h5>
                        <p className="text-[10px] text-white/50 leading-relaxed">Maintain steady, deliberate sentence phrasing. Avoid starting comments with fillers (e.g., um, so, okay).</p>
                      </div>

                      {user.resume && (
                        <div className="card-premium p-4 text-left space-y-2 hover:border-violet-500/15 transition-colors bg-gradient-to-br from-[#090c14] to-violet-950/20">
                          <span className="text-[7px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">RESUME INTEGRATED</span>
                          <h5 className="text-xs font-bold text-white">Project Deep Dive Preparation</h5>
                          <p className="text-[10px] text-white/50 leading-relaxed">Prepare to thoroughly defend the design choices and architectural boundaries highlighted in your parsed project profiles.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
