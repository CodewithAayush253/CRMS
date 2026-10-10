import React, { useState, useEffect, useRef } from 'react';
import { 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Phone,
  CreditCard,
  Car,
  Sparkles
} from 'lucide-react';
import { Customer } from '../../types';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface WelcomePageProps {
  onLoginSuccess: (user: Customer) => void;
  existingCustomers: Customer[];
  onCustomerCreated: (newCustomer: Customer) => void;
}

const ADMIN_EMAIL = 'av8279@admin.crms';
const ADMIN_PASS = 'Aayush@2005';

export const WelcomePage: React.FC<WelcomePageProps> = ({
  onLoginSuccess,
  existingCustomers,
  onCustomerCreated
}) => {
  // Mode: 'SIGNIN' or 'SIGNUP'
  const [activeTab, setActiveTab] = useState<'SIGNIN' | 'SIGNUP'>('SIGNIN');

  // Sign In state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Sign Up state
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  // Status feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Interactive Character Animation States
  const [focusedField, setFocusedField] = useState<'email' | 'password' | 'other' | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const charactersRef = useRef<HTMLDivElement>(null);

  // High-performance, zero-latency mouse & cursor tracking
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      if (!charactersRef.current) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const normX = Math.max(-1, Math.min(1, (e.clientX - centerX) / (window.innerWidth * 0.35)));
        const normY = Math.max(-1, Math.min(1, (e.clientY - centerY) / (window.innerHeight * 0.35)));
        setMousePos({ x: normX, y: normY });
        return;
      }

      const rect = charactersRef.current.getBoundingClientRect();
      // Calculate center of character faces (slightly above center of SVG)
      const faceCenterX = rect.left + rect.width * 0.5;
      const faceCenterY = rect.top + rect.height * 0.48;

      const deltaX = e.clientX - faceCenterX;
      const deltaY = e.clientY - faceCenterY;
      const dist = Math.hypot(deltaX, deltaY);

      // Gentle angle calculation - eyes look slowly towards the mouse cursor
      const angle = Math.atan2(deltaY, deltaX);
      const intensity = Math.min(1, dist / 250);

      const normX = Math.cos(angle) * intensity;
      const normY = Math.sin(angle) * intensity;

      setMousePos({ x: normX, y: normY });
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // Compute gentle pupil offsets (-12px to +12px) for slow cursor following
  let pupilX = mousePos.x * 12;
  let pupilY = mousePos.y * 10;

  if (focusedField === 'email') {
    // Look down towards the email input
    pupilX = 6;
    pupilY = 9;
  }

  const isPasswordCovered = focusedField === 'password' && !showLoginPassword && !showSignupPassword;
  const isPeeking = focusedField === 'password' && (showLoginPassword || showSignupPassword);

  // Helper for admin user
  const getAdminUser = (): Customer => {
    const found = existingCustomers.find(c => c.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (found) {
      return {
        ...found,
        role: 'ROLE_ADMIN',
        password: ADMIN_PASS,
        name: found.name || 'Aayush (Fleet Admin)',
      };
    }
    return {
      id: 'admin-1',
      name: 'Aayush (Fleet Admin)',
      email: ADMIN_EMAIL,
      phone: '+91 98100 00001',
      licenseNumber: 'DL-01-2015-1122334',
      role: 'ROLE_ADMIN',
      memberSince: '2022-01-10',
      totalRentals: 0,
      loyaltyPoints: 99999,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      password: ADMIN_PASS,
    };
  };

  // Handle Login
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const inputEmail = loginEmail.trim().toLowerCase();

    if (!inputEmail || !loginPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    // 1. Admin Verification
    if (inputEmail === ADMIN_EMAIL.toLowerCase()) {
      if (loginPassword === ADMIN_PASS) {
        setSuccessMessage('Welcome Administrator! Opening Fleet Portal...');
        setIsLoading(true);
        setTimeout(() => {
          onLoginSuccess(getAdminUser());
        }, 400);
        return;
      } else {
        setErrorMessage('Invalid administrator password.');
        return;
      }
    }

    // 2. Customer Verification
    const foundCustomer = existingCustomers.find(c => c.email.toLowerCase() === inputEmail);
    if (!foundCustomer) {
      setErrorMessage('No account found with this email. Please Sign Up.');
      return;
    }

    if (loginPassword !== foundCustomer.password) {
      setErrorMessage('Incorrect password. Please try again.');
      return;
    }

    setSuccessMessage(`Welcome back, ${foundCustomer.name}! Loading portal...`);
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess(foundCustomer);
    }, 400);
  };

  // Handle Sign Up
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const inputEmail = signupEmail.trim().toLowerCase();

    if (!name.trim() || !inputEmail || !phone.trim() || !licenseNumber.trim() || !signupPassword.trim()) {
      setErrorMessage('Please fill in all details to create your account.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (!agreedTerms) {
      setErrorMessage('Please accept the rental terms and license declaration.');
      return;
    }

    const existing = existingCustomers.find(c => c.email.toLowerCase() === inputEmail);
    if (existing) {
      setErrorMessage('An account with this email already exists. Please Log In.');
      return;
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      email: inputEmail,
      phone: phone.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      role: 'ROLE_CUSTOMER',
      memberSince: new Date().toISOString().split('T')[0],
      totalRentals: 0,
      loyaltyPoints: 100,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
      password: signupPassword,
    };

    onCustomerCreated(newCustomer);
    setSuccessMessage(`Account created! Welcome, ${newCustomer.name}. Opening portal...`);
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess(newCustomer);
    }, 500);
  };

  // Google SSO
  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const gEmail = user.email;
      const gName = user.displayName || 'Google Verified User';
      const gPhoto = user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80';

      if (!gEmail) {
        setErrorMessage('Google authentication did not provide an email address.');
        return;
      }

      const existing = existingCustomers.find(c => c.email.toLowerCase() === gEmail.toLowerCase());
      if (existing) {
        const updatedExisting: Customer = {
          ...existing,
          googleUid: user.uid,
          isGoogleAuth: true,
        };
        setSuccessMessage(`Welcome back, ${existing.name}! Google account linked.`);
        setIsLoading(true);
        setTimeout(() => {
          onLoginSuccess(updatedExisting);
        }, 400);
        return;
      }

      const newCustomer: Customer = {
        id: `cust-google-${user.uid || Date.now()}`,
        name: gName,
        email: gEmail,
        phone: user.phoneNumber || '',
        licenseNumber: '',
        role: 'ROLE_CUSTOMER',
        memberSince: new Date().toISOString().split('T')[0],
        totalRentals: 0,
        loyaltyPoints: 150,
        avatarUrl: gPhoto,
        password: 'google-auth-secure',
        googleUid: user.uid,
        isGoogleAuth: true,
        profileCompleted: false,
        dlVerificationStatus: 'UNVERIFIED',
      };

      onCustomerCreated(newCustomer);
      setSuccessMessage(`Google account linked! Welcome, ${newCustomer.name}. Initiating identity verification...`);
      setIsLoading(true);
      setTimeout(() => {
        onLoginSuccess(newCustomer);
      }, 500);
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      const errorMsg = err?.code === 'auth/unauthorized-domain' 
        ? 'Google Login Failed: This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).'
        : `Google Login Failed: ${err?.message || 'Authentication popup was closed or failed.'}`;
      setErrorMessage(errorMsg);
      setIsLoading(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-slate-900 text-slate-800 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#6c28ff] selection:text-white relative overflow-hidden"
    >
      {/* Ambient background glowing orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-ambient-glow pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl animate-ambient-glow pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* Refined Brand Header */}
      <div className="w-full max-w-4xl mb-6 px-1 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-amber-500/20">
            <Car className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white leading-tight">
              Velocity<span className="text-amber-400">CRMS</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Car Rental & Fleet Operations
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-300 font-medium bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/80 backdrop-blur-sm hidden sm:block">
          Enterprise Access Portal
        </div>
      </div>

      {/* Main Login / Sign-up Card with Glassmorphic Effect & Interactive Border */}
      <div className="w-full max-w-4xl bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/80 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[560px] relative z-10 animate-in fade-in zoom-in-95 duration-300 hover:shadow-[0_30px_70px_-15px_rgba(108,40,255,0.18)] transition-all">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: ANIMATED CHARACTERS */}
        {/* ======================================================== */}
        <div className="md:col-span-6 bg-slate-50/70 p-6 sm:p-10 flex flex-col items-center justify-center relative select-none border-b md:border-b-0 md:border-r border-slate-100 overflow-hidden">
          
          {/* SVG Canvas for the 4 animated characters */}
          <div ref={charactersRef} className="w-full max-w-[340px] sm:max-w-[380px] aspect-square relative flex items-center justify-center animate-character-breathe">
            
            <svg 
              viewBox="0 0 400 400" 
              className="w-full h-full drop-shadow-xs overflow-visible"
            >
              {/* Ground Shadow */}
              <ellipse cx="200" cy="365" rx="170" ry="12" fill="#e2e8f0" opacity="0.6" />

              {/* ---------------------------------------------------- */}
              {/* 1. PURPLE TALL CHARACTER (Back Left) */}
              {/* ---------------------------------------------------- */}
              <g 
                className={isPasswordCovered || isPeeking ? "transition-transform duration-300 ease-out will-change-transform" : "transition-none will-change-transform"} 
                style={{ 
                  transformOrigin: '110px 360px',
                  transform: `rotate(${pupilX * 0.28}deg)`
                }}
              >
                {/* Purple Body */}
                <path
                  d="M 60 360 L 60 120 C 60 90, 160 90, 160 120 L 160 360 Z"
                  fill="#5d28e0"
                />

                {/* Purple Character Face */}
                {isPasswordCovered ? (
                  // Closed / Shy Eyes
                  <g className="transition-all duration-300">
                    <path d="M 85 145 Q 95 152 105 145" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                    <path d="M 120 145 Q 130 152 140 145" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                  </g>
                ) : (
                  // Open Interactive Eyes (Fast & Responsive Tracking)
                  <g 
                    className="transition-none will-change-transform" 
                    style={{ transform: `translate(${pupilX * 0.85}px, ${pupilY * 0.85}px)` }}
                  >
                    {/* Left Eye */}
                    <circle cx="95" cy="140" r="5.5" fill="#111827" />
                    {/* Right Eye */}
                    <circle cx="130" cy="140" r="5.5" fill="#111827" />
                    {/* Cute Nose Dot / Snout */}
                    <rect x="110" y="146" width="6" height="12" rx="3" fill="#111827" />
                  </g>
                )}

                {/* Purple Character Hands (Move up to cover eyes when password is focused) */}
                <g 
                  className="transition-all duration-300 ease-out"
                  style={{
                    transform: isPasswordCovered 
                      ? 'translateY(-140px)' 
                      : isPeeking 
                      ? 'translateY(-100px)' 
                      : 'translateY(0px)',
                    opacity: isPasswordCovered || isPeeking ? 1 : 0
                  }}
                >
                  {/* Left Hand */}
                  <ellipse cx="95" cy="280" rx="18" ry="14" fill="#4d1ec5" />
                  {/* Right Hand */}
                  <ellipse cx="130" cy="280" rx="18" ry="14" fill="#4d1ec5" />
                </g>
              </g>

              {/* ---------------------------------------------------- */}
              {/* 2. BLACK CHARACTER (Middle Center/Back) */}
              {/* ---------------------------------------------------- */}
              <g 
                className={isPasswordCovered || isPeeking ? "transition-transform duration-300 ease-out will-change-transform" : "transition-none will-change-transform"} 
                style={{ 
                  transformOrigin: '195px 360px',
                  transform: `rotate(${pupilX * 0.32}deg)`
                }}
              >
                {/* Black Body */}
                <path
                  d="M 145 360 L 145 160 C 145 140, 245 140, 245 160 L 245 360 Z"
                  fill="#18181b"
                />

                {/* Black Character Face */}
                {isPasswordCovered ? (
                  // Sleeping / Shy Closed Arcs
                  <g className="transition-all duration-300">
                    <path d="M 175 185 Q 185 178 195 185" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M 205 185 Q 215 178 225 185" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" fill="none" />
                  </g>
                ) : (
                  // Big Expressive White Eyes Looking Around
                  <g 
                    className="transition-none will-change-transform" 
                    style={{ transform: `translate(${pupilX}px, ${pupilY}px)` }}
                  >
                    {/* Left Eye */}
                    <rect x="175" y="172" width="13" height="13" rx="3" fill="#ffffff" />
                    {/* Right Eye */}
                    <rect x="205" y="172" width="13" height="13" rx="3" fill="#ffffff" />
                  </g>
                )}
              </g>

              {/* ---------------------------------------------------- */}
              {/* 3. YELLOW TALL ROUNDED CHARACTER (Right) */}
              {/* ---------------------------------------------------- */}
              <g 
                className={isPasswordCovered || isPeeking ? "transition-transform duration-300 ease-out will-change-transform" : "transition-none will-change-transform"} 
                style={{ 
                  transformOrigin: '270px 360px',
                  transform: `rotate(${pupilX * 0.38}deg)`
                }}
              >
                {/* Yellow Body */}
                <path
                  d="M 230 360 L 230 220 C 230 180, 310 180, 310 220 L 310 360 Z"
                  fill="#fbb016"
                />

                {/* Yellow Character Face */}
                {isPasswordCovered ? (
                  <path d="M 275 220 Q 285 228 295 220" stroke="#1f2937" strokeWidth="3" strokeLinecap="round" fill="none" />
                ) : (
                  <g 
                    className="transition-none will-change-transform" 
                    style={{ transform: `translate(${pupilX * 1.1}px, ${pupilY * 1.1}px)` }}
                  >
                    {/* Big Eye on Yellow */}
                    <circle cx="282" cy="220" r="5.5" fill="#1f2937" />
                    {/* Smiling Mouth */}
                    <path d="M 268 228 Q 278 235 292 230" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  </g>
                )}
              </g>

              {/* ---------------------------------------------------- */}
              {/* 4. ORANGE DOME CHARACTER (Front Center/Left) */}
              {/* ---------------------------------------------------- */}
              <g 
                className={isPasswordCovered || isPeeking ? "transition-transform duration-300 ease-out will-change-transform" : "transition-none will-change-transform"} 
                style={{ 
                  transformOrigin: '135px 360px',
                  transform: `rotate(${pupilX * 0.22}deg)`
                }}
              >
                {/* Orange Dome Body in Front */}
                <path
                  d="M 30 360 C 30 250, 240 250, 240 360 Z"
                  fill="#ff6b00"
                />

                {/* Orange Character Face */}
                {isPasswordCovered ? (
                  // Happy Eyes ^ ^
                  <g className="transition-all duration-300">
                    <path d="M 130 300 Q 138 292 146 300" stroke="#111827" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <path d="M 154 300 Q 162 292 170 300" stroke="#111827" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <ellipse cx="150" cy="312" rx="4" ry="3" fill="#111827" />
                  </g>
                ) : (
                  <g 
                    className="transition-none will-change-transform" 
                    style={{ transform: `translate(${pupilX * 0.9}px, ${pupilY * 0.9}px)` }}
                  >
                    {/* Left Eye */}
                    <circle cx="138" cy="298" r="4.5" fill="#111827" />
                    {/* Right Eye */}
                    <circle cx="162" cy="298" r="4.5" fill="#111827" />
                    {/* Happy Smile */}
                    <path d="M 144 310 Q 150 316 156 310" stroke="#111827" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  </g>
                )}
              </g>

            </svg>

          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: CLEAN MINIMALIST LOGIN / SIGN UP FORM */}
        {/* ======================================================== */}
        <div className="md:col-span-6 bg-white/95 backdrop-blur-xl p-6 sm:p-10 lg:p-12 flex flex-col justify-between border-l border-slate-100/80">
          
          <div>
            {/* Top Purple Spring / Helix Logo matching the Behance reference */}
            <div className="flex justify-center mb-4">
              <svg width="36" height="36" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path 
                  d="M19 6C13.5 6 9 9 9 12C9 15 13.5 17 19 17C24.5 17 29 19 29 22C29 25 24.5 28 19 28C13.5 28 9 26 9 23" 
                  stroke="#6c28ff" 
                  strokeWidth="5" 
                  strokeLinecap="round" 
                />
                <circle cx="28" cy="10" r="3.5" fill="#ff6b00" />
              </svg>
            </div>

            {/* Heading */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'SIGNIN' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-normal">
                {activeTab === 'SIGNIN' 
                  ? 'Please enter your account details' 
                  : 'Register for self-drive vehicle access'}
              </p>
            </div>

            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {activeTab === 'SIGNIN' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                
                {/* Email Input (Clean Underline / Border matching reference) */}
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Example@Gmail.Com"
                    className="w-full pb-2 pt-3 px-1 bg-transparent border-b-2 border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6c28ff] transition-colors"
                  />
                </div>

                {/* Password Input with Eye Toggle */}
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••••••"
                    className="w-full pb-2 pt-3 px-1 pr-10 bg-transparent border-b-2 border-slate-200 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6c28ff] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-1 bottom-3 text-slate-400 hover:text-slate-700 transition-colors"
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-[#6c28ff] focus:ring-[#6c28ff]"
                    />
                    <span>Remember Me</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setErrorMessage('For admin password recovery, contact system administrator.')}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Primary Purple Login Pill Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 py-3 px-6 rounded-full bg-[#6c28ff] hover:bg-[#5b1ee6] text-white text-sm font-bold tracking-wide shadow-md shadow-[#6c28ff]/25 hover:shadow-lg hover:shadow-[#6c28ff]/35 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Verifying...' : 'Login'}</span>
                </button>

                {/* Google Login Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2.5 transition-all shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Login With Google</span>
                </button>

              </form>
            )}

            {/* TAB 2: SIGN UP FORM */}
            {activeTab === 'SIGNUP' && (
              <form onSubmit={handleSignUp} className="space-y-3">
                
                <div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField('other')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Full Legal Name"
                    className="w-full pb-1.5 pt-2 px-1 bg-transparent border-b-2 border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6c28ff] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Email Address"
                      className="w-full pb-1.5 pt-2 px-1 bg-transparent border-b-2 border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6c28ff] transition-colors"
                    />
                  </div>
                  <div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setFocusedField('other')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="+91 Phone Number"
                      className="w-full pb-1.5 pt-2 px-1 bg-transparent border-b-2 border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6c28ff] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    onFocus={() => setFocusedField('other')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Driving License (DL-04-2022-1234567)"
                    className="w-full pb-1.5 pt-2 px-1 bg-transparent border-b-2 border-slate-200 text-xs font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6c28ff] transition-colors"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Password (min 6 characters)"
                    className="w-full pb-1.5 pt-2 px-1 pr-8 bg-transparent border-b-2 border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6c28ff] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-1 bottom-2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-500 select-none">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="rounded border-slate-300 text-[#6c28ff] focus:ring-[#6c28ff]"
                    />
                    <span>I declare that I hold a valid Driving License</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-3 py-2.5 px-6 rounded-full bg-[#6c28ff] hover:bg-[#5b1ee6] text-white text-xs font-bold tracking-wide shadow-md shadow-[#6c28ff]/25 transition-all flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? 'Creating Profile...' : 'Sign Up'}</span>
                </button>

              </form>
            )}

          </div>

          {/* Bottom Switcher: "Don't Have An Account? Sign Up" */}
          <div className="text-center pt-6 text-xs text-slate-500">
            {activeTab === 'SIGNIN' ? (
              <p>
                Don't Have An Account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('SIGNUP');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-[#6c28ff] hover:underline ml-1"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already Have An Account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('SIGNIN');
                    setErrorMessage(null);
                  }}
                  className="font-bold text-[#6c28ff] hover:underline ml-1"
                >
                  Login
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
