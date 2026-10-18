import React from 'react';
import { Link } from 'react-router-dom';

const Logo = ({ small = false }) => (
    <Link to="/" className="group flex items-center gap-2.5 rounded-lg" aria-label="AI Quiz home">
        <img src="/favicon.svg" alt="" className={`${small ? 'size-7' : 'size-9'} transition-transform duration-300 group-hover:-rotate-6`} />
        <span className={`font-display font-extrabold tracking-tight text-fg ${small ? 'text-base' : 'text-lg'}`}>
            AI Quiz
        </span>
    </Link>
);

export default Logo;
