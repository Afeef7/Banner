import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";

export const LiveHealthMonitor: React.FC = () => {
  const [cpuUsage, setCpuUsage] = useState(24);
  const [memUsage, setMemUsage] = useState(42);
  const [latency, setLatency] = useState(115);

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage(prev => Math.max(10, Math.min(95, prev + Math.floor(Math.random() * 11) - 5)));
      setMemUsage(prev => Math.max(30, Math.min(85, prev + Math.floor(Math.random() * 5) - 2)));
      setLatency(prev => Math.max(80, Math.min(220, prev + Math.floor(Math.random() * 31) - 15)));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card-premium p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-white">Live Health Check</h3>
        <p className="text-[10px] text-slate-400 mt-0.5">Real-time status of AI sandbox processes</p>
      </div>

      <div className="space-y-4 my-6">
        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">Node Cluster CPU</span>
            <span className="font-bold text-white">{cpuUsage}%</span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-1000", cpuUsage > 80 ? "bg-red-500" : "bg-violet-500")}
              style={{ width: `${cpuUsage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">Memory Allocation</span>
            <span className="font-bold text-white">{memUsage}%</span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000"
              style={{ width: `${memUsage}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-400">Model Query Latency</span>
            <span className="font-bold text-emerald-400">{latency} ms</span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000"
              style={{ width: `${Math.min(100, (latency / 250) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-3 bg-[#0a0d17]/60 border border-white/[0.04] rounded-xl flex items-center justify-between text-[10px] font-mono">
        <span className="text-slate-500 uppercase tracking-widest font-bold">Gemini Host</span>
        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-ping" /> OPERATIONAL
        </span>
      </div>
    </div>
  );
};
