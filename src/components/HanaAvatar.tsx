import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Emotion } from '../types';
// @ts-ignore
import portraitImg from '../assets/images/professional_interviewer_1783773703631.jpg';

interface HanaAvatarProps {
  emotion: Emotion;
  isSpeaking: boolean;
}

export const HanaAvatar: React.FC<HanaAvatarProps> = ({ emotion, isSpeaking }) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [mouthState, setMouthState] = useState<'closed' | 'half' | 'open'>('closed');
  const [headTilt, setHeadTilt] = useState(0);
  const speakingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Blinking timer loop: blink every 3 to 5 seconds
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    
    const triggerBlink = () => {
      setIsBlinking(true);
      // Eyelids closed for 150ms
      setTimeout(() => {
        setIsBlinking(false);
      }, 150);
      
      const nextDelay = 3000 + Math.random() * 3000;
      blinkTimeout = setTimeout(triggerBlink, nextDelay);
    };

    blinkTimeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Speaking state mouth articulation: swap between closed, half, and open mouth states
  useEffect(() => {
    if (isSpeaking) {
      speakingIntervalRef.current = setInterval(() => {
        const states: ('closed' | 'half' | 'open')[] = ['half', 'open', 'half', 'closed'];
        const randomState = states[Math.floor(Math.random() * states.length)];
        setMouthState(randomState);
        
        // Dynamic head tilt while speaking to feel conversational
        setHeadTilt((Math.random() - 0.5) * 2); // subtle tilt between -1 and 1 deg
      }, 120);
    } else {
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current);
      }
      setMouthState('closed');
      setHeadTilt(0);
    }

    return () => {
      if (speakingIntervalRef.current) {
        clearInterval(speakingIntervalRef.current);
      }
    };
  }, [isSpeaking]);

  // Handle emotion changes with a subtle nod/tilt
  useEffect(() => {
    if (emotion === 'nod') {
      // Trigger a subtle double nod
      setHeadTilt(1.5);
      const t1 = setTimeout(() => setHeadTilt(-1), 150);
      const t2 = setTimeout(() => setHeadTilt(1), 300);
      const t3 = setTimeout(() => setHeadTilt(0), 450);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [emotion]);

  return (
    <div className="w-full h-full relative bg-[#04060d] flex items-center justify-center overflow-hidden p-6 select-none">
      {/* Dynamic Waveform/Pulse Rings Around Avatar */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        {/* Soft breathing radial back glow */}
        <div className={`absolute w-64 h-64 rounded-full filter blur-3xl transition-all duration-1000 ${
          isSpeaking 
            ? 'bg-violet-500/20 scale-110 shadow-[0_0_80px_rgba(139,92,246,0.3)]' 
            : 'bg-indigo-500/5 scale-95'
        }`} />
        
        {/* Concentric rotating neon rings */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className={`absolute w-72 h-72 rounded-full border border-dashed transition-colors duration-700 ${
            isSpeaking ? 'border-violet-500/25' : 'border-white/5'
          }`}
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute w-60 h-60 rounded-full border border-dotted transition-colors duration-700 ${
            isSpeaking ? 'border-cyan-500/25' : 'border-white/5'
          }`}
        />

        {/* Pulse Waves when speaking */}
        <AnimatePresence>
          {isSpeaking && (
            <>
              <motion.div
                initial={{ scale: 0.9, opacity: 0.8 }}
                animate={{ scale: 1.35, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-56 h-56 rounded-full border-2 border-violet-500/30"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0.6 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, delay: 0.6, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-56 h-56 rounded-full border border-cyan-500/20"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0.4 }}
                animate={{ scale: 1.65, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, delay: 1.2, repeat: Infinity, ease: "easeOut" }}
                className="absolute w-56 h-56 rounded-full border border-violet-500/10"
              />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Main Avatar Circular Frame */}
      <div className={`relative w-48 h-48 sm:w-52 sm:h-52 md:w-56 md:h-56 rounded-full p-1.5 transition-all duration-700 z-10 ${
        isSpeaking 
          ? 'bg-gradient-to-tr from-violet-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_50px_rgba(139,92,246,0.5)] scale-102' 
          : 'bg-zinc-800/40 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]'
      }`}>
        {/* Rounded mask clip container */}
        <div className="w-full h-full rounded-full overflow-hidden bg-zinc-950 relative">
          
          {/* Subtle Scanlines and grid overlay */}
          <div className="absolute inset-0 pointer-events-none z-10 opacity-30 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px]" />
          
          {/* Blue-violet shadow vignette */}
          <div className="absolute inset-0 z-10 pointer-events-none rounded-full shadow-[inset_0_0_24px_rgba(0,0,0,0.8)] bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Animated/Breathing Base Portrait Image */}
          <motion.div
            animate={{ 
              scale: isSpeaking ? [1, 1.018, 1] : [1, 1.012, 1],
              y: isSpeaking ? [0, -0.8, 0] : [0, -0.4, 0],
              rotate: headTilt
            }}
            transition={{ 
              scale: { duration: isSpeaking ? 3 : 4.5, repeat: Infinity, ease: "easeInOut" },
              y: { duration: isSpeaking ? 3 : 4.5, repeat: Infinity, ease: "easeInOut" },
              rotate: { type: "spring", stiffness: 80, damping: 10 }
            }}
            className="w-full h-full relative"
          >
            <img 
              src={portraitImg} 
              alt="AI Interviewer (Dr. Banner)" 
              className="w-full h-full object-cover select-none"
            />

            {/* Interactive Eye Blinking Overlays (Positioned perfectly on eyes) */}
            <AnimatePresence>
              {isBlinking && (
                <>
                  {/* Left Eye Overlay */}
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    exit={{ scaleY: 0 }}
                    transition={{ duration: 0.1 }}
                    className="absolute bg-[#e9b5a3] origin-top border-b border-black/15 shadow-[inset_0_-2px_2px_rgba(0,0,0,0.2)]"
                    style={{
                      top: '41.8%',
                      left: '42.8%',
                      width: '7.8%',
                      height: '3.6%',
                      borderRadius: '50% / 20%'
                    }}
                  />
                  {/* Right Eye Overlay */}
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    exit={{ scaleY: 0 }}
                    transition={{ duration: 0.1 }}
                    className="absolute bg-[#e9b5a3] origin-top border-b border-black/15 shadow-[inset_0_-2px_2px_rgba(0,0,0,0.2)]"
                    style={{
                      top: '41.8%',
                      left: '56.4%',
                      width: '7.8%',
                      height: '3.6%',
                      borderRadius: '50% / 20%'
                    }}
                  />
                </>
              )}
            </AnimatePresence>

            {/* Speaking Mouth Overlay Layer (Sprite Swap / Height Articulation) */}
            {isSpeaking && (
              <div 
                className="absolute flex items-center justify-center transition-all duration-100"
                style={{
                  top: '60.5%',
                  left: '49.8%',
                  width: '9.2%',
                  height: '4.8%',
                  transform: 'translateX(-50%)'
                }}
              >
                {mouthState === 'open' && (
                  /* Wide Open Mouth State */
                  <div className="w-full h-full bg-[#1c0308] border border-black/40 shadow-inner rounded-b-full overflow-hidden flex flex-col justify-between">
                    {/* Upper teeth row */}
                    <div className="h-[20%] w-full bg-white/90 border-b border-rose-950/20" />
                    {/* Tongue inside */}
                    <div className="h-[30%] w-[80%] mx-auto bg-rose-500 rounded-t-full opacity-90" />
                  </div>
                )}

                {mouthState === 'half' && (
                  /* Half Open Mouth State */
                  <div className="w-full h-[65%] bg-[#1c0308] border border-black/40 shadow-inner rounded-b-md overflow-hidden flex flex-col justify-between">
                    {/* Teeth detail */}
                    <div className="h-[15%] w-full bg-white/80" />
                    <div className="h-[25%] w-[70%] mx-auto bg-rose-400/90 rounded-t-full" />
                  </div>
                )}

                {mouthState === 'closed' && (
                  /* Closed mouth shadow accent line overlaying natural mouth */
                  <div className="w-[85%] h-[1.5px] bg-[#3a060d] opacity-90 shadow-sm" />
                )}
              </div>
            )}

            {/* Static emotion mouth override when NOT speaking */}
            {!isSpeaking && emotion !== 'neutral' && (
              <div 
                className="absolute flex items-center justify-center pointer-events-none"
                style={{
                  top: '60.5%',
                  left: '49.8%',
                  width: '9.2%',
                  height: '4.8%',
                  transform: 'translateX(-50%)'
                }}
              >
                {(emotion === 'smile' || emotion === 'happy') && (
                  /* High Quality Happy Smile SVG Overlay */
                  <svg viewBox="0 0 40 20" className="w-full h-full drop-shadow-sm">
                    <path d="M 5,5 Q 20,20 35,5" fill="none" stroke="#2c0005" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                )}
                {emotion === 'concerned' && (
                  /* Concerned downward curve */
                  <svg viewBox="0 0 40 20" className="w-full h-full drop-shadow-sm">
                    <path d="M 8,12 Q 20,4 32,12" fill="none" stroke="#2c0005" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
                {emotion === 'serious' && (
                  /* Straight concentrated line */
                  <div className="w-[75%] h-[2px] bg-[#310206] rounded-full opacity-95" />
                )}
                {emotion === 'thinking' && (
                  /* Slight offset thinking mouth */
                  <svg viewBox="0 0 40 20" className="w-full h-full">
                    <path d="M 10,8 Q 20,11 28,6" fill="none" stroke="#2c0005" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                )}
                {emotion === 'surprised' && (
                  /* Surprised small round circle */
                  <div className="w-[45%] h-[75%] bg-[#1c0308] border border-black/40 rounded-full shadow-inner flex items-center justify-center overflow-hidden">
                    <div className="h-[25%] w-[90%] bg-white/70 self-start" />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Floating status display overlay */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between font-mono text-[8px] tracking-[0.15em] text-white/40 z-20 pointer-events-none select-none">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-violet-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>PORTRAIT_V2 // {isSpeaking ? 'TRANSMITTING' : 'LISTENING'}</span>
        </div>
        <div>
          <span>EMOTION: {emotion.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};
