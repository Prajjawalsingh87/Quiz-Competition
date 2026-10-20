import { Download, Moon, Sun } from 'lucide-react';
import useInstallPrompt from './useInstallPrompt';
import useTheme from './useTheme';

// Compact icon button for the top bar (from the sm breakpoint; label on wide screens).
export function InstallButton() {
    const { canInstall, install } = useInstallPrompt();
    if (!canInstall) return null;
    return (
        <button
            type="button"
            onClick={install}
            className="btn btn-ghost hidden size-10 px-0 sm:inline-flex 2xl:w-auto 2xl:border 2xl:border-line 2xl:bg-surface 2xl:px-3"
            title="Install app"
        >
            <Download className="size-[18px]" aria-hidden="true" />
            <span className="sr-only 2xl:not-sr-only">Install app</span>
        </button>
    );
}

// Full-width entry for the mobile menu.
export function InstallMenuItem() {
    const { canInstall, install } = useInstallPrompt();
    if (!canInstall) return null;
    return (
        <li>
            <button
                type="button"
                onClick={install}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-fg transition-colors hover:bg-surface-2"
            >
                <Download className="size-[18px]" aria-hidden="true" />
                Install app
            </button>
        </li>
    );
}

export function ThemeToggle() {
    const { theme, toggle } = useTheme();
    const next = theme === 'dark' ? 'light' : 'dark';
    return (
        <button
            type="button"
            onClick={toggle}
            className="btn btn-ghost size-10 px-0"
            aria-label={`Switch to ${next} theme`}
            title={`Switch to ${next} theme`}
        >
            {theme === 'dark' ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
        </button>
    );
}
