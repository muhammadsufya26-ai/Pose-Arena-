import React, { useRef, useEffect, useCallback } from 'react';
import {
  Target,
  Particle,
  ScorePopup,
  PointerCoordinate,
  TrackingSensor,
  TrailPoint,
  DifficultyTierLevel,
  getDifficultyTier,
} from '../types/game';
import { soundFx } from '../services/audioEngine';

interface ArenaCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  pointer: PointerCoordinate;
  sensor: TrackingSensor;
  gameState: 'ATTRACT' | 'COUNTDOWN' | 'PLAYING' | 'GAMEOVER';
  currentScore: number;
  comboMultiplier: number;
  onHitTarget: (target: Target, points: number) => void;
  onMissTarget: (target: Target) => void;
  onHazardMineDetonation: () => void;
  onPointerMove: (x: number, y: number) => void;
}

interface TierAnnouncement {
  tier: DifficultyTierLevel;
  name: string;
  subtitle: string;
  color: string;
  startTime: number;
}

// Comprehensive Face & Arcade Emoji Pools
export interface EmojiConfig {
  emoji: string;
  color: string;
  category: 'face' | 'arcade';
  canBeBonus?: boolean;
}

export const TARGET_EMOJI_POOL: EmojiConfig[] = [
  // Expressive Face Emojis (12)
  { emoji: '😂', color: '#facc15', category: 'face' },
  { emoji: '🤩', color: '#fbbf24', category: 'face', canBeBonus: true },
  { emoji: '🤪', color: '#f59e0b', category: 'face' },
  { emoji: '🥳', color: '#ec4899', category: 'face', canBeBonus: true },
  { emoji: '😈', color: '#a855f7', category: 'face' },
  { emoji: '🤖', color: '#06b6d4', category: 'face' },
  { emoji: '👽', color: '#10b981', category: 'face' },
  { emoji: '🤡', color: '#f43f5e', category: 'face' },
  { emoji: '👻', color: '#e2e8f0', category: 'face' },
  { emoji: '🥶', color: '#38bdf8', category: 'face' },
  { emoji: '🤯', color: '#f97316', category: 'face' },
  { emoji: '🤠', color: '#eab308', category: 'face' },

  // Arcade / Points Emojis (6)
  { emoji: '🎯', color: '#ef4444', category: 'arcade' },
  { emoji: '⭐', color: '#fbbf24', category: 'arcade', canBeBonus: true },
  { emoji: '🔥', color: '#f97316', category: 'arcade' },
  { emoji: '💎', color: '#00f3ff', category: 'arcade', canBeBonus: true },
  { emoji: '🚀', color: '#38bdf8', category: 'arcade', canBeBonus: true },
  { emoji: '👑', color: '#f59e0b', category: 'arcade', canBeBonus: true },
];

export const HAZARD_EMOJI_POOL = ['💣', '☠️'];

export const ArenaCanvas: React.FC<ArenaCanvasProps> = ({
  videoRef,
  pointer,
  sensor,
  gameState,
  currentScore,
  comboMultiplier,
  onHitTarget,
  onMissTarget,
  onHazardMineDetonation,
  onPointerMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 60 FPS state refs
  const targetsRef = useRef<Target[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);
  const trailRef = useRef<TrailPoint[]>([]);
  const prevPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastNormalSpawnRef = useRef<number>(0);
  const lastHazardSpawnRef = useRef<number>(0);

  // FX refs
  const screenShakeRef = useRef<number>(0);
  const crimsonFlashRef = useRef<number>(0);
  const whiteFlashRef = useRef<number>(0);

  // Difficulty Tier Tracking
  const prevTierRef = useRef<DifficultyTierLevel>(1);
  const tierBannerRef = useRef<TierAnnouncement | null>(null);

  // Setup canvas resolution and resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset state on game transitions
  useEffect(() => {
    if (gameState === 'PLAYING') {
      targetsRef.current = [];
      particlesRef.current = [];
      popupsRef.current = [];
      trailRef.current = [];
      prevPointerRef.current = null;
      lastNormalSpawnRef.current = Date.now();
      lastHazardSpawnRef.current = Date.now();
      screenShakeRef.current = 0;
      crimsonFlashRef.current = 0;
      whiteFlashRef.current = 0;
      prevTierRef.current = 1;
      tierBannerRef.current = null;
    } else if (gameState === 'ATTRACT') {
      targetsRef.current = [];
      particlesRef.current = [];
      popupsRef.current = [];
      trailRef.current = [];
      tierBannerRef.current = null;
    }
  }, [gameState]);

  // Check for Tier Upgrades
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const tierInfo = getDifficultyTier(currentScore);
    if (tierInfo.tier > prevTierRef.current) {
      prevTierRef.current = tierInfo.tier;
      soundFx.playTierAdvance(tierInfo.tier);
      tierBannerRef.current = {
        tier: tierInfo.tier,
        name: tierInfo.name,
        subtitle: tierInfo.subtitle,
        color: tierInfo.color,
        startTime: Date.now(),
      };
      // Brief reward flash
      whiteFlashRef.current = 0.35;
      screenShakeRef.current = 12;
    }
  }, [currentScore, gameState]);

  // Normal Emoji Target Spawner (Standard + Golden Fast Bonus)
  const spawnNormalTarget = useCallback(
    (width: number, height: number, tierInfo: ReturnType<typeof getDifficultyTier>) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const x = 0.15 + Math.random() * 0.7;
      const y = 0.18 + Math.random() * 0.58;

      // Randomly pick from the comprehensive Face & Arcade emoji pool
      const choice = TARGET_EMOJI_POOL[Math.floor(Math.random() * TARGET_EMOJI_POOL.length)];
      const isBonus = choice.canBeBonus ? Math.random() < 0.35 : Math.random() < 0.15;
      const type: Target['type'] = isBonus ? 'orb_bonus' : 'orb_standard';

      const emoji = choice.emoji;
      const color = choice.color;
      const points = isBonus ? 250 : 100; // +250 points for golden fast targets, +100 standard

      // Base radius scaled by difficulty tier radiusScale (28px - 34px)
      const baseRadius = Math.max(28, Math.min(width, height) * 0.042);
      const radius = baseRadius * tierInfo.radiusScale;

      // Drifting speed scaled by tier (Golden targets move 35% faster!)
      let speedMagnitude = 0.001;
      if (tierInfo.tier === 2) speedMagnitude = 0.0018;
      else if (tierInfo.tier === 3) speedMagnitude = 0.0026;
      else if (tierInfo.tier === 4) speedMagnitude = 0.0036;

      if (isBonus) {
        speedMagnitude *= 1.35; // 35% faster movement for golden targets
      }

      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * speedMagnitude;
      const vy = Math.sin(angle) * speedMagnitude;

      const newTarget: Target = {
        id,
        x,
        y,
        baseY: y,
        radius,
        type,
        emoji,
        points,
        createdAt: Date.now(),
        durationMs: tierInfo.targetLifespanMs,
        vx,
        vy,
        pulsePhase: Math.random() * Math.PI * 2,
        color,
        motionStyle: tierInfo.motionStyle,
        lastShiftTime: Date.now(),
      };

      targetsRef.current.push(newTarget);
    },
    []
  );

  // Hazard Mine Spawner (💣 or ☠️ with aggressive tremble and danger zone)
  const spawnHazardMine = useCallback(
    (width: number, height: number, tierInfo: ReturnType<typeof getDifficultyTier>) => {
      const id = `hz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const x = 0.2 + Math.random() * 0.6;
      const y = 0.2 + Math.random() * 0.55;

      const baseRadius = Math.max(30, Math.min(width, height) * 0.044);
      const radius = baseRadius * (tierInfo.tier === 4 ? 0.8 : 1.0);

      const hazardEmoji = HAZARD_EMOJI_POOL[Math.floor(Math.random() * HAZARD_EMOJI_POOL.length)];

      let speedMagnitude = 0.0008;
      if (tierInfo.tier === 3) speedMagnitude = 0.002;
      if (tierInfo.tier === 4) speedMagnitude = 0.0032;

      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * speedMagnitude;
      const vy = Math.sin(angle) * speedMagnitude;

      // Tier 2: Orbital Hazard Mine that orbits normal target or screen quadrant
      const isOrbital = tierInfo.tier === 2;
      let orbitCenterX = 0.5;
      let orbitCenterY = 0.5;

      const normalTargets = targetsRef.current.filter((t) => t.type !== 'hazard_mine');
      if (normalTargets.length > 0) {
        const anchor = normalTargets[0];
        orbitCenterX = anchor.x;
        orbitCenterY = anchor.y;
      }

      const newHazard: Target = {
        id,
        x,
        y,
        baseY: y,
        radius,
        type: 'hazard_mine',
        emoji: hazardEmoji,
        points: 0,
        createdAt: Date.now(),
        durationMs: tierInfo.tier === 4 ? 3500 : tierInfo.tier === 3 ? 4500 : 5500,
        vx,
        vy,
        pulsePhase: Math.random() * Math.PI * 2,
        color: '#ef4444',
        motionStyle: tierInfo.motionStyle,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitCenterX: isOrbital ? orbitCenterX : undefined,
        orbitCenterY: isOrbital ? orbitCenterY : undefined,
        orbitRadius: isOrbital ? 0.12 : undefined,
        orbitSpeed: isOrbital ? 0.0022 : undefined,
        lastShiftTime: Date.now(),
      };

      targetsRef.current.push(newHazard);
    },
    []
  );

  // Smash Effect on Normal Target: Emoji Expands rapidly (1.0 -> 1.6) and fades out over ~150ms + 10-14 sparks
  const emitEmojiSmash = (x: number, y: number, target: Target) => {
    // 1. Expanding Pop Ghost Emoji
    particlesRef.current.push({
      x,
      y,
      vx: target.vx * 0.4,
      vy: target.vy * 0.4 - 0.4,
      color: target.color,
      size: Math.round(44 * (target.radius / 30)),
      alpha: 1.0,
      decay: 0.11, // ~9 frames at 60fps = 150ms
      shape: 'emoji',
      emoji: target.emoji,
      scale: 1.0,
      scaleGrowth: 0.068, // Expands from 1.0 to 1.6+
      rotation: (Math.random() - 0.5) * 0.2,
      vRot: (Math.random() - 0.5) * 0.04,
    });

    // 2. Pop Shockwave Ring
    particlesRef.current.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: target.color,
      size: target.radius * 0.8,
      alpha: 0.9,
      decay: 0.08,
      shape: 'ring',
    });

    // 3. 10–14 colorful micro-sparks & shards
    const sparkCount = 10 + Math.floor(Math.random() * 5);
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3.5 + Math.random() * 8.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: target.color,
        size: 2.5 + Math.random() * 3.5,
        alpha: 1.0,
        decay: 0.035 + Math.random() * 0.03,
        shape: Math.random() > 0.4 ? 'spark' : 'shard',
      });
    }
  };

  // Sudden Death Explosion on Hazard Bomb: 💥, 💨, red debris, sparks & shockwaves
  const emitHazardExplosion = (x: number, y: number) => {
    // 1. Massive 💥 Explosion Emoji Ghost
    particlesRef.current.push({
      x,
      y,
      vx: 0,
      vy: -1,
      color: '#ef4444',
      size: 72,
      alpha: 1.0,
      decay: 0.035,
      shape: 'emoji',
      emoji: '💥',
      scale: 1.0,
      scaleGrowth: 0.08,
      rotation: (Math.random() - 0.5) * 0.4,
    });

    // 2. Flying 💨 Smoke Dust Emojis
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 + Math.random() * 0.5;
      particlesRef.current.push({
        x: x + Math.cos(angle) * 15,
        y: y + Math.sin(angle) * 15,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        color: '#ffffff',
        size: 38,
        alpha: 0.85,
        decay: 0.04,
        shape: 'emoji',
        emoji: '💨',
        scale: 0.8,
        scaleGrowth: 0.05,
      });
    }

    // 3. Dual Shockwave Rings (Crimson + Blinding White)
    particlesRef.current.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: '#ef4444',
      size: 32,
      alpha: 1.0,
      decay: 0.02,
      shape: 'ring',
    });
    particlesRef.current.push({
      x,
      y,
      vx: 0,
      vy: 0,
      color: '#ffffff',
      size: 16,
      alpha: 1.0,
      decay: 0.025,
      shape: 'ring',
    });

    // 4. Heavy Flying Red Debris & Sparks (35+ particles)
    for (let i = 0; i < 36; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 14;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: Math.random() > 0.4 ? '#ef4444' : '#f97316',
        size: 3.5 + Math.random() * 5,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.02,
        shape: Math.random() > 0.5 ? 'shard' : 'spark',
      });
    }
  };

  // Main 60 FPS Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const now = Date.now();
      const width = canvas.width;
      const height = canvas.height;
      const tierInfo = getDifficultyTier(currentScore);

      ctx.save();

      // Screen Shake
      if (screenShakeRef.current > 0.4) {
        const sx = (Math.random() - 0.5) * screenShakeRef.current;
        const sy = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(sx, sy);
        screenShakeRef.current *= 0.88;
      } else {
        screenShakeRef.current = 0;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Live Background Feed: Mirrored full-screen webcam feed
      const video = videoRef.current;
      if (video && video.readyState >= 2 && !video.paused) {
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();

        // Dark sci-fi tint so player sees themselves clearly while emojis pop vividly
        ctx.fillStyle = 'rgba(3, 7, 18, 0.42)';
        ctx.fillRect(0, 0, width, height);
      } else {
        // Fallback backdrop
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, '#030712');
        grad.addColorStop(0.5, '#0f172a');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // Vignette effect
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.35,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(3, 7, 18, 0.75)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      // 2. High-Intensity Border Pulse Effects (Tier 3 & Tier 4)
      if (gameState === 'PLAYING') {
        renderTierScreenBorder(ctx, width, height, tierInfo, now);
      }

      // 3. Trailing Particle Spark Trail following finger tip
      if (pointer.isDetected) {
        const px = pointer.x * width;
        const py = pointer.y * height;
        const prev = prevPointerRef.current;
        const dist = prev ? Math.hypot(px - prev.x, py - prev.y) : 0;

        trailRef.current.push({ x: px, y: py, time: now });

        // High-velocity sparks behind finger
        if (dist > 3 || pointer.velocity > 0.008) {
          const sparkCount = Math.min(6, Math.max(1, Math.floor(dist / 8)));
          for (let i = 0; i < sparkCount; i++) {
            particlesRef.current.push({
              x: px + (Math.random() - 0.5) * 8,
              y: py + (Math.random() - 0.5) * 8,
              vx: (Math.random() - 0.5) * 3,
              vy: (Math.random() - 0.5) * 3,
              color: tierInfo.tier >= 3 ? '#fbbf24' : '#00f3ff',
              size: 2 + Math.random() * 2.5,
              alpha: 0.9,
              decay: 0.045,
              shape: 'spark',
            });
          }
        }

        prevPointerRef.current = { x: px, y: py };
      } else {
        prevPointerRef.current = null;
      }

      // Purge old trail
      trailRef.current = trailRef.current.filter((pt) => now - pt.time < 300);

      // Render glowing trail line
      renderFingerTrail(ctx, now, tierInfo);

      // 4. Target Generation & Collision Loop
      if (gameState === 'PLAYING') {
        const normalTargetsCount = targetsRef.current.filter((t) => t.type !== 'hazard_mine').length;
        const normalInterval =
          tierInfo.tier === 4 ? 480 : tierInfo.tier === 3 ? 650 : tierInfo.tier === 2 ? 850 : 1050;

        if (normalTargetsCount < tierInfo.maxNormalTargets && now - lastNormalSpawnRef.current > normalInterval) {
          spawnNormalTarget(width, height, tierInfo);
          lastNormalSpawnRef.current = now;
        }

        // Spawn Hazard Mines based on Tier
        const hazardCount = targetsRef.current.filter((t) => t.type === 'hazard_mine').length;
        if (hazardCount < tierInfo.maxHazardMines && now - lastHazardSpawnRef.current > tierInfo.hazardIntervalMs) {
          spawnHazardMine(width, height, tierInfo);
          lastHazardSpawnRef.current = now;
        }

        renderAndCollideTargets(ctx, width, height, tierInfo, now);
      }

      // 5. Finger Tip Targeting Ring Reticle
      if (pointer.isDetected) {
        renderFingerReticle(ctx, pointer.x * width, pointer.y * height, tierInfo, now);
      }

      // 6. Particles (Emojis, Rings, Sparks, Shards)
      renderParticles(ctx);

      // 7. Score Popups
      renderPopups(ctx);

      // 8. Tier Holographic Announcement Banner
      renderTierBanner(ctx, width, height, now);

      // 9. Instant Blinding Screen Blast & Crimson Flash (Sudden Death)
      if (whiteFlashRef.current > 0.02) {
        ctx.fillStyle = `rgba(255, 255, 255, ${whiteFlashRef.current})`;
        ctx.fillRect(0, 0, width, height);
        whiteFlashRef.current *= 0.82;
      }
      if (crimsonFlashRef.current > 0.02) {
        ctx.fillStyle = `rgba(239, 68, 68, ${crimsonFlashRef.current * 0.85})`;
        ctx.fillRect(0, 0, width, height);
        crimsonFlashRef.current *= 0.86;
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [gameState, pointer, currentScore, comboMultiplier, spawnNormalTarget, spawnHazardMine]);

  // High-Intensity Screen Border Pulse Effect (Tier 3 & Tier 4)
  const renderTierScreenBorder = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    tierInfo: ReturnType<typeof getDifficultyTier>,
    now: number
  ) => {
    if (tierInfo.tier < 3) return;

    ctx.save();
    if (tierInfo.tier === 3) {
      // Tier 3: Amber Frenzy Border Pulse
      const pulse = 0.25 + 0.2 * Math.sin(now * 0.007);
      ctx.strokeStyle = `rgba(245, 158, 11, ${pulse})`;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#f59e0b';
      ctx.strokeRect(4, 4, width - 8, height - 8);

      const cSize = 28;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(10, 10 + cSize);
      ctx.lineTo(10, 10);
      ctx.lineTo(10 + cSize, 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width - 10 - cSize, 10);
      ctx.lineTo(width - 10, 10);
      ctx.lineTo(width - 10, 10 + cSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, height - 10 - cSize);
      ctx.lineTo(10, height - 10);
      ctx.lineTo(10 + cSize, height - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width - 10 - cSize, height - 10);
      ctx.lineTo(width - 10, height - 10);
      ctx.lineTo(width - 10, height - 10 - cSize);
      ctx.stroke();
    } else if (tierInfo.tier === 4) {
      // Tier 4: Crimson / Overdrive Rapid Warning Border Pulse
      const pulse = 0.4 + 0.35 * Math.sin(now * 0.015);
      ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
      ctx.lineWidth = 6;
      ctx.shadowBlur = 24;
      ctx.shadowColor = '#ef4444';
      ctx.strokeRect(6, 6, width - 12, height - 12);

      const cSize = 40;
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(14, 14 + cSize);
      ctx.lineTo(14, 14);
      ctx.lineTo(14 + cSize, 14);
      ctx.moveTo(width - 14 - cSize, 14);
      ctx.lineTo(width - 14, 14);
      ctx.lineTo(width - 14, 14 + cSize);
      ctx.moveTo(14, height - 14 - cSize);
      ctx.lineTo(14, height - 14);
      ctx.lineTo(14 + cSize, height - 14);
      ctx.moveTo(width - 14 - cSize, height - 14);
      ctx.lineTo(width - 14, height - 14);
      ctx.lineTo(width - 14, height - 14 - cSize);
      ctx.stroke();
    }
    ctx.restore();
  };

  // Render glowing ribbon trail behind finger
  const renderFingerTrail = (
    ctx: CanvasRenderingContext2D,
    now: number,
    tierInfo: ReturnType<typeof getDifficultyTier>
  ) => {
    const trail = trailRef.current;
    if (trail.length < 2) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const glowColor = tierInfo.color;

    for (let i = 0; i < trail.length - 1; i++) {
      const p0 = trail[i];
      const p1 = trail[i + 1];
      const age = now - p1.time;
      const life = Math.max(0, 1 - age / 300);
      if (life <= 0) continue;

      const progress = (i + 1) / trail.length;
      const width = Math.max(1.5, progress * 8);

      // Neon glow
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = width * 2;
      ctx.shadowBlur = 12;
      ctx.shadowColor = glowColor;
      ctx.globalAlpha = life * 0.45;
      ctx.stroke();

      // White core
      ctx.lineWidth = Math.max(1, width * 0.5);
      ctx.strokeStyle = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#ffffff';
      ctx.globalAlpha = life * 0.9;
      ctx.stroke();
    }

    ctx.restore();
  };

  // Finger Reticle: Dynamic ring with trailing spark effect
  const renderFingerReticle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    tierInfo: ReturnType<typeof getDifficultyTier>,
    now: number
  ) => {
    ctx.save();
    ctx.translate(x, y);

    const pulse = Math.sin(now * 0.01) * 2.5;
    const r = 18;
    const color = tierInfo.color;

    // Glowing outer ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 16;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(0, 0, r + pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Rotating micro tick brackets
    ctx.rotate(now * 0.003);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(r + pulse - 2, 0);
      ctx.lineTo(r + pulse + 5, 0);
      ctx.stroke();
    }

    // Glowing center dot
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Render & Collide Emoji Targets with Progressive Difficulty Motion
  const renderAndCollideTargets = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    tierInfo: ReturnType<typeof getDifficultyTier>,
    now: number
  ) => {
    const px = pointer.isDetected ? pointer.x * width : -1000;
    const py = pointer.isDetected ? pointer.y * height : -1000;
    const fingerRadius = 22;

    const remaining: Target[] = [];

    for (const target of targetsRef.current) {
      const age = now - target.createdAt;
      const progress = age / target.durationMs;

      // Lifespan expired
      if (progress >= 1) {
        if (target.type !== 'hazard_mine') {
          onMissTarget(target);
          soundFx.playMiss();
        }
        continue;
      }

      // --- MOTION DYNAMICS PER TIER ---
      if (target.type === 'hazard_mine' && target.orbitCenterX !== undefined) {
        // Tier 2 Orbiting Hazard Mine
        target.orbitAngle = (target.orbitAngle || 0) + (target.orbitSpeed || 0.0022);
        target.x = target.orbitCenterX + Math.cos(target.orbitAngle) * (target.orbitRadius || 0.12);
        target.y = (target.orbitCenterY || 0.5) + Math.sin(target.orbitAngle) * (target.orbitRadius || 0.12);
      } else if (target.motionStyle === 'sine_wave') {
        // Tier 2: Drift + Sine-wave vertical oscillation
        target.x += target.vx;
        const wave = Math.sin((now - target.createdAt) * 0.005) * 0.0025;
        target.y += target.vy + wave;
      } else if (target.motionStyle === 'zigzag') {
        // Tier 3: Erratic zig-zag movement vectors and sudden directional shifts
        target.x += target.vx;
        target.y += target.vy;
        if (!target.lastShiftTime || now - target.lastShiftTime > 380) {
          target.lastShiftTime = now;
          const currentSpeed = Math.hypot(target.vx, target.vy) || 0.0025;
          const shiftAngle = (Math.random() - 0.5) * Math.PI * 0.75;
          const currentAngle = Math.atan2(target.vy, target.vx);
          const newAngle = currentAngle + shiftAngle;
          target.vx = Math.cos(newAngle) * currentSpeed;
          target.vy = Math.sin(newAngle) * currentSpeed;
        }
      } else if (target.motionStyle === 'aggressive') {
        // Tier 4: Fast aggressive drift vectors
        target.x += target.vx * 1.15;
        target.y += target.vy * 1.15;
      } else {
        // Tier 1: Steady, gentle floating motion
        target.x += target.vx;
        target.y += target.vy;
      }

      // Screen boundary bounce
      if (target.x < 0.11 || target.x > 0.89) {
        target.vx = -target.vx;
        target.x = Math.max(0.11, Math.min(0.89, target.x));
      }
      if (target.y < 0.13 || target.y > 0.87) {
        target.vy = -target.vy;
        target.y = Math.max(0.13, Math.min(0.87, target.y));
      }

      const tx = target.x * width;
      const ty = target.y * height;
      const tr = target.radius;

      // Radial collision check around (tx, ty)
      const dist = Math.hypot(px - tx, py - ty);
      const isHit = dist < tr + fingerRadius;

      if (isHit) {
        if (target.type === 'hazard_mine') {
          // Instant Blinding Screen Blast & Immediate Sudden Death Detonation!
          whiteFlashRef.current = 1.0;
          crimsonFlashRef.current = 1.0;
          screenShakeRef.current = 50;
          soundFx.playMineDetonation();
          emitHazardExplosion(tx, ty);
          popupsRef.current.push({
            x: tx,
            y: ty - 12,
            text: 'SUDDEN DEATH // HAZARD DETONATION',
            color: '#ef4444',
            alpha: 1,
            scale: 1.8,
          });
          onHazardMineDetonation();
          return;
        } else {
          // Emoji Target Smashed!
          screenShakeRef.current = target.type === 'orb_bonus' ? 12 : 8;
          soundFx.playTargetHit(comboMultiplier, target.type === 'orb_bonus');
          emitEmojiSmash(tx, ty, target);

          const earned = target.points * comboMultiplier;

          popupsRef.current.push({
            x: tx,
            y: ty - 12,
            text: `+${earned}`,
            color: target.color,
            alpha: 1,
            scale: target.type === 'orb_bonus' ? 1.5 : 1.3,
          });

          onHitTarget(target, earned);
          continue;
        }
      }

      // Render Dynamic Emoji Target
      drawEmojiTarget(ctx, target, tx, ty, tr, progress, now, tierInfo);
      remaining.push(target);
    }

    targetsRef.current = remaining;
  };

  // Canvas Emoji Target Rendering (Replacing vector balls/circles)
  const drawEmojiTarget = (
    ctx: CanvasRenderingContext2D,
    target: Target,
    x: number,
    y: number,
    radius: number,
    progress: number,
    now: number,
    tierInfo: ReturnType<typeof getDifficultyTier>
  ) => {
    ctx.save();

    const timeLeft = Math.max(0, 1 - progress);

    if (target.type === 'hazard_mine') {
      // 💣 or ☠️ Sudden Death Hazard
      // Aggressive oscillating jitter / tremble
      const jitterX = Math.sin(now * 0.035 + target.pulsePhase) * 3.5;
      const jitterY = Math.cos(now * 0.04 + target.pulsePhase) * 3.5;

      ctx.translate(x + jitterX, y + jitterY);

      // Faint pulsing red danger circle behind it
      const dangerPulse = 6 + Math.sin(now * 0.015 + target.pulsePhase) * 4;
      ctx.beginPath();
      ctx.arc(0, 0, radius + dangerPulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.75)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 16;
      ctx.shadowColor = '#ef4444';
      ctx.fill();
      ctx.stroke();

      // Rotating micro danger brackets
      ctx.rotate(now * 0.003);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(radius + dangerPulse - 2, 0);
        ctx.lineTo(radius + dangerPulse + 5, 0);
        ctx.stroke();
      }

      // Render Hazard Emoji directly in canvas
      const fontSize = Math.round(46 * tierInfo.radiusScale);
      ctx.font = `${fontSize}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#ef4444';
      ctx.fillText(target.emoji, 0, 0);

      ctx.restore();
      return;
    }

    // Standard Point Targets (🎯, ⭐, 🔥, 💎, 👾) or Golden Bonus (👑, 🚀)
    ctx.translate(x, y);

    // Subtle floating breathing pulse animation: sin(time * 4)
    const breathing = 1 + 0.12 * Math.sin(now * 0.004 + target.pulsePhase);
    ctx.scale(breathing, breathing);

    // Circular Countdown Timer Arc around the emoji
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = target.color;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = target.color;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, -Math.PI / 2, -Math.PI / 2 + timeLeft * Math.PI * 2);
    ctx.stroke();

    // Bonus Target Sparkle Aura
    if (target.type === 'orb_bonus') {
      ctx.rotate(now * 0.002);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, radius + 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Render Emoji Target with High Precision Alignment
    const baseFontSize = target.type === 'orb_bonus' ? 48 : 44;
    const fontSize = Math.round(baseFontSize * tierInfo.radiusScale);

    ctx.font = `${fontSize}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 16;
    ctx.shadowColor = target.color;
    ctx.fillText(target.emoji, 0, 0);

    ctx.restore();
  };

  // Particles (Emojis, Shockwave Rings, Sparks, Shards)
  const renderParticles = (ctx: CanvasRenderingContext2D) => {
    const alive: Particle[] = [];
    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.shape === 'emoji' && p.emoji) {
        // Animated Pop Explosion Emoji Ghost
        p.scale = (p.scale || 1.0) + (p.scaleGrowth || 0.06);
        if (p.rotation !== undefined && p.vRot !== undefined) {
          p.rotation += p.vRot;
        }

        ctx.translate(p.x, p.y);
        if (p.rotation) ctx.rotate(p.rotation);
        ctx.scale(p.scale, p.scale);
        ctx.font = `${p.size}px 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fillText(p.emoji, 0, 0);
      } else {
        ctx.strokeStyle = p.color;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;

        if (p.shape === 'ring') {
          p.size += 3.8;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
      }

      ctx.restore();
      alive.push(p);
    }
    particlesRef.current = alive;
  };

  // Score popups
  const renderPopups = (ctx: CanvasRenderingContext2D) => {
    const alive: ScorePopup[] = [];
    for (const pop of popupsRef.current) {
      pop.y -= 1.4;
      pop.alpha -= 0.025;
      pop.scale = Math.max(1, pop.scale * 0.98);

      if (pop.alpha <= 0) continue;

      ctx.save();
      ctx.globalAlpha = Math.max(0, pop.alpha);
      ctx.font = `800 ${Math.floor(22 * pop.scale)}px var(--font-outfit, sans-serif)`;
      ctx.fillStyle = pop.color;
      ctx.shadowBlur = 12;
      ctx.shadowColor = pop.color;
      ctx.textAlign = 'center';
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();

      alive.push(pop);
    }
    popupsRef.current = alive;
  };

  // Tier Advancement Holographic Announcement Banner
  const renderTierBanner = (ctx: CanvasRenderingContext2D, width: number, height: number, now: number) => {
    const banner = tierBannerRef.current;
    if (!banner) return;

    const age = now - banner.startTime;
    const duration = 2200;
    if (age > duration) {
      tierBannerRef.current = null;
      return;
    }

    const alpha = age < 300 ? age / 300 : Math.max(0, 1 - (age - 1400) / 800);
    const scale = age < 300 ? 0.85 + (age / 300) * 0.15 : 1.0;

    ctx.save();
    ctx.translate(width / 2, height * 0.28);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Glowing Banner Backing
    const bWidth = Math.min(520, width * 0.85);
    const bHeight = 72;

    ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
    ctx.strokeStyle = banner.color;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 25;
    ctx.shadowColor = banner.color;

    ctx.beginPath();
    ctx.roundRect(-bWidth / 2, -bHeight / 2, bWidth, bHeight, 16);
    ctx.fill();
    ctx.stroke();

    // Top Header: TIER X ACTIVATED
    ctx.font = '900 24px var(--font-outfit, sans-serif)';
    ctx.fillStyle = banner.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowBlur = 14;
    ctx.shadowColor = banner.color;
    ctx.fillText(`TIER ${banner.tier} // ${banner.name}`, 0, -10);

    // Subtitle
    ctx.font = '700 12px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 4;
    ctx.shadowColor = '#ffffff';
    ctx.fillText(banner.subtitle, 0, 16);

    ctx.restore();
  };

  // Handle pointer tracking in Mouse mode
  const handlePointerEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (sensor !== 'MOUSE') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    onPointerMove(nx, ny);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 select-none">
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerEvent}
        onPointerDown={handlePointerEvent}
        className="w-full h-full block cursor-crosshair touch-none"
      />
      <div className="absolute inset-0 arcade-vignette pointer-events-none" />
    </div>
  );
};
