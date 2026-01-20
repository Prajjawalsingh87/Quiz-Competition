import React, { useState } from 'react';
import { Menu, X, BrainCircuit, Bell, User, LogOut, LogIn } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Navbar = ({ links = [], isLoggedIn, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed w-full z-50 top-0 start-0 border-b border-white/20 bg-white/70 backdrop-blur-xl dark:bg-gray-900/70 dark:border-gray-800 transition-all duration-300 shadow-sm">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">

                {/* LEFT: Brand/Logo Area */}
                <NavLink to="/" className="flex items-center space-x-2 rtl:space-x-reverse group">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl text-white shadow-lg group-hover:shadow-blue-500/30 transition-shadow duration-300">
                        <BrainCircuit className="w-6 h-6" />
                    </div>
                    <span className="self-center text-2xl font-bold whitespace-nowrap bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent hidden sm:block">
                        AI Quiz
                    </span>
                </NavLink>

                {/* CENTER: Links (Desktop) */}
                <div className="hidden md:block">
                    <ul className="flex space-x-2">
                        {links.map((link, index) => (
                            <li key={index}>
                                <NavLink
                                    to={link.path || '#'}
                                    className={({ isActive }) => `
                    block py-2 px-4 rounded-full text-sm font-medium transition-all duration-200
                    ${isActive
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                            : 'text-gray-700 hover:bg-white/50 hover:text-blue-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'}
                    `}
                                >
                                    {link.name}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* RIGHT: Actions + Mobile Menu Button */}
                <div className="flex items-center space-x-3 md:space-x-4 rtl:space-x-reverse">

                    {/* Notification Bell (Only show if logged in? Optionally always show) */}
                    <button type="button" className="relative p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition">
                        <span className="sr-only">View notifications</span>
                        <Bell className="w-6 h-6" />
                        <div className="absolute inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-1 -end-1 dark:border-gray-900">
                            3
                        </div>
                    </button>

                    {/* User Profile / Auth */}
                    {isLoggedIn ? (
                        <div className="flex items-center gap-2">
                            <button className="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 p-1">
                                <span className="sr-only">Open user menu</span>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold">
                                    P
                                </div>
                            </button>
                            {/* Logout Button */}
                            <button
                                onClick={onLogout}
                                className="hidden sm:flex items-center p-2 text-gray-500 rounded-full hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition"
                                title="Logout"
                            >
                                <LogOut className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <NavLink
                            to="/login"
                            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 flex items-center gap-2"
                        >
                            <LogIn className="w-4 h-4" />
                            <span className="hidden sm:inline">Login</span>
                        </NavLink>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        type="button"
                        className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 transition"
                        aria-controls="navbar-default"
                        aria-expanded={isOpen}
                    >
                        <span className="sr-only">Open main menu</span>
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu (Dropdown) */}
                <div className={`${isOpen ? 'block' : 'hidden'} w-full md:hidden mt-4 border-t border-gray-100 dark:border-gray-800 pt-4`} id="navbar-default">
                    <ul className="flex flex-col space-y-2">
                        {links.map((link, index) => (
                            <li key={index}>
                                <NavLink
                                    to={link.path || '#'}
                                    onClick={() => setIsOpen(false)}
                                    className={({ isActive }) => `
                    block py-2 px-4 rounded-lg font-medium transition-all duration-200
                    ${isActive
                                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}
                  `}
                                >
                                    {link.name}
                                </NavLink>
                            </li>
                        ))}
                        {/* Mobile Logout if logged in */}
                        {isLoggedIn ? (
                            <li>
                                <button
                                    onClick={() => { onLogout(); setIsOpen(false); }}
                                    className="w-full text-left block py-2 px-4 rounded-lg font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all"
                                >
                                    Logout
                                </button>
                            </li>
                        ) : (
                            <li>
                                <NavLink
                                    to="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full text-left block py-2 px-4 rounded-lg font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-all"
                                >
                                    Login
                                </NavLink>
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
