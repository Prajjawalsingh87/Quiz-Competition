import React from 'react';
import { Globe2, FlaskConical, Code2, Landmark, Map, Sparkles } from 'lucide-react';

const ICONS = { globe: Globe2, flask: FlaskConical, code: Code2, landmark: Landmark, map: Map };

const TopicIcon = ({ topic, size = 'md' }) => {
    const Icon = ICONS[topic?.icon] || Sparkles;
    const box = size === 'lg' ? 'size-12 rounded-2xl' : size === 'sm' ? 'size-9 rounded-lg' : 'size-11 rounded-xl';
    const icon = size === 'lg' ? 'size-6' : size === 'sm' ? 'size-4' : 'size-5';
    return (
        <span
            className={`${box} flex shrink-0 items-center justify-center`}
            style={{ color: topic?.color, backgroundColor: `color-mix(in oklab, ${topic?.color} 14%, transparent)` }}
            aria-hidden="true"
        >
            <Icon className={icon} />
        </span>
    );
};

export default TopicIcon;
