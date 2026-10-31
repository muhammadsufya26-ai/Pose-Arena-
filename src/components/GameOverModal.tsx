import React, { useState } from 'react';
import { RotateCcw, Trophy, CheckCircle2, ShieldAlert, Timer, Flame, Sparkles, Activity } from 'lucide-react';
import { ArcadeStats, getDifficultyTier } from '../types/game';
import { saveLeaderboardRecord } from '../services/leaderboard';

interface GameOverModalProps {
  stats: ArcadeStats;
  onRetry: () => void;
  onReturnMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRetry,
  onReturnMenu,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('pose_arena_player_tag') || 'PLAYER #01';
  });
  const [isSaved, setIsSaved] = useState(false);
  const [earnedRank, setEarnedRank] = useState<number | null>(null);

  const tierInfo = getDifficultyTier(stats.score);

  // Grade tier
  let rankTier = 'B';
  let rankColor = 'text-blue-400 border-blue-500/40 bg-blue-500/10';
  let rankTitle = 'Rookie Slicer';

  if (stats.score >= 15000) {
    rankTier = 'S+';
    rankColor = 'text-[#ff007f] border-[#ff007f]/50 bg-[#ff007f]/20 shadow-[0_0_25px_rgba(255,0,127,0.5)]';
    rankTitle = 'Cyber Legend';
  } else if (stats.score >= 10000) {
    rankTier = 'S';
    rankColor = 'text-[#00f3ff] border-[#00f3ff]/50 bg-[#00f3ff]/20 shadow-[0_0_20px_rgba(0,243,255,0.4)]';
    rankTitle = 'Apex Striker';
  } else if (stats.score >= 6000) {
    rankTier = 'A';
    rankColor = 'text-amber-400 border-amber-500/40 bg-amber-500/15 shadow-[0_0_15px_rgba(251,191,36,0.3)]';
    rankTitle = 'Blade Master';
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || isSaved) return;

    localStorage.setItem('pose_arena_player_tag', playerName.trim().toUpperCase());

    const res = saveLeaderboardRecord({
      name: playerName.trim().toUpperCase(),
      score: stats.score,
      maxCombo: stats.maxCombo,
    });

    setIsSaved(true);
    setEarnedRank(res.rank);
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-700/80 p-6 md:p-8 rounded-3xl shadow-[0_0_60px_rgba(0,243,255,0.2)] relative overflow-hidden">
        {/* Glow backdrop */}
        <div
          className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            stats.hazardHit ? 'bg-rose-500/30' : 'bg-cyan-500/25'
          }`}
        />

        {/* Header Tag */}
        <div className="text-center">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase font-bold tracking-widest mb-2 border ${
              stats.hazardHit
                ? 'bg-rose-950/80 border-rose-500/60 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300 shadow-[0_0_15px_rgba(0,243,255,0.3)]'
            }`}
          >
            {stats.hazardHit ? (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>
              {stats.hazardHit ? 'SUDDEN DEATH // HAZARD DETONATION' : '60s SESSION CONCLUDED'}
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight font-sans">
            {stats.hazardHit ? 'ROUND OVER' : 'VICTORY'}
          </h2>

          {/* Difficulty Tier Reached */}
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase">PEAK DIFFICULTY:</span>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded-md border uppercase"
              style={{
                color: tierInfo.color,
                borderColor: `${tierInfo.color}66`,
                backgroundColor: `${tierInfo.color}1a`,
              }}
            >
              TIER {tierInfo.tier} // {tierInfo.name}
            </span>
          </div>
        </div>

        {/* Score & Grade Podium */}
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="col-span-2 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-center">
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              FINAL SCORE
            </span>
            <span className="text-4xl md:text-5xl font-black font-mono text-[#00f3ff] drop-shadow-[0_0_15px_rgba(0,243,255,0.5)] tabular-nums mt-1">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">
              GRADE
            </span>
            <div className={`mt-1 text-3xl md:text-4xl font-black font-mono px-3.5 py-0.5 rounded-xl border ${rankColor}`}>
              {rankTier}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 font-bold">{rankTitle}</span>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center font-mono">
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Max Combo</div>
            <div className="text-lg font-bold text-pink-400 mt-0.5">x{stats.maxCombo}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Emojis Smashed</div>
            <div className="text-lg font-bold text-white mt-0.5">{stats.hits}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-[10px] text-slate-400 uppercase">Survival</div>
            <div className="text-lg font-bold text-cyan-400 mt-0.5">{stats.survivalSeconds.toFixed(1)}s</div>
          </div>
        </div>

        {/* Save High Score */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          {!isSaved ? (
            <form onSubmit={handleSave} className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                <span className="flex items-center gap-1.5 uppercase font-mono">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  Save To Campus Leaderboard
                </span>
                <span className="text-slate-400 text-[10px] font-mono">TOP 10 RANKS</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={14}
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                  placeholder="PLAYER TAG"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white uppercase focus:outline-none focus:border-[#00f3ff]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase font-mono tracking-wider transition-colors cursor-pointer"
                >
                  SAVE
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>SAVED TO LEADERBOARD!</span>
              </div>
              {earnedRank && (
                <span className="text-amber-300 font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  RANK #{earnedRank}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onReturnMenu}
            className="flex-1 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-black text-sm uppercase tracking-wider transition-colors cursor-pointer"
          >
            MENU
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#00f3ff] via-[#0284c7] to-[#ff007f] text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(0,243,255,0.4)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-950" />
            <span>PLAY AGAIN</span>
          </button>
        </div>
      </div>
    </div>
  );
};
