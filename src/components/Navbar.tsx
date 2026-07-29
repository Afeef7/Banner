import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Activity, 
  Mic, 
  History as HistoryIcon, 
  BarChart3, 
  FileText, 
  Settings, 
  Shield, 
  Moon, 
  Sun, 
  Bell, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  LogOut, 
  User, 
  X, 
  Menu, 
  Lock, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  UserCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile;
  activeTab: 'dashboard' | 'interview' | 'history' | 'analytics' | 'resume' | 'settings' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'interview' | 'history' | 'analytics' | 'resume' | 'settings' | 'admin') => void;
  isAdminMode: boolean;
  setIsAdminMode: (mode: boolean) => void;
  setSelectedHistoryItem: (item: any | null) => void;
  themeMode: 'dark' | 'light';
  setThemeMode: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
  notifications: any[];
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  logout: () => Promise<void>;
  fetchHistory: () => void;
  isAudioEnabled: boolean;
  setIsAudioEnabled: (enabled: boolean) => void;
  interviewMode: 'chat' | 'video' | null;
  isCameraOn: boolean;
  toggleCamera: () => Promise<void>;
}

export function Navbar({
  user,
  activeTab,
  setActiveTab,
  isAdminMode,
  setIsAdminMode,
  setSelectedHistoryItem,
  themeMode,
  setThemeMode,
  notifications,
  setNotifications,
  isNotificationsOpen,
  setIsNotificationsOpen,
  logout,
  fetchHistory,
  isAudioEnabled,
  setIsAudioEnabled,
  interviewMode,
  isCameraOn,
  toggleCamera,
}: NavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsNotificationsOpen]);

  const handleLogoutAction = async () => {
    setShowLogoutConfirm(false);
    setIsProfileOpen(false);
    await logout();
    setActiveTab('dashboard');
    setIsAdminMode(false);
    setSelectedHistoryItem(null);
  };

  interface MenuItem {
    readonly id: 'dashboard' | 'interview' | 'history' | 'analytics' | 'resume' | 'settings';
    readonly label: string;
    readonly icon: React.ComponentType<{ size?: number; className?: string }>;
    readonly description: string;
    readonly action?: () => void;
  }

  const menuItems: readonly MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, description: 'Practice insights & quick actions' },
    { id: 'interview', label: 'Practice Interview', icon: Mic, description: 'Live session with Dr. Banner' },
    { id: 'history', label: 'Interview History', icon: HistoryIcon, description: 'Past evaluations & transcripts', action: fetchHistory },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Pacing & confidence scores' },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText, description: 'Extract skills & optimize questions' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'API credentials & target roles' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#060813]/80 border-b border-b-white/[0.05] py-3.5 px-4 sm:px-6 flex items-center justify-between w-full shrink-0 select-none">
        
        {/* Left: Branding */}
        <div 
          onClick={() => { 
            setActiveTab('dashboard'); 
            setIsAdminMode(false); 
            setSelectedHistoryItem(null);
            setIsMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group"
          id="navbar-brand-logo"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20 border border-violet-400/20 group-hover:scale-105 transition-all">
            <Sparkles className="text-white animate-pulse" size={16} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold tracking-tight text-white group-hover:text-violet-300 transition-colors">Dr. Banner AI</span>
              <span className="text-[8px] px-1.5 py-0.5 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-md text-violet-300 font-bold tracking-wide">PRO</span>
            </div>
            <p className="text-[8px] text-white/45 uppercase tracking-[0.15em] font-mono leading-none mt-0.5">Enterprise Placement Preparer</p>
          </div>
        </div>

        {/* Center: Desktop Navigation tabs */}
        <nav className="hidden lg:flex items-center gap-1 bg-white/[0.02] border border-white/[0.04] p-1 rounded-2xl" id="desktop-navigation-tabs">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id && !isAdminMode;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsAdminMode(false);
                  setSelectedHistoryItem(null);
                  if (item.action) item.action();
                }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center gap-1.5",
                  isActive
                    ? "bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.05)]"
                    : "text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent"
                )}
                id={`nav-tab-${item.id}`}
              >
                <Icon size={12} className={cn("transition-transform duration-200", isActive && "scale-110")} />
                {item.label}
              </button>
            );
          })}

          {user?.role === 'admin' && (
            <button
              onClick={() => {
                setIsAdminMode(true);
                setActiveTab('admin');
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
                isAdminMode || activeTab === 'admin'
                  ? "bg-gradient-to-r from-red-600/20 to-rose-600/20 text-red-300 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
                  : "text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent"
              )}
              id="nav-tab-admin"
            >
              <Shield size={12} />
              Admin Access
            </button>
          )}
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3 relative" id="navbar-right-action-bar">
          
          {/* Audio and Camera Controls (Only when in active Practice interview tab) */}
          {activeTab === 'interview' && interviewMode !== null && (
            <div className="flex items-center gap-1.5 mr-1" id="interview-quick-controls">
              <button 
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className="p-2 bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 rounded-xl transition-all cursor-pointer"
                title={isAudioEnabled ? "Mute Voice Feed" : "Unmute Voice Feed"}
              >
                {isAudioEnabled ? <Volume2 size={13} className="text-violet-400 animate-pulse" /> : <VolumeX size={13} className="text-red-400" />}
              </button>
              <button 
                onClick={toggleCamera}
                className={cn(
                  "px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer text-[9px] font-bold uppercase tracking-wider border",
                  isCameraOn ? "bg-violet-600/10 border-violet-500/20 text-violet-300" : "bg-white/[0.01] border-white/5 text-white/40"
                )}
              >
                <div className={cn("w-1 h-1 rounded-full", isCameraOn ? "bg-green-500 animate-pulse" : "bg-white/20")} />
                {isCameraOn ? 'Cam' : 'No Cam'}
              </button>
            </div>
          )}

          {/* Theme Switcher Toggle */}
          <button
            onClick={() => setThemeMode(prev => prev === 'dark' ? 'light' : 'dark')}
            className="p-2 bg-white/[0.01] hover:bg-white/[0.05] border border-white/5 rounded-xl text-white/50 hover:text-white transition-all cursor-pointer"
            title={`Switch to ${themeMode === 'dark' ? 'Light Theme' : 'Dark Theme'}`}
            id="theme-toggle-button"
          >
            {themeMode === 'dark' ? (
              <Moon size={13} className="text-violet-400" />
            ) : (
              <Sun size={13} className="text-amber-400" />
            )}
          </button>

          {/* Notifications Bell Popover */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className={cn(
                "p-2 bg-white/[0.01] hover:bg-white/[0.05] border rounded-xl text-white/50 hover:text-white transition-all cursor-pointer relative",
                isNotificationsOpen ? "border-violet-500/30 bg-white/[0.04] text-white" : "border-white/5"
              )}
              id="notification-bell-button"
            >
              <Bell size={13} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
              )}
            </button>

            {/* Notification Dropdown Menu */}
            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-2.5 w-80 bg-[#090b14]/95 border border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-2xl p-4 z-50 overflow-hidden text-left"
                  id="notifications-dropdown"
                >
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={() => {
                          setNotifications(notifications.map(n => ({ ...n, read: true })));
                        }}
                        className="text-[9px] font-bold text-violet-400 hover:text-violet-300 uppercase tracking-wide cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                    {notifications.length === 0 ? (
                      <div className="py-6 text-center text-white/30 text-xs">No active notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={cn(
                            "p-2 rounded-xl border transition-all text-xs flex flex-col gap-1 relative group",
                            notif.read ? "bg-white/[0.01] border-transparent text-white/40" : "bg-violet-500/[0.03] border-violet-500/10 text-white/80"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2 pr-4">
                            <p className="leading-relaxed text-[11px]">{notif.text}</p>
                            <button
                              onClick={() => setNotifications(notifications.filter(n => n.id !== notif.id))}
                              className="absolute top-2 right-2 text-white/20 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <X size={10} />
                            </button>
                          </div>
                          <span className="text-[8px] text-white/30 font-mono self-end">{notif.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-white/5 pt-2.5 mt-2.5 flex items-center justify-between text-[8px] text-white/30 uppercase tracking-widest font-mono">
                    <span>Activity Alerts</span>
                    <span>{notifications.length} Updates</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Redesigned Profile Card Popover */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={cn(
                "flex items-center gap-2 bg-white/[0.01] hover:bg-white/[0.05] border py-1 px-2.5 rounded-xl transition-all cursor-pointer text-left select-none",
                isProfileOpen ? "border-violet-500/30 bg-white/[0.04]" : "border-white/5"
              )}
              id="profile-dropdown-trigger"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-5.5 h-5.5 rounded-full border border-violet-500/20 shadow-md" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-5.5 h-5.5 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-inner">
                  {user.displayName?.charAt(0) || user.email.charAt(0)}
                </div>
              )}
              <div className="text-left hidden sm:block">
                <p className="text-[10px] font-black text-white/90 leading-tight truncate max-w-[80px]">{user.displayName?.split(' ')[0] || 'Candidate'}</p>
                <p className="text-[7px] text-violet-400 font-bold uppercase tracking-wider leading-none mt-0.5">{user.role || 'candidate'}</p>
              </div>
              <ChevronDown size={10} className={cn("text-white/45 transition-transform duration-200", isProfileOpen && "rotate-180")} />
            </button>

            {/* Profile Dropdown menu */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 mt-2.5 w-64 bg-[#080b13]/95 border border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-2xl p-3 z-50 overflow-hidden text-left font-sans"
                  id="profile-dropdown"
                >
                  {/* Dropdown Header: User profile info */}
                  <div className="flex items-center gap-3 p-2.5 border-b border-white/5 mb-2">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-9 h-9 rounded-full border border-violet-500/20 shadow-sm" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {user.displayName?.charAt(0) || user.email.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-black text-white leading-tight truncate">{user.displayName || 'Candidate'}</h4>
                      <p className="text-[10px] text-white/40 truncate leading-none mt-0.5">{user.email}</p>
                      <span className="inline-block text-[8px] bg-violet-500/10 border border-violet-500/20 text-violet-300 font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-md mt-1.5">
                        {user.role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'PREMIUM CANDIDATE'}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Section: Interactive stats */}
                  <div className="p-2 bg-white/[0.02] border border-white/[0.04] rounded-xl mb-2 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] text-white/40 uppercase font-mono">Evaluation Tier</p>
                      <p className="text-[10px] font-bold text-white">Placement Ready</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-white/40 uppercase font-mono">Role Track</p>
                      <p className="text-[10px] font-bold text-violet-400">Enterprise AI</p>
                    </div>
                  </div>

                  {/* Dropdown body: Shortcuts */}
                  <div className="space-y-0.5 mb-2 border-b border-white/5 pb-1.5">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setIsAdminMode(false);
                        setIsProfileOpen(false);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white/70 hover:text-white hover:bg-white/5 transition-all text-left flex items-center gap-2 cursor-pointer"
                    >
                      <User size={12} className="text-white/40" />
                      Manage Profile & Track
                    </button>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          setIsAdminMode(true);
                          setActiveTab('admin');
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all text-left flex items-center gap-2 cursor-pointer"
                      >
                        <Shield size={12} />
                        Enterprise Admin Portal
                      </button>
                    )}
                  </div>

                  {/* Dropdown footer: Unobtrusive Logout */}
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-left flex items-center gap-2 cursor-pointer"
                    id="profile-dropdown-logout"
                  >
                    <LogOut size={12} />
                    Sign Out Session
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Responsive Hamburger Toggle for Mobile (below lg) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 lg:hidden bg-white/[0.01] hover:bg-white/[0.05] border border-white/5 rounded-xl text-white/50 hover:text-white transition-all cursor-pointer"
            id="mobile-menu-hamburger-button"
          >
            {isMobileMenuOpen ? <X size={14} /> : <Menu size={14} />}
          </button>

        </div>
      </header>

      {/* Mobile Sliding Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-[#060813] border-b border-b-white/[0.05] w-full py-4 px-4 z-40 overflow-hidden font-sans"
            id="mobile-sliding-navigation-drawer"
          >
            <div className="space-y-2">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id && !isAdminMode;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsAdminMode(false);
                      setSelectedHistoryItem(null);
                      setIsMobileMenuOpen(false);
                      if (item.action) item.action();
                    }}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all cursor-pointer",
                      isActive
                        ? "bg-violet-600/10 text-violet-300 border border-violet-500/25"
                        : "bg-white/[0.01] text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={14} />
                      <div className="text-left">
                        <p className="text-xs font-bold uppercase tracking-wider">{item.label}</p>
                        <p className="text-[9px] text-white/30 leading-none mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <ArrowRight size={11} className="text-white/20" />
                  </button>
                );
              })}

              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    setIsAdminMode(true);
                    setActiveTab('admin');
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 rounded-xl flex items-center justify-between transition-all cursor-pointer",
                    isAdminMode || activeTab === 'admin'
                      ? "bg-red-500/10 text-red-400 border border-red-500/25"
                      : "bg-white/[0.01] text-white/60 hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={14} />
                    <div className="text-left">
                      <p className="text-xs font-bold uppercase tracking-wider">Enterprise Admin</p>
                      <p className="text-[9px] text-white/30 leading-none mt-0.5">Control database & custom questions</p>
                    </div>
                  </div>
                  <ArrowRight size={11} className="text-white/20" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced secure confirmation dialog on session logout */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              id="logout-confirmation-backdrop"
            />
            
            {/* Confirmation card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm card-premium p-6 shadow-2xl space-y-5 text-center font-sans"
              id="logout-confirmation-dialog-container"
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shadow-md">
                  <Lock size={20} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white font-sans">Secure Session Termination</h3>
                  <p className="text-[10px] text-white/40 tracking-normal mt-1 uppercase font-sans">Confirm Sign Out</p>
                </div>
              </div>

              <div className="text-xs text-white/60 leading-relaxed bg-white/[0.01] border border-white/5 p-3 rounded-xl">
                You are about to sign out of <span className="text-violet-400 font-bold">Dr. Banner AI</span>. This will securely close the current interview channel and clear local runtime registers.
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 btn-premium-secondary py-2.5"
                  id="logout-cancel-button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutAction}
                  className="flex-1 btn-premium-danger py-2.5 flex items-center justify-center gap-1.5"
                  id="logout-confirm-button"
                >
                  <LogOut size={11} />
                  Terminate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
