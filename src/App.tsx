import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  GameState,
  ArcadeStats,
  Target,
  PointerCoordinate,
  TrackingSensor,
  LeaderboardEntry,
  getDifficultyTier,
} from './types/game';
import { handTracker } from './services/handTracker';
import { soundFx } from './services/audioEngine';
import { getLeaderboard } from './services/leaderboard';
import { ArenaCanvas } from './components/ArenaCanvas';
import { ArenaHUD } from './components/ArenaHUD';
import { AttractOverlay } from './components/AttractOverlay';
import { CountdownOverlay } from './components/CountdownOverlay';
import { GameOverModal } from './components/GameOverModal';

const INITIAL_STATS: ArcadeStats = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  multiplier: 1,
  hits: 0,
  hazardHit: false,
  roundTimeLeft: 60,
  survivalSeconds: 0,
  tier: 1,
};

export default function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Core Game State
  const [gameState, setGameState] = useState<GameState>('ATTRACT');
  const [sensor, setSensor] = useState<TrackingSensor>('CAMERA');
  const [stats, setStats] = useState<ArcadeStats>(INITIAL_STATS);
  const [pointer, setPointer] = useState<PointerCoordinate>(() => handTracker.getPointer());

  // Kiosk / Leaderboard State
  const [records, setRecords] = useState<LeaderboardEntry[]>(() => getLeaderboard());
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Refresh records on game transition
  useEffect(() => {
    setRecords(getLeaderboard());
  }, [gameState]);

  // Initialize Camera & MediaPipe Hands
  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    async function setupCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('Webcam not supported; switching to Mouse Mode');
          setSensor('MOUSE');
          handTracker.setSensor('MOUSE');
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          handTracker.setVideoSource(videoRef.current);
          handTracker.setSensor(sensor);
          const ok = await handTracker.initialize();
          if (ok) {
            handTracker.onPointerUpdate((pt) => {
              setPointer({ ...pt });
            });
            handTracker.start();
          } else {
            setSensor('MOUSE');
            handTracker.setSensor('MOUSE');
          }
        }
      } catch (err) {
        console.warn('Webcam unavailable; defaulting to Mouse Mode', err);
        setSensor('MOUSE');
        handTracker.setSensor('MOUSE');
      }
    }

    setupCamera();

    return () => {
      isCancelled = true;
      handTracker.stop();
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Sensor Toggle
  const handleToggleSensor = () => {
    const next: TrackingSensor = sensor === 'CAMERA' ? 'MOUSE' : 'CAMERA';
    setSensor(next);
    handTracker.setSensor(next);
  };

  // Start Countdown
  const handleStartGame = useCallback(() => {
    setStats({
      ...INITIAL_STATS,
      roundTimeLeft: 60,
      survivalSeconds: 0,
      hazardHit: false,
      tier: 1,
    });
    setGameState('COUNTDOWN');
  }, []);

  // Countdown Completed -> PLAYING
  const handleCountdownComplete = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  // Target Sliced / Hit
  const handleHitTarget = useCallback((target: Target, pointsEarned: number) => {
    setStats((prev) => {
      const nextScore = prev.score + pointsEarned;
      const nextCombo = prev.combo + 1;
      const nextMaxCombo = Math.max(prev.maxCombo, nextCombo);
      const nextTier = getDifficultyTier(nextScore).tier;

      // Multiplier tiers: x1 -> x2 at combo 5 -> x4 at combo 10 -> x8 at combo 20!
      let nextMultiplier = 1;
      if (nextCombo >= 20) nextMultiplier = 8;
      else if (nextCombo >= 10) nextMultiplier = 4;
      else if (nextCombo >= 5) nextMultiplier = 2;

      return {
        ...prev,
        score: nextScore,
        combo: nextCombo,
        maxCombo: nextMaxCombo,
        multiplier: nextMultiplier,
        hits: prev.hits + 1,
        tier: nextTier,
      };
    });
  }, []);

  // Target Missed
  const handleMissTarget = useCallback((target: Target) => {
    setStats((prev) => ({
      ...prev,
      combo: 0,
      multiplier: 1,
    }));
  }, []);

  // Sudden Death: Hazard Mine Detonation
  const handleHazardMineDetonation = useCallback(() => {
    setStats((prev) => {
      const surv = Math.max(1, 60 - prev.roundTimeLeft);
      return {
        ...prev,
        survivalSeconds: surv,
        hazardHit: true,
      };
    });
    setGameState('GAMEOVER');
  }, []);

  // 60-Second Round Clock Tick
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      setStats((prev) => {
        if (prev.roundTimeLeft <= 1) {
          clearInterval(interval);
          soundFx.playCountdownTick(true);
          setGameState('GAMEOVER');
          return {
            ...prev,
            roundTimeLeft: 0,
            survivalSeconds: 60,
            hazardHit: false,
          };
        }
        if (prev.roundTimeLeft <= 5) {
          soundFx.playCountdownTick(false);
        }
        const nextTime = prev.roundTimeLeft - 1;
        return {
          ...prev,
          roundTimeLeft: nextTime,
          survivalSeconds: 60 - nextTime,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Mute
  const toggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  // Pointer move in Mouse mode
  const handlePointerMove = (x: number, y: number) => {
    handTracker.setMousePosition(x, y);
    setPointer(handTracker.getPointer());
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans select-none">
      {/* Hidden WebCam Video element */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className="hidden"
      />

      {/* Commercial Arcade Cabinet HUD */}
      <ArenaHUD
        stats={stats}
        gameState={gameState}
        sensor={sensor}
        onToggleSensor={handleToggleSensor}
        isPointerDetected={pointer.isDetected}
        pointer={pointer}
        isMuted={isMuted}
        onToggleMute={toggleMute}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onAbortRound={() => {
          soundFx.playMiss();
          setGameState('ATTRACT');
        }}
      />

      {/* 60 FPS HTML5 Canvas with Live Video Feed & Adaptive Orbs */}
      <ArenaCanvas
        videoRef={videoRef}
        pointer={pointer}
        sensor={sensor}
        gameState={gameState}
        currentScore={stats.score}
        comboMultiplier={stats.multiplier}
        onHitTarget={handleHitTarget}
        onMissTarget={handleMissTarget}
        onHazardMineDetonation={handleHazardMineDetonation}
        onPointerMove={handlePointerMove}
      />

      {/* Attract Screen (Main Menu) */}
      {gameState === 'ATTRACT' && (
        <AttractOverlay
          onStart={handleStartGame}
          sensor={sensor}
          isPointerDetected={pointer.isDetected}
          records={records}
        />
      )}

      {/* Countdown Overlay */}
      {gameState === 'COUNTDOWN' && (
        <CountdownOverlay onComplete={handleCountdownComplete} />
      )}

      {/* Post-Game Summary (Debrief) */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          stats={stats}
          onRetry={handleStartGame}
          onReturnMenu={() => setGameState('ATTRACT')}
        />
      )}
    </div>
  );
}
