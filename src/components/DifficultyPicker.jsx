import React from 'react';
import { DIFFICULTIES } from '../shared/game';

// Segmented control: Easy / Medium / Hard (timer length + base points).
const DifficultyPicker = ({ value, onChange, label = 'Difficulty', name, includeAll = false }) => {
    const options = [
        ...(includeAll ? [{ id: 'all', label: 'All', hint: null }] : []),
        ...Object.values(DIFFICULTIES).map((d) => ({ id: d.id, label: d.label, hint: `${d.seconds}s` })),
    ];
    return (
        <div role="radiogroup" aria-label={label} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl border border-line bg-surface-2 p-1">
            {options.map((o) => {
                const active = o.id === value;
                return (
                    <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        name={name}
                        onClick={() => onChange(o.id)}
                        className={`flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold transition ${active
                            ? 'bg-surface text-fg shadow-card ring-1 ring-line'
                            : 'text-muted hover:text-fg'}`}
                    >
                        {o.label}
                        {o.hint && <span className={`text-xs font-medium ${includeAll ? 'hidden sm:inline' : ''} ${active ? 'text-brand-ink' : 'text-muted'}`}>{o.hint}</span>}
                    </button>
                );
            })}
        </div>
    );
};

export default DifficultyPicker;
