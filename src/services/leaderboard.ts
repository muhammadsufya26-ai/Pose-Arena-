import { LeaderboardEntry } from '../types/game';

const STORAGE_KEY = 'pose_arena_finger_strike_scores_v1';

const DEFAULT_RECORDS: LeaderboardEntry[] = [
  { id: '1', name: 'APEX_STRIKER', score: 18650, maxCombo: 34, timestamp: Date.now() - 1000 * 60 * 30 },
  { id: '2', name: 'CYBER_VIPER', score: 15400, maxCombo: 28, timestamp: Date.now() - 1000 * 60 * 60 },
  { id: '3', name: 'BLADE_MASTER', score: 12850, maxCombo: 24, timestamp: Date.now() - 1000 * 60 * 120 },
  { id: '4', name: 'NEO_ROOKIE', score: 9800, maxCombo: 18, timestamp: Date.now() - 1000 * 60 * 180 },
  { id: '5', name: 'PIXEL_PUNCH', score: 7600, maxCombo: 14, timestamp: Date.now() - 1000 * 60 * 240 },
];

export const getLeaderboard = (): LeaderboardEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECORDS));
      return DEFAULT_RECORDS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_RECORDS;
  } catch {
    return DEFAULT_RECORDS;
  }
};

export const saveLeaderboardRecord = (record: Omit<LeaderboardEntry, 'id' | 'timestamp'>): { rank: number; entries: LeaderboardEntry[] } => {
  const current = getLeaderboard();
  const entry: LeaderboardEntry = {
    ...record,
    id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
  };

  const updated = [...current, entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save score', e);
  }

  const rank = updated.findIndex((r) => r.id === entry.id) + 1;
  return { rank: rank > 0 ? rank : -1, entries: updated };
};

export const resetLeaderboard = (): LeaderboardEntry[] => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RECORDS));
  } catch {}
  return DEFAULT_RECORDS;
};
