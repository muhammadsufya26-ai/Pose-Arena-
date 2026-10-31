# ⚡ POSE ARENA: FINGER STRIKE

An interactive, high-energy arcade action game powered by real-time computer vision fingertip tracking (MediaPipe Hands Landmark 8) and HTML5 Canvas physics. Siphon points by slicing animated emoji targets, dodge sudden-death hazard bombs, and survive high-octane progressive difficulty tiers.

Built with **React 19**, **TypeScript**, **Tailwind CSS**, **HTML5 Canvas**, and **MediaPipe Hands**.

---

## 🎮 Features

- **Primary Control — Index Fingertip Tracking:** Tracks exclusively your primary index fingertip (Landmark 8) with smooth lerp interpolation, targeting reticle, and trailing spark particles. No full hand skeletons or body clutter.
- **Hardware Mouse Fallback:** Instant top-bar toggle `[ 🖐️ Hand Camera | 🖱️ Mouse ]` for immediate play or testing without a webcam.
- **Dynamic Emoji Targets:**
  - Standard point targets (🎯 Bullseye, ⭐ Star, 🔥 Fire, 💎 Gem, 👾 Alien): +100 points each with breathing scale pulse and micro-spark bursts.
  - Golden speed targets (👑 Crown, 🚀 Rocket): +250 bonus points, moving 35% faster across the quadrant.
  - Sudden-death hazards (💣 Bomb, ☠️ Skull): Vibrating proximity jitter, pulsing danger bracket, and instant blinding screen-shake blast triggering immediate Game Over upon contact.
- **Progressive Live Difficulty Scaling:**
  - **Tier 1 (Warmup | 0 - 1,000 pts):** 2.2s target lifespan, 2 simultaneous targets, gentle drifting, rare hazard spawns.
  - **Tier 2 (Accelerated | 1,001 - 3,000 pts):** 1.6s lifespan, 3 targets, sine-wave oscillation, hitbox -15%, orbiting hazard bombs.
  - **Tier 3 (Frenzy | 3,001 - 6,000 pts):** 1.1s lifespan, 4 targets, erratic zig-zag vectors, 2 simultaneous hazard mines, pulsing neon danger border.
  - **Tier 4 (Overdrive | 6,000+ pts):** 0.8s reaction lifespan, hitbox -35%, 3 aggressive drifting hazard bombs, maximum speed and reflex demand.
- **Web Audio FX Synthesizer:** Real-time Web Audio API sound effects (laser pops, combo chimes, harmonic bells, and deep mine detonation rumbles) with zero external audio assets required.
- **Arcade HUD & Leaderboard:** Mirrored webcam background feed with sci-fi vignette, combo streak multiplier, and persistent local Top Scores podium.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or bun

### Installation
```bash
# Clone the repository
git clone https://github.com/muhammadsufya26-ai/Pose-Arena-.git

# Navigate to the project directory
cd Pose-Arena-

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:3000` in your browser and allow camera permissions when prompted.

---

## 🌐 Deploy to Vercel

1. Push this repository to your GitHub account (or fork it).
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import the `Pose-Arena-` repository.
4. Keep the default settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Click **Deploy**!

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS
- **Bundler:** Vite
- **Computer Vision:** MediaPipe Hands (Landmark 8 fingertip tracking)
- **Audio:** Native Web Audio API synthesizer
- **Icons:** Lucide React
