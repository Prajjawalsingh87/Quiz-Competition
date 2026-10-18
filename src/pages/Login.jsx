import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowLeft, KeyRound, ShieldCheck, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import useDocumentTitle from '../utils/useDocumentTitle';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Login = ({ onLogin }) => {
    useDocumentTitle('Sign in');
    const [step, setStep] = useState(1); // 1: Credentials, 2: OTP
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleCredentialsSubmit = (e) => {
        e.preventDefault();
        if (!EMAIL_PATTERN.test(email.trim())) {
            setError('Please enter a valid email address.');
            return;
        }
        if (!password) {
            setError('Please enter your password.');
            return;
        }
        setError('');
        setLoading(true);
        // Simulate sending OTP
        setTimeout(() => {
            setLoading(false);
            setStep(2);
        }, 600);
    };

    const handleOtpSubmit = (e) => {
        e.preventDefault();
        if (!/^\d{4,6}$/.test(otp)) {
            setError('Enter the 4–6 digit code from your email.');
            return;
        }
        setError('');
        setLoading(true);
        // Simulate OTP verification
        setTimeout(() => {
            onLogin(email.trim());
            navigate('/');
        }, 500);
    };

    const errorBox = error && (
        <p className="flex items-center gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger" role="alert">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> {error}
        </p>
    );

    return (
        <div className="flex min-h-[70vh] items-center justify-center">
            <div className="card w-full max-w-md animate-fade-up p-6 shadow-lift sm:p-8">

                <div className="mb-8 text-center">
                    <div className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl bg-brand-soft text-brand-ink">
                        {step === 1 ? <img src="/favicon.svg" alt="" className="size-9" /> : <ShieldCheck className="size-7" aria-hidden="true" />}
                    </div>
                    <h1 className="text-2xl font-bold sm:text-3xl">
                        {step === 1 ? 'Welcome back' : 'Check your inbox'}
                    </h1>
                    <p className="mt-2 text-muted">
                        {step === 1 ? 'Sign in to save your scores and play with friends.' : <>We sent a code to <span className="font-medium break-all text-fg">{email}</span></>}
                    </p>
                </div>

                {/* Step indicator */}
                <div className="mb-6 flex gap-2" aria-hidden="true">
                    <span className="h-1.5 flex-1 rounded-full bg-brand" />
                    <span className={`h-1.5 flex-1 rounded-full transition-colors ${step === 2 ? 'bg-brand' : 'bg-surface-2'}`} />
                </div>

                {step === 1 ? (
                    <form onSubmit={handleCredentialsSubmit} noValidate className="space-y-5">
                        <div>
                            <label htmlFor="email" className="label">Email address</label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                                    className="input pl-10"
                                    placeholder="name@example.com"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="label">Password</label>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                    className="input pr-11 pl-10"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
                                >
                                    {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                                </button>
                            </div>
                        </div>

                        {errorBox}

                        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
                            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
                            {loading ? 'Sending code…' : 'Get OTP code'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleOtpSubmit} noValidate className="space-y-5">
                        <div>
                            <label htmlFor="otp" className="label">One-time code</label>
                            <input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                value={otp}
                                onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
                                className="input h-14 text-center font-mono text-2xl font-bold tracking-[0.5em]"
                                placeholder="••••••"
                                maxLength={6}
                                required
                                autoFocus
                            />
                            <p className="mt-2 text-xs text-muted">Demo mode: any 4–6 digit code works.</p>
                        </div>

                        {errorBox}

                        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
                            {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                            {loading ? 'Verifying…' : 'Verify & sign in'}
                        </button>

                        <button
                            type="button"
                            onClick={() => { setStep(1); setOtp(''); setError(''); }}
                            className="btn btn-ghost w-full"
                        >
                            Change email / resend code
                        </button>
                    </form>
                )}

                <div className="mt-6 border-t border-line pt-5 text-center">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg">
                        <ArrowLeft className="size-4" aria-hidden="true" /> Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
