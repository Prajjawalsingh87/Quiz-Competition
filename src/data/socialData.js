// Placeholder social data until the realtime backend is connected.
export const FRIENDS = [
    { id: 'aarav', name: 'Aarav Mehta', handle: '@aarav', status: 'online', xp: 4820, color: '#5b4cf0' },
    { id: 'sara', name: 'Sara Khan', handle: '@sarak', status: 'in-game', xp: 6110, color: '#ec4899' },
    { id: 'rohan', name: 'Rohan Das', handle: '@rohand', status: 'online', xp: 3975, color: '#0ea5e9' },
    { id: 'meera', name: 'Meera Iyer', handle: '@meera', status: 'offline', xp: 5240, color: '#10b981' },
    { id: 'kabir', name: 'Kabir Singh', handle: '@kabir', status: 'offline', xp: 2890, color: '#f59e0b' },
    { id: 'zoya', name: 'Zoya Ali', handle: '@zoya', status: 'online', xp: 7030, color: '#8b5cf6' },
];

export const STATUS_LABEL = {
    online: 'Online',
    'in-game': 'In a quiz',
    offline: 'Offline',
};

export const LEADERBOARD = [...FRIENDS].sort((a, b) => b.xp - a.xp);

export const INITIAL_MESSAGES = {
    aarav: [
        { from: 'them', text: 'Ready for a rematch on Science? 🔬', time: '10:02' },
        { from: 'me', text: 'Always. Give me 5 minutes.', time: '10:04' },
        { from: 'them', text: 'Creating the room now!', time: '10:05' },
    ],
    sara: [
        { from: 'them', text: 'That last history question was brutal 😅', time: '09:41' },
    ],
    rohan: [
        { from: 'me', text: 'GG yesterday!', time: 'Yesterday' },
        { from: 'them', text: 'Thanks! You were close.', time: 'Yesterday' },
    ],
    zoya: [
        { from: 'them', text: 'Top of the leaderboard again 👑', time: 'Mon' },
    ],
};

export const initials = (name = '') =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('') || '?';
