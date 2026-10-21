import React from 'react';
import { Globe2, FlaskConical, Code2, Landmark, Map, Sparkles, RotateCcw, Shuffle } from 'lucide-react';

const ICONS = { globe: Globe2, flask: FlaskConical, code: Code2, landmark: Landmark, map: Map, review: RotateCcw, mixed: Shuffle };

const TopicIcon = ({ topic, size = 'md' }) => {
    const Icon = ICONS[topic?.icon] || Sparkles;
    const box = { lg: 'size-12 rounded-2xl', sm: 'size-9 rounded-lg', xs: 'size-5 rounded-md' }[size] || 'size-11 rounded-xl';
    const icon = { lg: 'size-6', sm: 'size-4', xs: 'size-3' }[size] || 'size-5';
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
