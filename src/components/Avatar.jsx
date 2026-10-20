import React from 'react';
import { initials } from '../data/socialData';

const SIZES = {
    sm: 'size-9 text-xs',
    md: 'size-11 text-sm',
    lg: 'size-20 text-2xl',
};

const DOT = {
    online: 'bg-emerald-500',
    'in-game': 'bg-amber-400',
    offline: 'bg-gray-400',
};

const Avatar = ({ name, color = '#5b4cf0', size = 'md', status }) => (
    <span className="relative inline-flex shrink-0">
        <span
            className={`${SIZES[size]} flex items-center justify-center rounded-full font-semibold text-white`}
            style={{ background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 60%, #000))` }}
            aria-hidden="true"
        >
            {initials(name)}
        </span>
        {status && (
            <span className={`absolute -right-0.5 -bottom-0.5 size-3.5 rounded-full border-2 border-surface ${DOT[status]}`}>
                <span className="sr-only">{status}</span>
            </span>
        )}
    </span>
);

export default Avatar;
