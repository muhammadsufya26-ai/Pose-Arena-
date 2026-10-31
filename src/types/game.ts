export type GameState = 'ATTRACT' | 'COUNTDOWN' | 'PLAYING' | 'GAMEOVER';

export type TrackingSensor = 'CAMERA' | 'MOUSE';

export type TargetType = 'orb_standard' | 'orb_bonus' | 'hazard_mine';

export type DifficultyTierLevel = 1 | 2 | 3 | 4;

export type TargetMotionStyle = 'gentle' | 'sine_wave' | 'zigzag' | 'aggressive';

export interface DifficultyTierInfo {
  tier: DifficultyTierLevel;
  name: string;
  subtitle: string;
  minScore: number;
  maxScore: number;
  targetLifespanMs: number; // T1: 2200ms, T2: 1600ms, T3: 1100ms, T4: 800ms
  maxNormalTargets: number; // T1: 2, T2: 3, T3: 4, T4: 4
  maxHazardMines: number; // T1: 1, T2: 1, T3: 2, T4: 3
  hazardIntervalMs: number; // T1: 10000ms, T2: 6000ms, T3: 4500ms, T4: 3000ms
  radiusScale: number; // T1: 1.0, T2: 0.85 (-15%), T3: 0.85, T4: 0.68 (-20% of T3)
  motionStyle: TargetMotionStyle;
  color: string;
}

export function getDifficultyTier(score: number): DifficultyTierInfo {
  if (score >= 6000) {
    return {
      tier: 4,
      name: 'OVERDRIVE',
      subtitle: 'HARDCORE REFLEXES // TRIPLE MINES',
      minScore: 6000,
      maxScore: Infinity,
      targetLifespanMs: 800,
      maxNormalTargets: 4,
      maxHazardMines: 3,
      hazardIntervalMs: 3000,
      radiusScale: 0.68,
      motionStyle: 'aggressive',
      color: '#ef4444',
    };
  }
  if (score >= 3001) {
    return {
      tier: 3,
      name: 'FRENZY MODE',
      subtitle: 'ZIG-ZAG TARGETS // DUAL MINES',
      minScore: 3001,
      maxScore: 6000,
      targetLifespanMs: 1100,
      maxNormalTargets: 4,
      maxHazardMines: 2,
      hazardIntervalMs: 4500,
      radiusScale: 0.85,
      motionStyle: 'zigzag',
      color: '#f59e0b',
    };
  }
  if (score >= 1001) {
    return {
      tier: 2,
      name: 'ACCELERATED',
      subtitle: 'SINE OSCILLATION // ORBITING MINES',
      minScore: 1001,
      maxScore: 3000,
      targetLifespanMs: 1600,
      maxNormalTargets: 3,
      maxHazardMines: 1,
      hazardIntervalMs: 6000,
      radiusScale: 0.85,
      motionStyle: 'sine_wave',
      color: '#10b981',
    };
  }
  return {
    tier: 1,
    name: 'WARMUP',
    subtitle: 'STEADY DRIFT // LOW HAZARD',
    minScore: 0,
    maxScore: 1000,
    targetLifespanMs: 2200,
    maxNormalTargets: 2,
    maxHazardMines: 1,
    hazardIntervalMs: 10000,
    radiusScale: 1.0,
    motionStyle: 'gentle',
    color: '#00f3ff',
  };
}

export interface Target {
  id: string;
  x: number; // 0 to 1 normalized
  y: number; // 0 to 1 normalized
  baseY?: number;
  radius: number;
  type: TargetType;
  emoji: string;
  points: number;
  createdAt: number;
  durationMs: number;
  vx: number;
  vy: number;
  pulsePhase: number;
  color: string;
  motionStyle: TargetMotionStyle;
  // Dynamic orbital behavior (Tier 2) & zig-zag shifts (Tier 3)
  orbitAngle?: number;
  orbitCenterX?: number;
  orbitCenterY?: number;
  orbitRadius?: number;
  orbitSpeed?: number;
  lastShiftTime?: number;
}

export interface PointerCoordinate {
  x: number; // 0 to 1
  y: number; // 0 to 1
  velocity: number;
  isDetected: boolean;
}

export interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
  shape: 'spark' | 'ring' | 'shard' | 'emoji';
  emoji?: string;
  scale?: number;
  scaleGrowth?: number;
  rotation?: number;
  vRot?: number;
}

export interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
}

export interface ArcadeStats {
  score: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  hits: number;
  hazardHit: boolean;
  roundTimeLeft: number;
  survivalSeconds: number;
  tier: DifficultyTierLevel;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  maxCombo: number;
  timestamp: number;
}
