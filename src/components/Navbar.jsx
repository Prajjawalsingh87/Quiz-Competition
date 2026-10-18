import React, { useEffect, useState } from 'react';
import { Menu, X, LogOut, LogIn } from 'lucide-react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import Avatar from './Avatar';

const Navbar = ({ links = [], user, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();

    // Close the mobile menu whenever the route changes.
    const [menuPath, setMenuPath] = useState(location.pathname);
    if (menuPath !== location.pathname) {
        setMenuPath(location.pathname);
        setIsOpen(false);
    }

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 4);
        const onKey = (e) => e.key === 'Escape' && setIsOpen(false);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('keydown', onKey);
        };
    }, []);

    const displayName = user?.name || user?.email?.split('@')[0];

    return (
        <nav
            className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${scrolled || isOpen ? 'border-line bg-surface/85' : 'border-transparent bg-bg/60'}`}
            aria-label="Main"
        >
            <div className="container-page flex h-16 items-center justify-between gap-4">
                <Logo />

                {/* Desktop links */}
                <ul className="hidden items-center gap-1 lg:flex">
                    {links.map((link) => (
                        <li key={link.path}>
                            <NavLink
                                to={link.path}
                                end={link.path === '/'}
                                className={({ isActive }) =>
                                    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-brand-soft text-brand-ink'
                                        : 'text-muted hover:bg-surface-2 hover:text-fg'}`
                                }
                            >
                                <link.icon className="hidden size-4 xl:block" aria-hidden="true" />
                                {link.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {user ? (
                        <>
                            <Link to="/profile" className="flex items-center gap-2 rounded-full p-0.5 pr-1 transition hover:bg-surface-2 sm:pr-3" title="Your profile">
                                <Avatar name={displayName} size="sm" />
                                <span className="hidden max-w-32 truncate text-sm font-medium sm:block">{displayName}</span>
                            </Link>
                            <button
                                type="button"
                                onClick={onLogout}
                                className="btn btn-ghost hidden size-9 px-0 sm:inline-flex"
                                title="Log out"
                            >
                                <LogOut className="size-4" aria-hidden="true" />
                                <span className="sr-only">Log out</span>
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary btn-sm">
                            <LogIn className="size-4" aria-hidden="true" />
                            Sign in
                        </Link>
                    )}

                    <button
                        type="button"
                        onClick={() => setIsOpen((open) => !open)}
                        className="btn btn-ghost size-10 px-0 lg:hidden"
                        aria-controls="mobile-menu"
                        aria-expanded={isOpen}
                    >
                        <span className="sr-only">{isOpen ? 'Close menu' : 'Open menu'}</span>
                        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <div id="mobile-menu" className={`${isOpen ? 'block' : 'hidden'} border-t border-line lg:hidden`}>
                <ul className="container-page grid grid-cols-2 gap-2 py-4">
                    {links.map((link) => (
                        <li key={link.path}>
                            <NavLink
                                to={link.path}
                                end={link.path === '/'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-brand-soft text-brand-ink'
                                        : 'text-fg hover:bg-surface-2'}`
                                }
                            >
                                <link.icon className="size-[18px]" aria-hidden="true" />
                                {link.name}
                            </NavLink>
                        </li>
                    ))}
                    {user && (
                        <li>
                            <button
                                type="button"
                                onClick={onLogout}
                                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                            >
                                <LogOut className="size-[18px]" aria-hidden="true" />
                                Log out
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
