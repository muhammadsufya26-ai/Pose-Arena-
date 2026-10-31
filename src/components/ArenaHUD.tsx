import React from 'react';
import { Volume2, VolumeX, Maximize2, Minimize2, RotateCcw, Hand, MousePointer, Flame, Zap, ShieldAlert } from 'lucide-react';
import { ArcadeStats, TrackingSensor, GameState, getDifficultyTier, PointerCoordinate } from '../types/game';

interface ArenaHUDProps {
  stats: ArcadeStats;
  gameState: GameState;
  sensor: TrackingSensor;
  onToggleSensor: () => void;
  isPointerDetected: boolean;
  pointer?: PointerCoordinate;
  isMuted: boolean;
  onToggleMute: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onAbortRound: () => void;
}

export const ArenaHUD: React.FC<ArenaHUDProps> = ({
  stats,
  gameState,
  sensor,
  onToggleSensor,
  isPointerDetected,
  pointer,
  isMuted,
  onToggleMute,
  isFullscreen,
  onToggleFullscreen,
  onAbortRound,
}) => {
  const isTimeCritical = stats.roundTimeLeft <= 10 && gameState === 'PLAYING';
  const tierInfo = getDifficultyTier(stats.score);

  // Finger Dwell Hover State for In-Game Main Menu Button
  const exitButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const [dwellProgress, setDwellProgress] = React.useState<number>(0);
  const dwellStartRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (gameState !== 'PLAYING' || !isPointerDetected || !pointer) {
      dwellStartRef.current = null;
      setDwellProgress(0);
      return;
    }

    const btn = exitButtonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const px = pointer.x * window.innerWidth;
    const py = pointer.y * window.innerHeight;

    const isOver =
      px >= rect.left - 8 &&
      px <= rect.right + 8 &&
      py >= rect.top - 8 &&
      py <= rect.bottom + 8;

    if (isOver) {
      if (!dwellStartRef.current) {
        dwellStartRef.current = Date.now();
      }
      const elapsed = Date.now() - dwellStartRef.current;
      const DWELL_TIME = 600; // 600ms hover dwell to confirm exit
      const prog = Math.min(1, elapsed / DWELL_TIME);
      setDwellProgress(prog);

      if (prog >= 1) {
        dwellStartRef.current = null;
        setDwellProgress(0);
        onAbortRound();
      }
    } else {
      dwellStartRef.current = null;
      setDwellProgress(0);
    }
  }, [pointer, isPointerDetected, gameState, onAbortRound]);

  return (
    <header className="absolute top-0 left-0 right-0 z-30 p-4 md:px-8 pointer-events-none select-none">
      <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
        {/* Left: Brand Wordmark & Sensor Switcher + In-Game Main Menu / Exit Button */}
        <div className="flex flex-col gap-2.5 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl md:text-3xl font-black tracking-wider uppercase text-white drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">
              POSE <span className="text-[#00f3ff]">ARENA</span>
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#000000] border border-[#f3e9ee] text-[#ffffff] tracking-widest uppercase">
              FINGER STRIKE
            </span>
          </div>

          {/* Action Row: Sensor Switch + Visible In-Game [ 🏠 MAIN MENU ] Button */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Top-Corner Sensor Switch: [ 🖐️ Hand Camera | 🖱️ Mouse ] */}
            <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 w-fit shadow-lg">
              <button
                onClick={sensor === 'MOUSE' ? onToggleSensor : undefined}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  sensor === 'CAMERA'
                    ? 'bg-gradient-to-r from-[#00f3ff] to-[#0284c7] text-slate-950 shadow-[0_0_12px_rgba(0,243,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span>🖐️ Hand Camera</span>
              </button>
              <button
                onClick={sensor === 'CAMERA' ? onToggleSensor : undefined}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  sensor === 'MOUSE'
                    ? 'bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span>🖱️ Mouse</span>
              </button>
            </div>

            {/* In-Game "Main Menu / Exit" Button */}
            {gameState === 'PLAYING' && (
              <button
                ref={exitButtonRef}
                onClick={onAbortRound}
                className="relative overflow-hidden flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-500/80 text-slate-200 hover:text-white text-xs font-mono font-bold tracking-wider uppercase transition-all shadow-lg hover:shadow-[0_0_15px_rgba(244,63,94,0.45)] cursor-pointer group"
                title="Exit active round and return to Main Menu"
              >
                {/* Finger Dwell Progress Bar */}
                {dwellProgress > 0 && (
                  <div
                    className="absolute inset-0 bg-rose-500/35 transition-all pointer-events-none"
                    style={{ width: `${dwellProgress * 100}%` }}
                  />
                )}
                <span className="text-rose-400 group-hover:scale-110 transition-transform">🏠</span>
                <span>MAIN MENU</span>
                {dwellProgress > 0 && (
                  <span className="text-[10px] text-rose-300 font-mono">
                    {Math.round(dwellProgress * 100)}%
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Center: Bold Digital Round Timer & Live Progressive Difficulty Tier Badge */}
        {gameState === 'PLAYING' && (
          <div className="flex flex-col items-center gap-1.5 pointer-events-auto">
            <div
              className={`px-5 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-700 shadow-2xl text-center min-w-[130px] ${
                isTimeCritical ? 'border-rose-500/80 shadow-[0_0_25px_rgba(239,68,68,0.4)]' : ''
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                ROUND TIMER
              </div>
              <div
                className={`text-3xl md:text-4xl font-black font-mono tabular-nums leading-none mt-0.5 ${
                  isTimeCritical ? 'text-rose-500 animate-pulse' : 'text-white'
                }`}
              >
                {stats.roundTimeLeft}s
              </div>
            </div>

            {/* Live Progressive Difficulty Tier Badge */}
            <div
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold tracking-wider uppercase border flex items-center gap-2 shadow-lg transition-all ${
                tierInfo.tier === 4
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/80 shadow-[0_0_20px_rgba(239,68,68,0.5)] animate-pulse'
                  : tierInfo.tier === 3
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/70 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                  : tierInfo.tier === 2
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/50'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full animate-ping"
                style={{ backgroundColor: tierInfo.color }}
              />
              <span>TIER {tierInfo.tier} // {tierInfo.name}</span>
            </div>
          </div>
        )}

        {/* Right: Live Score & Combo Meter + Utility Controls */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Controls: Sound, Fullscreen, Abort */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-lg">
            {gameState === 'PLAYING' && (
              <button
                onClick={onAbortRound}
                title="Abort Round"
                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-950/60 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onToggleFullscreen}
              title="Toggle Fullscreen"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Active Round Score & Combo Panel */}
          {gameState === 'PLAYING' && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-slate-700 shadow-2xl">
              {/* Score */}
              <div className="text-right">
                <span className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  SCORE
                </span>
                <span className="text-2xl md:text-3xl font-black font-mono text-[#00f3ff] drop-shadow-[0_0_10px_rgba(0,243,255,0.4)] tabular-nums">
                  {stats.score.toLocaleString()}
                </span>
              </div>

              <div className="h-8 w-px bg-slate-800" />

              {/* Combo Multiplier that lights up on streaks */}
              <div className="text-center">
                <span className="block text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  STREAK
                </span>
                <div
                  className={`px-2.5 py-0.5 rounded-xl font-bold font-mono text-sm md:text-base flex items-center gap-1 transition-all ${
                    stats.multiplier >= 8
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)] animate-pulse'
                      : stats.multiplier >= 4
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                      : stats.multiplier >= 2
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500 shadow-[0_0_10px_rgba(0,243,255,0.3)]'
                      : 'bg-slate-800/60 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>x{stats.multiplier}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
