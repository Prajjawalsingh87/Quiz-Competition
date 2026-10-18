import React from 'react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

const Footer = () => (
    <footer className="mt-20 border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted sm:flex-row">
            <Logo small />
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2" aria-label="Footer">
                <Link to="/quiz" className="hover:text-fg">Play</Link>
                <Link to="/history" className="hover:text-fg">History</Link>
                <Link to="/friends" className="hover:text-fg">Friends</Link>
                <Link to="/search" className="hover:text-fg">Search</Link>
            </nav>
            <p>© {new Date().getFullYear()} AI Quiz</p>
        </div>
    </footer>
);

export default Footer;
