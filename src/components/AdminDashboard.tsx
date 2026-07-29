import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Search, 
  Calendar, 
  User, 
  Award, 
  FileText,
  TrendingUp,
  Clock,
  LayoutDashboard,
  Users,
  BookOpen,
  Sliders,
  ShieldCheck,
  Activity,
  Plus,
  Trash,
  Edit2,
  Database,
  Cpu,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  Download,
  Check,
  ExternalLink,
  Volume2,
  Sliders as SlidersIcon,
  HelpCircle
} from 'lucide-react';
import { 
  getInterviewHistory, 
  getAllUserProfiles, 
  updateUserProfileRole, 
  deleteUserProfile, 
  getCustomQuestions, 
  saveCustomQuestion, 
  deleteCustomQuestion, 
  getSystemConfig, 
  saveSystemConfig,
  AdminUserProfile,
  CustomQuestion,
  SystemConfig,
  getLoginActivities
} from '../lib/firestore';
import { generateCustomQuestionsAI } from '../services/gemini';
import { LiveHealthMonitor } from './LiveHealthMonitor';

interface AdminDashboardProps {
  onBack: () => void;
  isTab?: boolean;
  userId?: string;
}

type TabType = 'overview' | 'users' | 'sessions' | 'questions' | 'config' | 'monitoring';

export default function AdminDashboard({ onBack, isTab = false, userId }: AdminDashboardProps) {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Firestore & Live States
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [loginActivities, setLoginActivities] = useState<any[]>([]);

  // Search, Filters & Pagination States
  const [searchQuery, setSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'candidate'>('all');
  const [sessionScoreFilter, setSessionScoreFilter] = useState<'all' | 'high' | 'mid' | 'low'>('all');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState<string>('all');
  const [questionDiffFilter, setQuestionDiffFilter] = useState<string>('all');

  // Sorting
  const [userSortField, setUserSortField] = useState<'name' | 'email' | 'score'>('name');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sessionSortField, setSessionSortField] = useState<'date' | 'score'>('date');
  const [sessionSortOrder, setSessionSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination current pages
  const [userPage, setUserPage] = useState(1);
  const [sessionPage, setSessionPage] = useState(1);
  const [questionPage, setQuestionPage] = useState(1);
  const itemsPerPage = 5;

  // Selected Inspect Details
  const [selectedUser, setSelectedUser] = useState<AdminUserProfile | null>(null);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  // New Question Form
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState('');
  const [newQuestionRole, setNewQuestionRole] = useState('Software Engineer');
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState<'Junior' | 'Mid' | 'Senior'>('Mid');
  const [newQuestionKeywords, setNewQuestionKeywords] = useState('');

  // AI Question Generation Workspace
  const [aiGenRole, setAiGenRole] = useState('Software Engineer');
  const [aiGenTopic, setAiGenTopic] = useState('System Design');
  const [aiGenDifficulty, setAiGenDifficulty] = useState<'Junior' | 'Mid' | 'Senior'>('Mid');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<any[]>([]);

  // Toast Alerts
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [historyData, usersData, questionsData, configData, loginData] = await Promise.all([
        getInterviewHistory(userId || 'demo-admin-123'),
        getAllUserProfiles(),
        getCustomQuestions(),
        getSystemConfig(),
        getLoginActivities(userId || 'demo-admin-123')
      ]);

      setInterviews(historyData);
      setUsers(usersData);
      setQuestions(questionsData);
      setSystemConfig(configData);
      setLoginActivities(loginData);
    } catch (err) {
      console.error("Error loading administration details:", err);
      showToast("Data fetched with adaptive demo backups", "success");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [userId]);

  // Handle Question CRUD
  const handleAddQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    const keywordsArray = newQuestionKeywords
      .split(',')
      .map(k => k.trim().toLowerCase())
      .filter(k => k.length > 0);

    const questionObj: CustomQuestion = {
      id: `custom_q_${Date.now()}`,
      question: newQuestionText,
      category: newQuestionCategory || 'General',
      targetRole: newQuestionRole,
      difficulty: newQuestionDifficulty,
      expectedKeywords: keywordsArray.length > 0 ? keywordsArray : ['experience']
    };

    try {
      await saveCustomQuestion(questionObj);
      setQuestions(prev => [questionObj, ...prev]);
      setIsAddingQuestion(false);
      setNewQuestionText('');
      setNewQuestionCategory('');
      setNewQuestionKeywords('');
      showToast("Custom question deployed to AI bank");
    } catch (err) {
      showToast("Failed to save custom question", "error");
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    try {
      await deleteCustomQuestion(qId);
      setQuestions(prev => prev.filter(q => q.id !== qId));
      showToast("Question decommissioned from bank");
    } catch (err) {
      showToast("Failed to delete question", "error");
    }
  };

  // AI Question Generation Engine
  const triggerAIGeneration = async () => {
    if (!aiGenTopic.trim()) {
      showToast("Topic definition is required", "error");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const generated = await generateCustomQuestionsAI(aiGenRole, aiGenTopic, aiGenDifficulty);
      setAiGeneratedQuestions(generated);
      showToast("Dynamic interview questions generated successfully");
    } catch (err) {
      showToast("API generation error", "error");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const importAIGeneratedQuestion = async (item: any, index: number) => {
    const questionObj: CustomQuestion = {
      id: `ai_q_${Date.now()}_${index}`,
      question: item.question,
      category: item.category || aiGenTopic,
      targetRole: aiGenRole,
      difficulty: aiGenDifficulty,
      expectedKeywords: item.expectedKeywords || ['architecture']
    };

    try {
      await saveCustomQuestion(questionObj);
      setQuestions(prev => [questionObj, ...prev]);
      setAiGeneratedQuestions(prev => prev.filter((_, idx) => idx !== index));
      showToast("Approved AI question synced into main database");
    } catch (err) {
      showToast("Failed to sync question", "error");
    }
  };

  // Toggle user permissions
  const handleToggleUserRole = async (u: AdminUserProfile) => {
    const targetRole = u.role === 'admin' ? 'candidate' : 'admin';
    try {
      await updateUserProfileRole(u.uid, targetRole);
      setUsers(prev => prev.map(userItem => {
        if (userItem.uid === u.uid) {
          return { ...userItem, role: targetRole };
        }
        return userItem;
      }));
      showToast(`User permissions updated to ${targetRole}`);
      if (selectedUser?.uid === u.uid) {
        setSelectedUser(prev => prev ? { ...prev, role: targetRole } : null);
      }
    } catch (err) {
      showToast("Failed to modify user permission", "error");
    }
  };

  const handleDeleteUserClick = async (u: AdminUserProfile) => {
    if (confirm(`Decommission all platform operations for ${u.displayName}?`)) {
      try {
        await deleteUserProfile(u.uid);
        setUsers(prev => prev.filter(userItem => userItem.uid !== u.uid));
        showToast("User successfully decommissioned from platform");
        if (selectedUser?.uid === u.uid) {
          setSelectedUser(null);
        }
      } catch (err) {
        showToast("Deletion blocked", "error");
      }
    }
  };

  // Save Config Settings
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemConfig) return;
    try {
      await saveSystemConfig(systemConfig);
      showToast("AI calibration variables saved and deployed live");
    } catch (err) {
      showToast("Configuration save failed", "error");
    }
  };

  const handleConfigFeatureToggle = (key: keyof SystemConfig['activeFeatures']) => {
    if (!systemConfig) return;
    setSystemConfig({
      ...systemConfig,
      activeFeatures: {
        ...systemConfig.activeFeatures,
        [key]: !systemConfig.activeFeatures[key]
      }
    });
  };

  // Helper calculation metrics
  const totalInterviewsCount = interviews.length;
  const averageScore = Math.round(
    interviews.reduce((acc, i) => acc + (i.overallScore || 0), 0) / (totalInterviewsCount || 1)
  );
  const successPassRate = Math.round(
    (interviews.filter(i => (i.overallScore || 0) >= 75).length / (totalInterviewsCount || 1)) * 100
  );
  const averageCandidateAtsScore = Math.round(
    users.filter(u => u.resume?.score).reduce((acc, u) => acc + (u.resume?.score || 0), 0) / 
    (users.filter(u => u.resume?.score).length || 1)
  );

  // Filters & Sorting Execution
  // 1. Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = userRoleFilter === 'all' ? true : u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comp = 0;
    if (userSortField === 'name') {
      comp = (a.displayName || '').localeCompare(b.displayName || '');
    } else if (userSortField === 'email') {
      comp = (a.email || '').localeCompare(b.email || '');
    } else if (userSortField === 'score') {
      comp = (a.resume?.score || 0) - (b.resume?.score || 0);
    }
    return userSortOrder === 'asc' ? comp : -comp;
  });

  // 2. Sessions
  const filteredSessions = interviews.filter(s => {
    const matchesSearch = s.candidateName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.targetRole?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesScore = true;
    if (sessionScoreFilter === 'high') matchesScore = (s.overallScore || 0) >= 80;
    else if (sessionScoreFilter === 'mid') matchesScore = (s.overallScore || 0) >= 60 && (s.overallScore || 0) < 80;
    else if (sessionScoreFilter === 'low') matchesScore = (s.overallScore || 0) < 60;

    return matchesSearch && matchesScore;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    let comp = 0;
    if (sessionSortField === 'date') {
      const aTime = a.timestamp?.seconds || 0;
      const bTime = b.timestamp?.seconds || 0;
      comp = aTime - bTime;
    } else if (sessionSortField === 'score') {
      comp = (a.overallScore || 0) - (b.overallScore || 0);
    }
    return sessionSortOrder === 'asc' ? comp : -comp;
  });

  // 3. Questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.targetRole.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = questionCategoryFilter === 'all' ? true : q.category === questionCategoryFilter;
    const matchesDiff = questionDiffFilter === 'all' ? true : q.difficulty === questionDiffFilter;
    return matchesSearch && matchesCat && matchesDiff;
  });

  // Paginated Slices
  const paginatedUsers = sortedUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);
  const paginatedSessions = sortedSessions.slice((sessionPage - 1) * itemsPerPage, sessionPage * itemsPerPage);
  const paginatedQuestions = filteredQuestions.slice((questionPage - 1) * itemsPerPage, questionPage * itemsPerPage);

  const totalUserPages = Math.ceil(sortedUsers.length / itemsPerPage) || 1;
  const totalSessionPages = Math.ceil(sortedSessions.length / itemsPerPage) || 1;
  const totalQuestionPages = Math.ceil(filteredQuestions.length / itemsPerPage) || 1;

  // Question Categories Extraction for dropdown
  const uniqueCategories = Array.from(new Set(questions.map(q => q.category)));

  // SVG Chart path calculators
  // Generating a beautiful path coordinate set for dynamic scores
  const generateChartPath = (data: number[], width: number, height: number) => {
    if (data.length === 0) return '';
    const maxVal = 100;
    const xStep = width / Math.max(1, data.length - 1);
    
    return data.map((val, idx) => {
      const x = idx * xStep;
      const y = height - (val / maxVal) * height;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const sparklineData = interviews.slice(0, 10).reverse().map(i => i.overallScore || 50);
  if (sparklineData.length === 0) {
    sparklineData.push(65, 72, 68, 84, 90, 78, 82, 88);
  }

  function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
  }

  return (
    <div className={cn(
      "text-slate-100 flex min-h-screen bg-[#07090e]",
      isTab ? "w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5" : ""
    )}>
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl border flex items-center gap-3 shadow-2xl backdrop-blur-xl",
              toast.type === 'error' 
                ? "bg-red-500/10 border-red-500/30 text-red-200" 
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
            )}
          >
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
            <span className="text-xs font-semibold tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Admin Scaffold Grid */}
      <div className="flex-1 flex flex-col md:flex-row relative">
        
        {/* Navigation Sidebar */}
        <aside className="w-full md:w-64 bg-[#0a0d16]/95 border-b md:border-b-0 md:border-r border-white/[0.05] p-5 flex flex-col justify-between shrink-0">
          <div className="space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-white/[0.05]">
              <div className="w-9 h-9 bg-violet-600/20 border border-violet-500/30 rounded-xl flex items-center justify-center text-violet-400 font-black shadow-lg shadow-violet-900/10">
                <ShieldCheck size={20} className="animate-pulse" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-widest text-white uppercase font-display">Dr. Banner</h1>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Admin Console v3.2</p>
              </div>
            </div>

            <nav className="space-y-1.5">
              {[
                { id: 'overview', label: 'Operational Overview', icon: LayoutDashboard },
                { id: 'users', label: 'User Management', icon: Users, badge: users.length },
                { id: 'sessions', label: 'Interview Sessions', icon: FileText, badge: interviews.length },
                { id: 'questions', label: 'AI Question Bank', icon: BookOpen, badge: questions.length },
                { id: 'config', label: 'AI Model Settings', icon: Sliders },
                { id: 'monitoring', label: 'Security & Systems', icon: Activity }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as TabType);
                    setSearchQuery('');
                  }}
                  className={cn(
                    "w-full px-3.5 py-3 rounded-xl text-left text-xs font-semibold tracking-wide flex items-center justify-between transition-all group",
                    activeTab === item.id 
                      ? "bg-violet-600/10 border border-violet-500/20 text-violet-300" 
                      : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className={cn(
                      "transition-colors",
                      activeTab === item.id ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"
                    )} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={cn(
                      "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md",
                      activeTab === item.id ? "bg-violet-500/20 text-violet-300" : "bg-white/5 text-slate-400"
                    )}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/[0.05] mt-6 md:mt-0 space-y-4">
            <div className="bg-[#0f1424]/40 border border-white/[0.04] p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[10px] text-white/50">
                <span className="flex items-center gap-1.5"><Activity size={10} className="text-emerald-400" /> API Gateway</span>
                <span className="font-mono text-emerald-400 font-bold">99.98%</span>
              </div>
              <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[99.98%]" />
              </div>
            </div>

            <button
              onClick={onBack}
              className="w-full px-3.5 py-3.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft size={14} /> Back to App
            </button>
          </div>
        </aside>

        {/* Console Workspace Area */}
        <main className="flex-1 flex flex-col min-h-0 bg-[#07090e] p-4 md:p-8 overflow-y-auto">
          
          {/* Header Banner */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 mb-8 border-b border-white/[0.05]">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-widest text-violet-400">Dr. Banner Workspace</span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight capitalize mt-1 font-display">
                {activeTab.replace('_', ' ')}
              </h2>
            </div>

            {/* Global Search Interface for Directory/Logs tabs */}
            {['users', 'sessions', 'questions'].includes(activeTab) && (
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input 
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setUserPage(1);
                    setSessionPage(1);
                    setQuestionPage(1);
                  }}
                  className="input-premium pl-10 py-2.5 text-xs bg-[#0b0e17]/80"
                />
              </div>
            )}
          </header>

          {/* Loader Overlay */}
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="animate-spin text-violet-400" size={32} />
              <div className="text-center space-y-1">
                <p className="text-xs font-mono tracking-widest text-white/60">ESTABLISHING FIREBASE CONNECTION...</p>
                <p className="text-[10px] text-white/35 font-mono">Calibrating workspace variables</p>
              </div>
            </div>
          )}

          {!loading && (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-8"
              >
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Metrics grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: 'Total Interviews', value: totalInterviewsCount, icon: FileText, desc: 'Practice sessions conducted', color: 'text-violet-400' },
                        { label: 'Avg Interview Score', value: `${averageScore}%`, icon: TrendingUp, desc: 'STAR evaluation rating', color: 'text-emerald-400' },
                        { label: 'Elite Readiness Pass', value: `${successPassRate}%`, icon: Award, desc: 'Scoring above 75%', color: 'text-amber-400' },
                        { label: 'Avg ATS Calibrator', value: `${averageCandidateAtsScore || 'N/A'}%`, icon: Users, desc: 'Parsed resume ATS score', color: 'text-blue-400' }
                      ].map((stat, i) => (
                        <div key={i} className="card-premium p-5 flex flex-col justify-between relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] rounded-full blur-xl group-hover:bg-violet-500/[0.01] transition-all" />
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold tracking-widest text-white/40 uppercase">{stat.label}</span>
                            <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl">
                              <stat.icon size={16} className={stat.color} />
                            </div>
                          </div>
                          <div className="mt-4">
                            <h4 className="text-3xl font-black text-white tracking-tight">{stat.value}</h4>
                            <p className="text-[10px] text-slate-500 mt-1">{stat.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dashboard Charts & Streams */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* SVG Performance Chart Block */}
                      <div className="lg:col-span-2 card-premium p-6 space-y-6">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-white">Placement Readiness Flow</h3>
                            <p className="text-[10px] text-slate-400 mt-0.5">Mock evaluation performance score trajectory (last 10 sessions)</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Dynamic Trajectory</span>
                          </div>
                        </div>

                        {/* Interactive Graph Box */}
                        <div className="relative h-64 bg-[#0a0d17]/40 border border-white/[0.04] rounded-xl overflow-hidden p-4">
                          <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                            {/* Horizontal gridlines */}
                            <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                            <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                            <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                            {/* Main path line */}
                            <path 
                              d={generateChartPath(sparklineData, 500, 200)}
                              fill="none" 
                              stroke="url(#chartGrad)" 
                              strokeWidth="3.5" 
                              strokeLinecap="round"
                            />
                            
                            {/* Glow mesh */}
                            <path 
                              d={generateChartPath(sparklineData, 500, 200)}
                              fill="none" 
                              stroke="#8b5cf6" 
                              strokeWidth="8" 
                              strokeOpacity="0.12"
                              strokeLinecap="round"
                            />

                            {/* Dynamic Gradients */}
                            <defs>
                              <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8b5cf6" />
                                <stop offset="100%" stopColor="#6366f1" />
                              </linearGradient>
                            </defs>
                          </svg>

                          {/* Float markers */}
                          <div className="absolute top-2 left-3 text-[9px] font-mono text-slate-500 font-bold">100% EXCELLENT</div>
                          <div className="absolute top-24 left-3 text-[9px] font-mono text-slate-500 font-bold">50% PASSING</div>
                          <div className="absolute bottom-2 left-3 text-[9px] font-mono text-slate-500 font-bold">0% FAIL</div>
                        </div>
                      </div>

                      {/* Right Hand: Active Monitors */}
                      <LiveHealthMonitor />

                    </div>

                    {/* Operational Streams */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Left: Recent Activity Stream */}
                      <div className="card-premium p-6 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <Activity size={14} className="text-violet-400" /> Platform Security Logs
                        </h3>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                          {loginActivities.length === 0 ? (
                            <p className="text-xs text-slate-500 font-mono italic">No security activity logs recorded.</p>
                          ) : (
                            loginActivities.slice(0, 5).map((act, idx) => (
                              <div key={idx} className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-start gap-3 text-left">
                                <div className="p-1.5 bg-violet-500/10 rounded-lg text-violet-400 mt-0.5 shrink-0">
                                  <Clock size={12} />
                                </div>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <p className="text-[11px] font-mono text-slate-200 truncate font-semibold">{act.email}</p>
                                  <p className="text-[9px] text-slate-500 font-mono leading-relaxed truncate">{act.userAgent}</p>
                                </div>
                                <span className="text-[9px] text-violet-300 bg-violet-500/10 border border-violet-500/10 px-1.5 py-0.5 rounded font-mono shrink-0">
                                  {act.timestamp ? new Date(act.timestamp.seconds * 1000).toLocaleTimeString() : 'Recent'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Right: Recent Placement Submissions */}
                      <div className="card-premium p-6 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                          <CheckCircle size={14} className="text-emerald-400" /> Recent Placement Reports
                        </h3>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                          {interviews.length === 0 ? (
                            <p className="text-xs text-slate-500 font-mono italic">No practice reports recorded yet.</p>
                          ) : (
                            interviews.slice(0, 5).map((session, idx) => (
                              <div 
                                key={idx} 
                                onClick={() => { setSelectedSession(session); setActiveTab('sessions'); }}
                                className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl flex items-center justify-between cursor-pointer hover:border-violet-500/20 hover:bg-white/[0.02] transition-colors text-left"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 font-black text-xs">
                                    {session.candidateName?.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-white">{session.candidateName}</p>
                                    <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-widest font-mono">{session.targetRole}</p>
                                  </div>
                                </div>
                                <span className={cn(
                                  "px-2.5 py-1 rounded-md text-[10px] font-bold font-mono",
                                  session.overallScore >= 80 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                                  session.overallScore >= 60 ? "bg-amber-500/10 text-amber-400 border border-amber-500/10" :
                                  "bg-red-500/10 text-red-400 border border-red-500/10"
                                )}>
                                  {session.overallScore}%
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 2. USER MANAGEMENT TAB */}
                {activeTab === 'users' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      {/* Filter Controls */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Filters:</span>
                        
                        <div className="relative">
                          <select 
                            value={userRoleFilter} 
                            onChange={(e) => { setUserRoleFilter(e.target.value as any); setUserPage(1); }}
                            className="bg-[#0b0e17] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="all">All Roles</option>
                            <option value="admin">Administrator</option>
                            <option value="candidate">Candidate</option>
                          </select>
                        </div>

                        <div className="relative">
                          <select 
                            value={`${userSortField}-${userSortOrder}`} 
                            onChange={(e) => {
                              const [field, order] = e.target.value.split('-');
                              setUserSortField(field as any);
                              setUserSortOrder(order as any);
                            }}
                            className="bg-[#0b0e17] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="email-asc">Email (A-Z)</option>
                            <option value="score-desc">Highest ATS Score</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-slate-500">
                        Showing {sortedUsers.length} Users
                      </div>
                    </div>

                    {/* Table View */}
                    <div className="glass-dark border border-white/5 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">User Identity</th>
                              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Role Authority</th>
                              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Calibration Profile</th>
                              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Registered</th>
                              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedUsers.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-10 text-center text-xs text-slate-500 italic">No registered users match your search or filter.</td>
                              </tr>
                            ) : (
                              paginatedUsers.map((u, i) => (
                                <tr key={u.uid} className="border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.01] transition-colors">
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      {u.photoURL ? (
                                        <img src={u.photoURL} alt={u.displayName} className="w-9 h-9 rounded-xl object-cover border border-white/10 referrerPolicy='no-referrer'" referrerPolicy="no-referrer" />
                                      ) : (
                                        <div className="w-9 h-9 bg-violet-600/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400 font-bold text-xs">
                                          {u.displayName?.charAt(0) || u.email?.charAt(0).toUpperCase()}
                                        </div>
                                      )}
                                      <div>
                                        <span className="font-bold text-xs text-white block">{u.displayName || 'Unnamed User'}</span>
                                        <span className="text-[10px] text-slate-500 block mt-0.5">{u.email}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className={cn(
                                      "px-2.5 py-0.5 rounded text-[9px] font-bold tracking-wider font-mono",
                                      u.role === 'admin' 
                                        ? "bg-violet-500/10 text-violet-300 border border-violet-500/20" 
                                        : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                    )}>
                                      {u.role?.toUpperCase() || 'CANDIDATE'}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    {u.resume ? (
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[9px] font-mono border border-emerald-500/10 font-black">
                                          ATS {u.resume.score}%
                                        </span>
                                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{u.resume.roleAlignment}</span>
                                      </div>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 font-mono italic">No resume synced</span>
                                    )}
                                  </td>
                                  <td className="p-4 text-[11px] text-slate-400 font-mono">
                                    {u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="inline-flex items-center gap-2">
                                      {u.resume && (
                                        <button 
                                          onClick={() => setSelectedUser(u)}
                                          className="p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 text-slate-300 transition-all cursor-pointer"
                                          title="Inspect Candidate Calibration"
                                        >
                                          <FileText size={13} />
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => handleToggleUserRole(u)}
                                        className="p-2 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 text-slate-300 transition-all cursor-pointer"
                                        title="Modify Platform Authority"
                                      >
                                        <UserCheck size={13} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteUserClick(u)}
                                        className="p-2 hover:bg-red-500/10 rounded-lg border border-transparent hover:border-red-500/20 text-red-400 transition-all cursor-pointer"
                                        title="Decommission User Account"
                                      >
                                        <Trash size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Footer */}
                      <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500">Page {userPage} of {totalUserPages}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            disabled={userPage === 1}
                            onClick={() => setUserPage(p => Math.max(1, p - 1))}
                            className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold tracking-wider disabled:opacity-30 cursor-pointer text-slate-300"
                          >
                            PREVIOUS
                          </button>
                          <button 
                            disabled={userPage === totalUserPages}
                            onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))}
                            className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold tracking-wider disabled:opacity-30 cursor-pointer text-slate-300"
                          >
                            NEXT
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 3. INTERVIEW SESSIONS TAB */}
                {activeTab === 'sessions' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      
                      {/* Filtering */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Filters:</span>
                        
                        <div className="relative">
                          <select 
                            value={sessionScoreFilter} 
                            onChange={(e) => { setSessionScoreFilter(e.target.value as any); setSessionPage(1); }}
                            className="bg-[#0b0e17] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="all">All Scores</option>
                            <option value="high">Ready / Strong (80%+)</option>
                            <option value="mid">Developing (60%-79%)</option>
                            <option value="low">Needs Focus (&lt;60%)</option>
                          </select>
                        </div>

                        <div className="relative">
                          <select 
                            value={`${sessionSortField}-${sessionSortOrder}`} 
                            onChange={(e) => {
                              const [field, order] = e.target.value.split('-');
                              setSessionSortField(field as any);
                              setSessionSortOrder(order as any);
                            }}
                            className="bg-[#0b0e17] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="date-desc">Latest First</option>
                            <option value="date-asc">Oldest First</option>
                            <option value="score-desc">Highest Scoring Sessions</option>
                            <option value="score-asc">Lowest Scoring Sessions</option>
                          </select>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">Total: {sortedSessions.length} sessions evaluated</span>
                    </div>

                    {/* Sessions Grid */}
                    <div className="glass-dark border border-white/5 rounded-2xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Candidate Identity</th>
                              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Target Role & Track</th>
                              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Operational score</th>
                              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Evaluation Timestamp</th>
                              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Review Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedSessions.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-10 text-center text-xs text-slate-500 italic">No interview sessions matched. Perform a mock interview first to write evaluation reports!</td>
                              </tr>
                            ) : (
                              paginatedSessions.map((s, idx) => (
                                <tr key={s.id || idx} className="border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.01] transition-colors">
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 bg-violet-600/10 border border-violet-500/20 rounded-lg flex items-center justify-center text-violet-400 font-bold text-xs">
                                        {s.candidateName?.charAt(0) || 'C'}
                                      </div>
                                      <span className="font-bold text-xs text-white">{s.candidateName || 'Unnamed Candidate'}</span>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div>
                                      <span className="text-xs text-white block font-medium">{s.targetRole}</span>
                                      <span className="text-[9px] text-slate-500 block uppercase tracking-wider font-mono mt-0.5">{s.department || 'General Placement'}</span>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className={cn(
                                      "px-2.5 py-1 rounded-md text-[10px] font-mono font-bold border",
                                      s.overallScore >= 80 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                                      s.overallScore >= 60 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                                      "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}>
                                      {s.overallScore || 0}%
                                    </span>
                                  </td>
                                  <td className="p-4 text-[11px] text-slate-400 font-mono">
                                    {s.timestamp ? new Date(s.timestamp.seconds * 1000).toLocaleString() : 'N/A'}
                                  </td>
                                  <td className="p-4 text-right">
                                    <button 
                                      onClick={() => setSelectedSession(s)}
                                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-violet-500/30 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                                    >
                                      <span>OPEN DOSSIER</span> <ChevronRight size={12} />
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500">Page {sessionPage} of {totalSessionPages}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            disabled={sessionPage === 1}
                            onClick={() => setSessionPage(p => Math.max(1, p - 1))}
                            className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold tracking-wider disabled:opacity-30 cursor-pointer text-slate-300"
                          >
                            PREVIOUS
                          </button>
                          <button 
                            disabled={sessionPage === totalSessionPages}
                            onClick={() => setSessionPage(p => Math.min(totalSessionPages, p + 1))}
                            className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold tracking-wider disabled:opacity-30 cursor-pointer text-slate-300"
                          >
                            NEXT
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 4. AI QUESTION BANK MANAGEMENT TAB */}
                {activeTab === 'questions' && (
                  <div className="space-y-8">
                    
                    {/* Top Section: Manual Form & AI Bento Block */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                      
                      {/* Manual Deploy Box */}
                      <div className="lg:col-span-2 card-premium p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black uppercase tracking-wider text-white">Manual Question Deployer</h3>
                          <button 
                            onClick={() => setIsAddingQuestion(!isAddingQuestion)}
                            className="text-[10px] text-violet-400 hover:text-violet-300 font-bold uppercase tracking-wider"
                          >
                            {isAddingQuestion ? 'COLLAPSE' : 'EXPAND FORM'}
                          </button>
                        </div>

                        {isAddingQuestion ? (
                          <form onSubmit={handleAddQuestionSubmit} className="space-y-4 text-left">
                            <div>
                              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Question Statement</label>
                              <textarea 
                                value={newQuestionText}
                                onChange={(e) => setNewQuestionText(e.target.value)}
                                placeholder="Explain how CORS handles non-simple preflight requests..."
                                rows={3}
                                className="input-premium py-2 text-xs font-mono bg-[#0b0e17]/80 mt-1.5"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Target Track</label>
                                <select
                                  value={newQuestionRole}
                                  onChange={(e) => setNewQuestionRole(e.target.value)}
                                  className="input-premium py-2 text-xs bg-[#0b0e17]/80 mt-1.5"
                                >
                                  <option value="Software Engineer">Software Engineer</option>
                                  <option value="Data Analyst">Data Analyst</option>
                                  <option value="Product Manager">Product Manager</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Difficulty Level</label>
                                <select
                                  value={newQuestionDifficulty}
                                  onChange={(e) => setNewQuestionDifficulty(e.target.value as any)}
                                  className="input-premium py-2 text-xs bg-[#0b0e17]/80 mt-1.5"
                                >
                                  <option value="Junior">Junior</option>
                                  <option value="Mid">Mid Level</option>
                                  <option value="Senior">Senior Specialist</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Category</label>
                                <input 
                                  type="text"
                                  value={newQuestionCategory}
                                  onChange={(e) => setNewQuestionCategory(e.target.value)}
                                  placeholder="Frontend / API Design"
                                  className="input-premium py-2 text-xs bg-[#0b0e17]/80 mt-1.5"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Evaluation Keywords</label>
                                <input 
                                  type="text"
                                  value={newQuestionKeywords}
                                  onChange={(e) => setNewQuestionKeywords(e.target.value)}
                                  placeholder="comma, separated, list"
                                  className="input-premium py-2 text-xs bg-[#0b0e17]/80 mt-1.5"
                                />
                              </div>
                            </div>

                            <button 
                              type="submit"
                              className="w-full btn-premium-primary"
                            >
                              <Plus size={14} /> DEPLOY QUESTION STATEMENT
                            </button>
                          </form>
                        ) : (
                          <div className="p-8 bg-[#0b0e17]/30 border border-white/[0.03] rounded-xl text-center space-y-2">
                            <SlidersHorizontal className="mx-auto text-slate-500" size={24} />
                            <p className="text-[11px] text-slate-400 leading-relaxed">Expand the form to seed specific technical and behavioral evaluation metrics manual overrides.</p>
                          </div>
                        )}
                      </div>

                      {/* AI Question Generator Workspace */}
                      <div className="lg:col-span-3 card-premium p-6 space-y-4">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                            <Sparkles className="text-violet-400 animate-pulse" size={16} /> Dr. Banner AI Question Generator
                          </h3>
                          <p className="text-[10px] text-slate-400 mt-0.5">Use Google Gemini to dynamically curate custom placement questions based on specific core topics</p>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Target Role</label>
                            <select
                              value={aiGenRole}
                              onChange={(e) => setAiGenRole(e.target.value)}
                              className="input-premium py-2 text-xs bg-[#0b0e17]/80 mt-1"
                            >
                              <option value="Software Engineer">Software Engineer</option>
                              <option value="Data Analyst">Data Analyst</option>
                              <option value="Product Manager">Product Manager</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Difficulty</label>
                            <select
                              value={aiGenDifficulty}
                              onChange={(e) => setAiGenDifficulty(e.target.value as any)}
                              className="input-premium py-2 text-xs bg-[#0b0e17]/80 mt-1"
                            >
                              <option value="Junior">Junior</option>
                              <option value="Mid">Mid</option>
                              <option value="Senior">Senior</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Focus Topic</label>
                            <input 
                              type="text"
                              value={aiGenTopic}
                              onChange={(e) => setAiGenTopic(e.target.value)}
                              placeholder="e.g. Redux Saga, WebRTC"
                              className="input-premium py-2 text-xs bg-[#0b0e17]/80 mt-1"
                            />
                          </div>
                        </div>

                        <button 
                          onClick={triggerAIGeneration}
                          disabled={isGeneratingAI}
                          className="w-full btn-premium-secondary hover:border-violet-500/30 text-xs font-semibold flex items-center justify-center gap-2"
                        >
                          {isGeneratingAI ? (
                            <>
                              <RefreshCw className="animate-spin text-violet-400" size={14} />
                              <span>BANNER AI THINKING & COMPILING...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="text-violet-400" size={14} />
                              <span>GENERATE 3 CONSOLE QUESTIONS</span>
                            </>
                          )}
                        </button>

                        {/* Generated Preview Queue */}
                        {aiGeneratedQuestions.length > 0 && (
                          <div className="space-y-2 border-t border-white/[0.04] pt-4 mt-4 text-left">
                            <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Generated Candidates for Bank Insertion:</h4>
                            {aiGeneratedQuestions.map((item, index) => (
                              <div key={index} className="p-3 bg-violet-950/10 border border-violet-900/30 rounded-xl space-y-2 relative group flex flex-col justify-between">
                                <p className="text-xs text-slate-200 leading-relaxed pr-10">{item.question}</p>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                  <span className="px-1.5 py-0.5 bg-violet-500/20 text-violet-300 text-[8px] font-mono rounded font-bold uppercase">{item.category}</span>
                                  {item.expectedKeywords?.slice(0, 3).map((kw: string, i: number) => (
                                    <span key={i} className="text-[8px] text-slate-500 font-mono">#{kw}</span>
                                  ))}
                                </div>
                                <button 
                                  onClick={() => importAIGeneratedQuestion(item, index)}
                                  className="absolute top-2 right-2 p-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-[9px] font-bold tracking-wider uppercase transition-all"
                                  title="Approve & Inject"
                                >
                                  <Check size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Question Bank Explorer */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Explorer Filters:</span>
                          <select 
                            value={questionDiffFilter} 
                            onChange={(e) => { setQuestionDiffFilter(e.target.value); setQuestionPage(1); }}
                            className="bg-[#0b0e17] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="all">All Difficulties</option>
                            <option value="Junior">Junior</option>
                            <option value="Mid">Mid Level</option>
                            <option value="Senior">Senior Specialist</option>
                          </select>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">Matching Bank Count: {filteredQuestions.length}</span>
                      </div>

                      <div className="glass-dark border border-white/5 rounded-2xl overflow-hidden text-left">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Question Statement</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Domain Category</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Target role track</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Difficulty</th>
                                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Decommission</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedQuestions.map((q, idx) => (
                                <tr key={q.id || idx} className="border-b border-white/[0.03] last:border-b-0 hover:bg-white/[0.01] transition-colors">
                                  <td className="p-4 max-w-sm">
                                    <p className="text-xs text-slate-200 leading-relaxed font-semibold">{q.question}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {q.expectedKeywords?.slice(0, 4).map((kw, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-white/5 text-slate-400 text-[8px] font-mono rounded border border-white/[0.02]">{kw}</span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <span className="badge-premium">{q.category}</span>
                                  </td>
                                  <td className="p-4 text-xs text-slate-300 font-medium">{q.targetRole}</td>
                                  <td className="p-4">
                                    <span className={cn(
                                      "text-[10px] font-bold",
                                      q.difficulty === 'Senior' ? "text-amber-400" :
                                      q.difficulty === 'Mid' ? "text-violet-400" :
                                      "text-blue-400"
                                    )}>
                                      {q.difficulty}
                                    </span>
                                  </td>
                                  <td className="p-4 text-right">
                                    <button 
                                      onClick={() => handleDeleteQuestion(q.id)}
                                      className="p-2 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 text-red-400 rounded-lg transition-colors cursor-pointer"
                                      title="Decommission from main bank"
                                    >
                                      <Trash size={12} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500">Page {questionPage} of {totalQuestionPages}</span>
                          <div className="flex items-center gap-2">
                            <button 
                              disabled={questionPage === 1}
                              onClick={() => setQuestionPage(p => Math.max(1, p - 1))}
                              className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold tracking-wider disabled:opacity-30 cursor-pointer text-slate-300"
                            >
                              PREVIOUS
                            </button>
                            <button 
                              disabled={questionPage === totalQuestionPages}
                              onClick={() => setQuestionPage(p => Math.min(totalQuestionPages, p + 1))}
                              className="px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold tracking-wider disabled:opacity-30 cursor-pointer text-slate-300"
                            >
                              NEXT
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                  </div>
                )}

                {/* 5. AI CONFIGURATION ENGINE TAB */}
                {activeTab === 'config' && systemConfig && (
                  <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                    
                    {/* Controls panel */}
                    <div className="lg:col-span-2 card-premium p-6 space-y-6">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">AI Model Calibration Panel</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Configure cognitive limits and core parameters for Dr. Banner's evaluation engine.</p>
                      </div>

                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Primary Reasoning Engine</label>
                            <select
                              value={systemConfig.modelName}
                              onChange={(e) => setSystemConfig({ ...systemConfig, modelName: e.target.value })}
                              className="input-premium py-2.5 text-xs bg-[#0b0e17]/80 mt-1.5"
                            >
                              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Superb Pacing & Speech)</option>
                              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Architectural Focus)</option>
                            </select>
                          </div>

                          <div>
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">System Temperature ({systemConfig.temperature})</label>
                              <span className="text-[9px] font-mono text-violet-400 font-bold uppercase">{systemConfig.temperature < 0.3 ? 'Deterministic' : 'Adaptive'}</span>
                            </div>
                            <input 
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={systemConfig.temperature}
                              onChange={(e) => setSystemConfig({ ...systemConfig, temperature: parseFloat(e.target.value) })}
                              className="w-full accent-violet-500 h-1.5 bg-white/10 rounded-lg cursor-pointer mt-3"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Cognitive System Prompt (Dr. Banner persona Instructions)</label>
                          <p className="text-[9px] text-slate-500 leading-relaxed mb-1.5 mt-0.5">Modifying this value directly alters the behavioral guidelines, STAR criteria weighting, and conversational tone of the interviewer.</p>
                          <textarea
                            value={systemConfig.systemPrompt}
                            onChange={(e) => setSystemConfig({ ...systemConfig, systemPrompt: e.target.value })}
                            rows={8}
                            className="input-premium py-2.5 text-xs font-mono bg-[#0b0e17]/80 mt-1.5 leading-relaxed"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/[0.04] flex justify-end">
                        <button type="submit" className="btn-premium-primary">
                          <CheckCircle size={14} /> DEPLOY CALIBRATION OVERRIDES
                        </button>
                      </div>
                    </div>

                    {/* Speech tuning & features side */}
                    <div className="space-y-6">
                      
                      {/* Neural Voice Settings */}
                      <div className="card-premium p-6 space-y-5">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Volume2 className="text-violet-400" size={14} /> Neural Voice Tuning
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Voice Character Profile</label>
                            <select
                              value={systemConfig.voiceGender}
                              onChange={(e) => setSystemConfig({ ...systemConfig, voiceGender: e.target.value as any })}
                              className="input-premium py-2 text-xs bg-[#0b0e17]/80 mt-1"
                            >
                              <option value="male">Dr. Banner (Acoustic Male Prof.)</option>
                              <option value="female">Hana (Empathetic Female Specialist)</option>
                              <option value="neural">SaaS Neural Standard</option>
                            </select>
                          </div>

                          <div>
                            <div className="flex justify-between text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                              <span>Speech Velocity Rate</span>
                              <span className="font-mono text-white">{systemConfig.voiceSpeed}x</span>
                            </div>
                            <input 
                              type="range"
                              min="0.7"
                              max="1.5"
                              step="0.1"
                              value={systemConfig.voiceSpeed}
                              onChange={(e) => setSystemConfig({ ...systemConfig, voiceSpeed: parseFloat(e.target.value) })}
                              className="w-full accent-violet-500 h-1 bg-white/10 rounded cursor-pointer mt-1"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                              <span>Pitch Accentuation</span>
                              <span className="font-mono text-white">{systemConfig.voicePitch}x</span>
                            </div>
                            <input 
                              type="range"
                              min="0.5"
                              max="1.5"
                              step="0.1"
                              value={systemConfig.voicePitch}
                              onChange={(e) => setSystemConfig({ ...systemConfig, voicePitch: parseFloat(e.target.value) })}
                              className="w-full accent-violet-500 h-1 bg-white/10 rounded cursor-pointer mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Flag Feature Controls */}
                      <div className="card-premium p-6 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Sandbox Feature Toggles</h3>
                        <div className="space-y-3">
                          {[
                            { key: 'voiceModulation', label: 'Neural Voice Audio Synthesis', desc: 'Synthesizes TTS speech nodes' },
                            { key: 'realTimeSTARRating', label: 'Real-Time STAR grading', desc: 'Auto-scores response segments live' },
                            { key: 'liveTranslation', label: 'Multilingual Stream Trans', desc: 'Translates foreign terms on telemetry' },
                            { key: 'proctoredWebcamCheck', label: 'Identity Webcam Proct', desc: 'Checks frame geometry parameters' }
                          ].map((flag) => (
                            <div key={flag.key} className="flex items-start justify-between gap-3 text-left">
                              <div>
                                <span className="text-xs font-bold text-white block">{flag.label}</span>
                                <span className="text-[9px] text-slate-500 block mt-0.5">{flag.desc}</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleConfigFeatureToggle(flag.key as any)}
                                className={cn(
                                  "w-9 h-5 rounded-full transition-colors relative shrink-0",
                                  systemConfig.activeFeatures[flag.key as keyof SystemConfig['activeFeatures']] ? "bg-violet-600" : "bg-white/10"
                                )}
                              >
                                <span className={cn(
                                  "absolute h-3.5 w-3.5 rounded-full bg-white top-[3px] transition-all",
                                  systemConfig.activeFeatures[flag.key as keyof SystemConfig['activeFeatures']] ? "left-5" : "left-1"
                                )} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </form>
                )}

                {/* 6. SYSTEM & SECURITY MONITORING TAB */}
                {activeTab === 'monitoring' && (
                  <div className="space-y-6">
                    
                    {/* Live stats dashboard panel */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      <div className="card-premium p-5 space-y-2 text-left">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[10px] font-black uppercase tracking-wider">Database Host</span>
                          <Database size={15} className="text-blue-400" />
                        </div>
                        <p className="text-2xl font-black text-white">Firestore Cloud</p>
                        <div className="pt-2 flex items-center justify-between text-[10px] font-mono border-t border-white/[0.04]">
                          <span className="text-slate-500">Operation Mode</span>
                          <span className="text-slate-300 font-bold uppercase">Multiregion replication</span>
                        </div>
                      </div>

                      <div className="card-premium p-5 space-y-2 text-left">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[10px] font-black uppercase tracking-wider">Compute Host</span>
                          <Cpu size={15} className="text-violet-400" />
                        </div>
                        <p className="text-2xl font-black text-white">V8 Serverless</p>
                        <div className="pt-2 flex items-center justify-between text-[10px] font-mono border-t border-white/[0.04]">
                          <span className="text-slate-500">Environment Target</span>
                          <span className="text-slate-300 font-bold uppercase">Cloud Run Standard</span>
                        </div>
                      </div>

                      <div className="card-premium p-5 space-y-2 text-left">
                        <div className="flex justify-between items-center text-slate-400">
                          <span className="text-[10px] font-black uppercase tracking-wider">Liveness checks</span>
                          <Activity size={15} className="text-emerald-400" />
                        </div>
                        <p className="text-2xl font-black text-emerald-400 font-mono">OK</p>
                        <div className="pt-2 flex items-center justify-between text-[10px] font-mono border-t border-white/[0.04]">
                          <span className="text-slate-500">Heartbeat check</span>
                          <span className="text-emerald-400 font-bold uppercase">Acknowledge in 3ms</span>
                        </div>
                      </div>

                    </div>

                    {/* Detailed Activity Logs */}
                    <div className="card-premium p-6 space-y-4 text-left">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">Platform Security Log Audit</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Complete record of login and credential operations for auditing compliance.</p>
                      </div>

                      <div className="border border-white/5 bg-[#0b0e17]/50 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-white/[0.02] border-b border-white/5 font-mono text-[9px] text-slate-400">
                                <th className="p-3 uppercase">Account Email</th>
                                <th className="p-3 uppercase">Security Event</th>
                                <th className="p-3 uppercase">IP Metadata</th>
                                <th className="p-3 uppercase">Audit Log Signature</th>
                              </tr>
                            </thead>
                            <tbody>
                              {loginActivities.map((act, idx) => (
                                <tr key={idx} className="border-b border-white/[0.02] font-mono text-[11px] last:border-b-0">
                                  <td className="p-3 font-semibold text-white">{act.email}</td>
                                  <td className="p-3">
                                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-bold border border-emerald-500/10">
                                      AUTHORIZED_JWT_LOGIN
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-400">{act.ip || '127.0.0.1'}</td>
                                  <td className="p-3 text-slate-500 truncate max-w-xs">{act.userAgent}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* MODAL: CANDIDATE CALIBRATION ATS RESUME DOSSIER */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-[#04060a]/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-[#090d16] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-600/10 border border-violet-500/20 rounded-xl flex items-center justify-center text-violet-400">
                    <FileText size={18} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black uppercase text-white tracking-wider">Candidate Calibrator Dossier</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{selectedUser.displayName} — {selectedUser.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono tracking-widest text-slate-300 font-bold"
                >
                  CLOSE DOSSIER
                </button>
              </div>

              {/* Dossier details body */}
              <div className="p-6 overflow-y-auto space-y-6 text-left">
                {selectedUser.resume ? (
                  <div className="space-y-6">
                    {/* Top ATS scoring row */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl text-center">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">ATS MATCH SCORE</span>
                        <p className="text-3xl font-black text-emerald-400 font-mono mt-1">{selectedUser.resume.score}%</p>
                      </div>
                      <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl text-center">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">TARGET CAREER MATCH</span>
                        <p className="text-xs text-white font-bold mt-2 truncate leading-normal">{selectedUser.resume.roleAlignment}</p>
                      </div>
                      <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl text-center">
                        <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">CALIBRATION DATE</span>
                        <p className="text-xs text-slate-300 font-mono mt-2 leading-normal">
                          {selectedUser.resume.uploadedAt ? new Date(selectedUser.resume.uploadedAt).toLocaleDateString() : 'Sync Pending'}
                        </p>
                      </div>
                    </div>

                    {/* Extracted skills */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Extracted Technical Competency Mesh:</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUser.resume.extractedSkills?.map((tag: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/15 text-violet-300 text-[10px] font-bold font-mono">
                            {tag.toUpperCase()}
                          </span>
                        )) || <span className="text-xs text-slate-500 font-mono italic">No technical skills parsed.</span>}
                      </div>
                    </div>

                    {/* Professional highlights */}
                    {selectedUser.resume.experience && selectedUser.resume.experience.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Parsed Work Experience:</h4>
                        <div className="space-y-3.5">
                          {selectedUser.resume.experience.map((exp: any, idx: number) => (
                            <div key={idx} className="border-l-2 border-violet-500/20 pl-4 space-y-1">
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-white">{exp.role}</span>
                                <span className="text-[10px] font-mono text-slate-500">{exp.period}</span>
                              </div>
                              <p className="text-[11px] text-violet-300/80 font-medium">{exp.company}</p>
                              <ul className="list-disc pl-4 text-[10px] text-slate-400 space-y-1 mt-1 leading-normal">
                                {exp.highlights?.map((h: string, i: number) => <li key={i}>{h}</li>)}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Educational background */}
                    {selectedUser.resume.education && selectedUser.resume.education.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Parsed Educational Context:</h4>
                        {selectedUser.resume.education.map((edu: any, idx: number) => (
                          <p key={idx} className="text-xs text-slate-300 font-medium">
                            {edu.degree} — <span className="text-slate-500 font-normal">{edu.school} ({edu.period})</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 font-mono text-center italic py-8">User has not completed an ATS resume parse cycle yet.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL / DRAWER: COMPREHENSIVE INTERVIEW DOSSIER REVIEW */}
      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-50 bg-[#04060a]/85 flex items-center justify-end backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, x: 200 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 200 }}
              className="w-full max-w-2xl bg-[#090d16] border-l border-white/10 h-full flex flex-col justify-between shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Operational Interview dossier</h3>
                  <p className="text-base font-black text-white mt-1 leading-tight">{selectedSession.candidateName}</p>
                </div>
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[9px] font-mono tracking-widest text-slate-300 font-bold"
                >
                  CLOSE DOSSIER
                </button>
              </div>

              {/* Dossier content body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
                
                {/* 1. Score KPI grids */}
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Quantitative Competence Scorecard</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl text-center">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Overall Rating</span>
                      <p className="text-xl font-black text-emerald-400 font-mono mt-1">{selectedSession.overallScore}%</p>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl text-center">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Confidence</span>
                      <p className="text-xl font-black text-violet-400 font-mono mt-1">{selectedSession.liveMetrics?.confidence || 75}%</p>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl text-center">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Technical</span>
                      <p className="text-xl font-black text-blue-400 font-mono mt-1">{selectedSession.liveMetrics?.technical || 80}%</p>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl text-center">
                      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Eloquence</span>
                      <p className="text-xl font-black text-amber-400 font-mono mt-1">{selectedSession.liveMetrics?.communication || 78}%</p>
                    </div>
                  </div>
                </div>

                {/* 2. Structured STAR Feedback analysis */}
                {selectedSession.finalAnalysis && (
                  <div className="space-y-4 bg-white/[0.01] border border-white/[0.03] p-5 rounded-xl">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-violet-400" /> Dr. Banner Executive Summary
                      </h4>
                      <p className="text-[10px] text-violet-300 leading-relaxed italic mt-1">{selectedSession.finalAnalysis.summary}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-white/[0.04] text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technical Review:</span>
                        <p className="text-slate-300 leading-normal mt-1 text-[11px]">{selectedSession.finalAnalysis.technicalReview}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Communication Review:</span>
                        <p className="text-slate-300 leading-normal mt-1 text-[11px]">{selectedSession.finalAnalysis.communicationReview}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-2">
                    <h5 className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">Extracted Strengths:</h5>
                    <ul className="space-y-1.5">
                      {selectedSession.strengths?.slice(0, 3).map((st: string, idx: number) => (
                        <li key={idx} className="text-[10px] text-slate-300 leading-normal flex items-start gap-1.5">
                          <CheckCircle size={12} className="text-emerald-400 shrink-0 mt-0.5" /> <span>{st}</span>
                        </li>
                      )) || <li className="text-[10px] text-slate-500 italic">No key strengths highlighted</li>}
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2">
                    <h5 className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Identified focus gaps:</h5>
                    <ul className="space-y-1.5">
                      {selectedSession.improvements?.slice(0, 3).map((imp: string, idx: number) => (
                        <li key={idx} className="text-[10px] text-slate-300 leading-normal flex items-start gap-1.5">
                          <AlertTriangle size={12} className="text-amber-400 shrink-0 mt-0.5" /> <span>{imp}</span>
                        </li>
                      )) || <li className="text-[10px] text-slate-500 italic">No developmental feedback flagged</li>}
                    </ul>
                  </div>
                </div>

                {/* 3. Conversation history blocks */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Conversational Transcript</h4>
                  <div className="space-y-3 bg-[#0a0d17]/60 border border-white/[0.04] p-4 rounded-xl max-h-[350px] overflow-y-auto">
                    {selectedSession.history?.map((chat: any, idx: number) => (
                      <div 
                        key={idx} 
                        className={cn(
                          "p-3 rounded-xl max-w-[85%] text-xs leading-relaxed space-y-1",
                          chat.role === 'user' 
                            ? "bg-violet-600/10 border border-violet-500/20 text-violet-200 ml-auto text-right" 
                            : "bg-white/[0.02] border border-white/[0.04] text-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                            {chat.role === 'user' ? 'Candidate' : 'Dr. Banner'}
                          </span>
                          {chat.emotion && (
                            <span className="text-[8px] font-mono text-violet-400 uppercase bg-violet-500/15 px-1 py-0.5 rounded font-bold">
                              {chat.emotion}
                            </span>
                          )}
                        </div>
                        <p>{chat.text}</p>
                      </div>
                    )) || <p className="text-xs text-slate-500 italic font-mono">Transcript records are unavailable.</p>}
                  </div>
                </div>

              </div>

              {/* Drawer Footer actions */}
              <div className="p-4 bg-[#0a0d17] border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="btn-premium-secondary"
                >
                  Return to Dashboard Logs
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
