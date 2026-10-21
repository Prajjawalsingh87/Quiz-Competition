import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const LETTERS = ['A', 'B', 'C', 'D'];

const optionClass = (state) => {
    switch (state) {
        case 'correct':
            return 'border-success bg-success-soft ring-2 ring-success/25';
        case 'wrong':
            return 'border-danger bg-danger-soft ring-2 ring-danger/25 animate-shake';
        case 'selected':
            return 'border-brand bg-brand-soft ring-2 ring-brand/25';
        case 'dimmed':
            return 'border-line opacity-60';
        default:
            return 'border-line bg-surface hover:border-brand/50 hover:bg-surface-2';
    }
};

const badgeClass = (state) => {
    switch (state) {
        case 'correct':
            return 'bg-success text-white';
        case 'wrong':
            return 'bg-danger text-white';
        case 'selected':
            return 'bg-brand text-white';
        default:
            return 'bg-surface-2 text-muted group-hover:text-fg';
    }
};

// One answer button. state: idle | selected | correct | wrong | dimmed.
const AnswerOption = ({ index, label, state, checked, disabled, onSelect }) => (
    <button
        type="button"
        role="radio"
        aria-checked={checked}
        disabled={disabled}
        onClick={onSelect}
        className={`group flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-[15px] font-medium transition-all duration-150 disabled:cursor-default ${optionClass(state)}`}
    >
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors ${badgeClass(state)}`}>
            {LETTERS[index]}
        </span>
        <span className="flex-1">{label}</span>
        {state === 'correct' && <CheckCircle2 className="size-5 shrink-0 text-success" aria-label="Correct answer" />}
        {state === 'wrong' && <XCircle className="size-5 shrink-0 text-danger" aria-label="Your answer" />}
    </button>
);

export default AnswerOption;
