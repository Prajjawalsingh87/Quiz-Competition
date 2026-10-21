export const formatDuration = (ms) => {
    const total = Math.max(0, Math.round(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
};

const PALETTE = ['#5b4cf0', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#7c3aed', '#ef4444', '#14b8a6'];

// Stable avatar colour for a nickname.
export const colorForName = (name = '') => PALETTE[[...name.toLowerCase()].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7) % PALETTE.length];

export const rankTone = (i) => (i === 0 ? 'text-amber-500' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-400' : 'text-muted');
