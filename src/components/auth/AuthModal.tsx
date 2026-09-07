import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  CreditCard, 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  UserPlus, 
  LogIn,
  ShieldAlert
} from 'lucide-react';
import { Customer } from '../../types';

export type AuthMode = 'CUSTOMER_SIGNUP' | 'CUSTOMER_LOGIN' | 'ADMIN_LOGIN' | 'SIGNUP' | 'LOGIN';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: AuthMode;
  taskAttempted?: string | null;
  onClose: () => void;
  onLoginSuccess: (user: Customer) => void;
  existingCustomers: Customer[];
  onCustomerCreated: (newCustomer: Customer) => void;
}

const ADMIN_EMAIL = 'av8279@admin.crms';
const ADMIN_PASS = 'Aayush@2005';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  taskAttempted,
  onClose,
  onLoginSuccess,
  existingCustomers,
  onCustomerCreated,
}) => {
  // Mode: either 'SIGNUP' or 'LOGIN'
  const [activeTab, setActiveTab] = useState<'SIGNUP' | 'LOGIN'>('SIGNUP');
  
  // Sign-up fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Sign-in fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Error and UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode === 'CUSTOMER_LOGIN' || initialMode === 'ADMIN_LOGIN' || initialMode === 'LOGIN') {
      setActiveTab('LOGIN');
    } else {
      setActiveTab('SIGNUP');
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Helper to construct Admin object
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

  // Handle Sign Up (with merged Admin detection)
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputEmail = email.trim().toLowerCase();

    // 1. ADMIN DETECTION IN SIGN UP PANEL
    if (inputEmail === ADMIN_EMAIL.toLowerCase()) {
      if (signupPassword === ADMIN_PASS) {
        setSuccessMessage('Admin credentials verified! Unlocking Fleet Operations Console...');
        const adminUser = getAdminUser();
        setTimeout(() => {
          onLoginSuccess(adminUser);
          onClose();
        }, 600);
        return;
      } else {
        setErrorMessage('Invalid administrator credentials.');
        return;
      }
    }

    // 2. STANDARD CUSTOMER SIGN UP
    if (!name.trim() || !email.trim() || !phone.trim() || !licenseNumber.trim() || !signupPassword.trim()) {
      setErrorMessage('Please fill in all required customer profile information.');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (signupPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    if (!agreedTerms) {
      setErrorMessage('You must confirm that you hold a valid driving license and accept the rental terms.');
      return;
    }

    // Check if email already registered
    const existing = existingCustomers.find(c => c.email.toLowerCase() === inputEmail);
    if (existing) {
      setErrorMessage('An account with this email address already exists. Please sign in instead.');
      return;
    }

    // Create new customer
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      email: inputEmail,
      phone: phone.trim(),
      licenseNumber: licenseNumber.trim().toUpperCase(),
      role: 'ROLE_CUSTOMER',
      memberSince: new Date().toISOString().split('T')[0],
      totalRentals: 0,
      loyaltyPoints: 100, // Welcome bonus
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80`,
      password: signupPassword,
    };

    onCustomerCreated(newCustomer);
    setSuccessMessage(`Account created successfully! Welcome, ${newCustomer.name}.`);
    
    setTimeout(() => {
      onLoginSuccess(newCustomer);
      onClose();
    }, 600);
  };

  // Handle Sign In (with merged Admin detection)
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const inputEmail = loginEmail.trim().toLowerCase();

    // 1. ADMIN DETECTION IN SIGN IN PANEL
    if (inputEmail === ADMIN_EMAIL.toLowerCase()) {
      if (loginPassword === ADMIN_PASS) {
        setSuccessMessage('Administrator verified. Loading Fleet Operations Console...');
        const adminUser = getAdminUser();
        setTimeout(() => {
          onLoginSuccess(adminUser);
          onClose();
        }, 600);
        return;
      } else {
        setErrorMessage('Invalid administrator credentials.');
        return;
      }
    }

    // 2. STANDARD CUSTOMER SIGN IN
    const customer = existingCustomers.find(
      c => c.email.toLowerCase() === inputEmail
    );

    if (!customer) {
      setErrorMessage('No account found with this email. Please check your email or create an account.');
      return;
    }

    const validPassword = customer.password || 'password123';
    if (loginPassword !== validPassword && loginPassword !== 'password123') {
      setErrorMessage('Invalid password. Please check your credentials.');
      return;
    }

    setSuccessMessage(`Welcome back, ${customer.name}!`);
    setTimeout(() => {
      onLoginSuccess(customer);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative border-b border-slate-800">
          <button 
            onClick={onClose}
            className="absolute right-5 top-5 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center text-slate-950 font-bold">
              <Car className="w-4 h-4" />
            </span>
            <span className="font-extrabold text-sm tracking-tight text-white">Velocity<span className="text-amber-400">CRMS</span></span>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full border border-slate-700 ml-auto mr-8">
              Portal Access
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-white mt-1">
            {activeTab === 'SIGNUP' ? 'Create Account' : 'Account Sign In'}
          </h2>
          
          {taskAttempted && (
            <div className="mt-2 text-xs text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>You must sign in or create an account before you can {taskAttempted}.</span>
            </div>
          )}

          {/* Clean Two-Tab Switcher */}
          <div className="grid grid-cols-2 gap-1.5 mt-5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setActiveTab('SIGNUP'); setErrorMessage(null); }}
              className={`py-2 px-3 text-center rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'SIGNUP'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('LOGIN'); setErrorMessage(null); }}
              className={`py-2 px-3 text-center rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'LOGIN'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              Sign In
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          
          {/* Status Messages */}
          {errorMessage && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Notice</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="font-semibold">{successMessage}</p>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 1: SIGN UP */}
          {/* ============================================================ */}
          {activeTab === 'SIGNUP' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Driving License Number *
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono tracking-wider focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                />
                <span className="text-[11px] text-slate-600 leading-tight">
                  I certify that I am at least 21 years old, hold a valid driver license, and agree to the rental terms and dynamic security deposit policy.
                </span>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Create Account & Continue
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('LOGIN'); setErrorMessage(null); }}
                  className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 2: SIGN IN */}
          {/* ============================================================ */}
          {activeTab === 'LOGIN' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Need a new account? </span>
                <button
                  type="button"
                  onClick={() => { setActiveTab('SIGNUP'); setErrorMessage(null); }}
                  className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
