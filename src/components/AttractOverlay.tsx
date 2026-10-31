import React from 'react';
import { Play, Sparkles, Trophy, Zap, ShieldAlert, Award, Activity } from 'lucide-react';
import { TrackingSensor, LeaderboardEntry } from '../types/game';

interface AttractOverlayProps {
  onStart: () => void;
  sensor: TrackingSensor;
  isPointerDetected: boolean;
  records: LeaderboardEntry[];
}

export const AttractOverlay: React.FC<AttractOverlayProps> = ({
  onStart,
  sensor,
  isPointerDetected,
  records,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-10 pointer-events-none select-none">
      {/* Top Banner */}
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/40 text-xs font-bold text-cyan-300 shadow-[0_0_20px_rgba(0,243,255,0.25)]">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="tracking-wider uppercase">CAMPUS ARCADE ARENA · LIVE MOTION SHOWCASE</span>
        </div>
      </div>

      {/* Main Center Call to Action & Title */}
      <div className="max-w-3xl mx-auto w-full text-center pointer-events-auto">
        <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white uppercase drop-shadow-[0_0_30px_rgba(0,243,255,0.6)]">
          POSE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] via-[#38bdf8] to-[#ff007f]">ARENA</span>
        </h1>
        <div className="text-lg md:text-xl font-black tracking-widest text-[#ff007f] uppercase mt-1 drop-shadow-[0_0_15px_rgba(255,0,127,0.4)]">
          FINGER STRIKE // HARDCORE ARCADE
        </div>

        <p className="mt-3 text-sm md:text-base text-slate-300 font-medium max-w-lg mx-auto">
          Slice and smash animated face & arcade emoji targets with your index finger. Dodge sudden-death hazard bombs (💣 & ☠️) as difficulty ramps up!
        </p>

        {/* Progressive Difficulty Tier Roadmap Chips */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
          <div className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>T1 Warmup (0-1K)</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>T2 Accelerated (1-3K)</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-[11px] font-mono text-amber-300 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>T3 Frenzy (3-6K)</span>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/40 text-[11px] font-mono text-rose-300 flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>T4 Overdrive (6K+)</span>
          </div>
        </div>

        {/* Big Pulsing "TAP TO START" / "HOLD FINGER TO ENGAGE" CTA */}
        <div className="mt-7 flex flex-col items-center gap-3">
          <button
            onClick={onStart}
            className="px-10 py-5 rounded-2xl bg-gradient-to-r from-[#00f3ff] via-[#0284c7] to-[#ff007f] text-slate-950 font-black text-lg md:text-xl uppercase tracking-wider shadow-[0_0_35px_rgba(0,243,255,0.6)] hover:brightness-110 active:scale-95 transition-all animate-pulse-arcade flex items-center gap-3 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current text-slate-950" />
            <span>{sensor === 'CAMERA' ? 'TAP TO START' : 'CLICK TO ENGAGE'}</span>
          </button>

          <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPointerDetected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
              }`}
            />
            <span>
              {sensor === 'MOUSE'
                ? 'MOUSE POINTER ACTIVE'
                : isPointerDetected
                ? 'INDEX FINGER LOCKED · READY TO SLICE'
                : 'HOLD UP YOUR INDEX FINGER TO CALIBRATE'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Area: Gameplay Tips + Compact Glowing TOP SCORES Podium on Side */}
      <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-end justify-between gap-4 pointer-events-auto">
        {/* Quick Tips */}
        <div className="flex items-center gap-3 bg-slate-950/85 backdrop-blur-md p-3 rounded-2xl border border-slate-800 shadow-xl text-xs font-medium text-slate-300">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white uppercase text-[11px]">Smash Faces & Targets (😂, 🤩, 🔥, 💎)</div>
            <div className="text-slate-400 text-[10px]">Slice floating emojis; catch golden 👑 & 🚀 for +250!</div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1" />

          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-rose-300 uppercase text-[11px]">Dodge 💣 & ☠️ Bombs</div>
            <div className="text-slate-400 text-[10px]">Contact triggers instant Sudden Death!</div>
          </div>
        </div>

        {/* Compact Glowing "TOP SCORES" Podium */}
        <div className="w-full md:w-80 bg-slate-950/90 backdrop-blur-md p-4 rounded-2xl border border-amber-500/30 shadow-[0_0_25px_rgba(251,191,36,0.15)]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-300 uppercase font-mono">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>TOP ARENA RECORD</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">ORIENTATION BOOTH</span>
          </div>

          <div className="space-y-1.5 font-mono">
            {records.slice(0, 3).map((rec, idx) => {
              const rank = idx + 1;
              let badgeStyle =
                'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(251,191,36,0.3)]';
              if (rank === 2) badgeStyle = 'bg-slate-400/20 text-slate-200 border-slate-400/40';
              if (rank === 3) badgeStyle = 'bg-amber-700/20 text-amber-600 border-amber-700/40';

              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/50 border border-slate-800/60"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] border ${badgeStyle}`}
                    >
                      {rank}
                    </span>
                    <span className="font-bold text-white truncate max-w-[110px]">{rec.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-pink-400">x{rec.maxCombo}</span>
                    <span className="font-black text-[#00f3ff] tabular-nums">{rec.score.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
