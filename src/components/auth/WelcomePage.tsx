import React, { useState } from 'react';
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
  Car,
  KeyRound,
  FileCheck,
  MapPin,
  Clock,
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

  // Quick fill admin credentials for testing
  const handleFillAdminCredentials = () => {
    setActiveTab('SIGNIN');
    setLoginEmail(ADMIN_EMAIL);
    setLoginPassword(ADMIN_PASS);
    setErrorMessage(null);
  };

  // Quick fill customer demo credentials
  const handleFillCustomerDemo = () => {
    const demoCust = existingCustomers.find(c => c.role === 'ROLE_CUSTOMER');
    if (demoCust) {
      setActiveTab('SIGNIN');
      setLoginEmail(demoCust.email);
      setLoginPassword(demoCust.password || 'password123');
      setErrorMessage(null);
    }
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-blue-600 selection:text-white relative">
      
      {/* Brand Header */}
      <div className="w-full max-w-5xl mb-6 px-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
              Velocity<span className="text-blue-400">CRMS</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Enterprise Car Rental & Fleet Operations
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium bg-slate-900 px-3.5 py-1.5 rounded-full border border-slate-800 hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Fleet Network Online</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-5xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: ENTERPRISE FLEET SHOWCASE */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800 relative">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Certified Commercial Mobility</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
              Premium Self-Drive Fleet Management
            </h2>
            <p className="text-sm text-slate-400 mt-3 leading-relaxed">
              Book verified sedans, luxury SUVs, and commercial vehicles with instant digital driver license check and live GPS radar telematics.
            </p>

            {/* Feature Points */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0 mt-0.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Instant KYC & License Verification</h4>
                  <p className="text-[11px] text-slate-400">Government driver license OCR matching with zero paper delays.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Airport & City Hub Pickups</h4>
                  <p className="text-[11px] text-slate-400">Available at Terminal 3 IGI Airport, Aerocity, and major metro hubs.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700/80 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Telematics & Anti-Theft Radar</h4>
                  <p className="text-[11px] text-slate-400">24/7 geo-fencing, speed governance, and remote secure immobilization.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Access Badges */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-400 font-medium mb-2.5">
              Testing or Evaluation? Use quick credentials:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleFillAdminCredentials}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-amber-300 transition-colors flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>Fill Fleet Admin</span>
              </button>
              <button
                type="button"
                onClick={handleFillCustomerDemo}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-blue-300 transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Fill Customer Demo</span>
              </button>
            </div>
          </div>

        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: PROFESSIONAL LOGIN / SIGN UP FORM */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 bg-slate-900 p-8 sm:p-12 flex flex-col justify-between">
          
          <div>
            {/* Tab Navigation: Sign In vs Sign Up */}
            <div className="flex border-b border-slate-800 mb-8">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('SIGNIN');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`pb-3 text-sm font-semibold transition-colors relative mr-6 ${
                  activeTab === 'SIGNIN'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Sign In to Account
                {activeTab === 'SIGNIN' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('SIGNUP');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`pb-3 text-sm font-semibold transition-colors relative ${
                  activeTab === 'SIGNUP'
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Create New Profile
                {activeTab === 'SIGNUP' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
                )}
              </button>
            </div>

            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* TAB 1: SIGN IN FORM */}
            {activeTab === 'SIGNIN' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@example.com or av8279@admin.crms"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setErrorMessage('For administrator credentials assistance, contact system admin.')}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center text-xs text-slate-400 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Keep me signed in on this device</span>
                  </label>
                </div>

                {/* Submit Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
                </button>

                {/* Divider */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-slate-800 w-full"></div>
                  <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                    or
                  </span>
                </div>

                {/* Google SSO */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 text-xs font-semibold flex items-center justify-center gap-3 transition-colors"
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
                  <span>Continue with Google</span>
                </button>

              </form>
            )}

            {/* TAB 2: SIGN UP FORM */}
            {activeTab === 'SIGNUP' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Vikramaditya Singh"
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="vikram@example.com"
                        className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Driving License Number
                  </label>
                  <div className="relative">
                    <FileCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="DL-04-2022-1234567"
                      className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-mono uppercase text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showSignupPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-10 pr-10 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                    />
                    <span>I declare that I hold a valid Indian Driving License</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
                </button>

              </form>
            )}

          </div>

          {/* Bottom Switcher */}
          <div className="text-center pt-6 text-xs text-slate-400 border-t border-slate-800/80 mt-6">
            {activeTab === 'SIGNIN' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('SIGNUP');
                    setErrorMessage(null);
                  }}
                  className="font-semibold text-blue-400 hover:text-blue-300 ml-1 transition-colors"
                >
                  Sign Up Here
                </button>
              </p>
            ) : (
              <p>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('SIGNIN');
                    setErrorMessage(null);
                  }}
                  className="font-semibold text-blue-400 hover:text-blue-300 ml-1 transition-colors"
                >
                  Sign In Here
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
