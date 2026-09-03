import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  CreditCard, 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  UserPlus, 
  LogIn,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { Customer, UserRole } from '../../types';

export type AuthMode = 'CUSTOMER_SIGNUP' | 'CUSTOMER_LOGIN' | 'ADMIN_LOGIN';

interface AuthModalProps {
  isOpen: boolean;
  initialMode: AuthMode;
  taskAttempted?: string | null;
  onClose: () => void;
  onLoginSuccess: (user: Customer) => void;
  existingCustomers: Customer[];
  onCustomerCreated: (newCustomer: Customer) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode,
  taskAttempted,
  onClose,
  onLoginSuccess,
  existingCustomers,
  onCustomerCreated,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  
  // Customer Sign-up fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Customer Sign-in fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Admin Login fields
  const [adminEmail, setAdminEmail] = useState('admin@crms-enterprise.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPin, setAdminPin] = useState('9821');

  // Error and UI state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  // Handle Customer Sign Up
  const handleCustomerSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !phone.trim() || !licenseNumber.trim() || !signupPassword.trim()) {
      setErrorMessage('Please fill in all required profile information.');
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
      setErrorMessage('You must confirm that you hold a valid driver license and agree to rental terms.');
      return;
    }

    // Check if email already registered
    const existing = existingCustomers.find(c => c.email.toLowerCase() === email.trim().toLowerCase());
    if (existing) {
      setErrorMessage('An account with this email address already exists. Please log in instead.');
      return;
    }

    // Create new customer
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
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
    setSuccessMessage(`Account created successfully! Welcome to Velocity CRMS, ${newCustomer.name}.`);
    
    setTimeout(() => {
      onLoginSuccess(newCustomer);
      onClose();
    }, 800);
  };

  // Handle Customer Login
  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const customer = existingCustomers.find(
      c => c.email.toLowerCase() === loginEmail.trim().toLowerCase()
    );

    if (!customer) {
      setErrorMessage('No customer account found with this email. Please create an account first.');
      return;
    }

    if (customer.role === 'ROLE_ADMIN') {
      setErrorMessage('This is an administrative account. Please use the Admin Portal Login.');
      return;
    }

    // Validate password (allow demo pass 'password123' if not set)
    const validPassword = customer.password || 'password123';
    if (loginPassword !== validPassword && loginPassword !== 'password123') {
      setErrorMessage('Invalid customer password. Try "password123" for demo accounts.');
      return;
    }

    setSuccessMessage(`Welcome back, ${customer.name}!`);
    setTimeout(() => {
      onLoginSuccess(customer);
      onClose();
    }, 600);
  };

  // Handle Admin Login (Strict Protection)
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const adminUser = existingCustomers.find(
      c => c.email.toLowerCase() === adminEmail.trim().toLowerCase()
    );

    // If user entered a customer email
    if (adminUser && adminUser.role !== 'ROLE_ADMIN') {
      setErrorMessage('Access Denied: Customer accounts cannot log in to the Admin Panel. Only verified Fleet Directors and System Admins are permitted.');
      return;
    }

    if (!adminUser || adminUser.role !== 'ROLE_ADMIN') {
      setErrorMessage('Unauthorized: Admin account not recognized. Use admin@crms-enterprise.com.');
      return;
    }

    // Check admin credentials
    if (adminPassword !== 'admin123' && adminPassword !== adminUser.password) {
      setErrorMessage('Invalid administrator password. Please check your credentials.');
      return;
    }

    if (adminPin !== '9821') {
      setErrorMessage('Invalid 2FA Fleet Security PIN. Expected 9821 for admin demo.');
      return;
    }

    setSuccessMessage('Administrator verified. Loading Fleet Operations Console...');
    setTimeout(() => {
      onLoginSuccess(adminUser);
      onClose();
    }, 700);
  };

  // Quick fill helper for customer demo
  const fillDemoCustomer = (cust: Customer) => {
    setLoginEmail(cust.email);
    setLoginPassword(cust.password || 'password123');
    setErrorMessage(null);
  };

  // Quick fill helper for admin
  const fillDemoAdmin = () => {
    setAdminEmail('admin@crms-enterprise.com');
    setAdminPassword('admin123');
    setAdminPin('9821');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
        
        {/* Header Tabs */}
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
              {mode === 'ADMIN_LOGIN' ? 'Admin Access Only' : 'Customer Portal'}
            </span>
          </div>

          <h2 className="text-xl font-black tracking-tight text-white mt-1">
            {mode === 'CUSTOMER_SIGNUP' && 'Create Customer Account'}
            {mode === 'CUSTOMER_LOGIN' && 'Customer Sign In'}
            {mode === 'ADMIN_LOGIN' && 'Admin Fleet Security Login'}
          </h2>
          
          {taskAttempted && mode !== 'ADMIN_LOGIN' && (
            <div className="mt-2 text-xs text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>You must create an account or sign in before you can {taskAttempted}.</span>
            </div>
          )}

          {/* Tab Switcher Pills */}
          <div className="grid grid-cols-3 gap-1.5 mt-5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setMode('CUSTOMER_SIGNUP'); setErrorMessage(null); }}
              className={`py-2 px-2 text-center rounded-xl transition-all ${
                mode === 'CUSTOMER_SIGNUP'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              1. Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setMode('CUSTOMER_LOGIN'); setErrorMessage(null); }}
              className={`py-2 px-2 text-center rounded-xl transition-all ${
                mode === 'CUSTOMER_LOGIN'
                  ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              2. Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('ADMIN_LOGIN'); setErrorMessage(null); }}
              className={`py-2 px-2 text-center rounded-xl transition-all flex items-center justify-center gap-1 ${
                mode === 'ADMIN_LOGIN'
                  ? 'bg-red-500 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Only
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
          {/* MODE 1: CUSTOMER SIGN UP (Mandatory before tasks) */}
          {/* ============================================================ */}
          {mode === 'CUSTOMER_SIGNUP' && (
            <form onSubmit={handleCustomerSignUp} className="space-y-4">
              <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Customer Account Required:</strong> Create your profile to enable vehicle booking, customizable pickup/drop locations, and invoice downloads.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma or Priya Menon"
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
                      placeholder="user@example.com"
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
                      placeholder="+91 98765 43210"
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
                    placeholder="e.g. DL-04-2023-9842104"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono tracking-wider focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Create Password *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="Min 6 characters"
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
                      placeholder="Repeat password"
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
                  I certify that I am at least 21 years old, possess an unexpired government-issued driving license, and agree to the CRMS rental terms and dynamic security deposit policy.
                </span>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Create Customer Account & Continue
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Already registered? </span>
                <button
                  type="button"
                  onClick={() => { setMode('CUSTOMER_LOGIN'); setErrorMessage(null); }}
                  className="text-xs font-bold text-amber-600 hover:underline"
                >
                  Sign in to your customer account
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* MODE 2: CUSTOMER SIGN IN */}
          {/* ============================================================ */}
          {mode === 'CUSTOMER_LOGIN' && (
            <form onSubmit={handleCustomerLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. alex.rivera@example.com"
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
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In to Customer Panel
              </button>

              {/* Demo Accounts Pill List */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 mb-2">Or quick-fill demo customer account:</p>
                <div className="flex flex-wrap gap-1.5">
                  {existingCustomers
                    .filter(c => c.role === 'ROLE_CUSTOMER')
                    .slice(0, 3)
                    .map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => fillDemoCustomer(c)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg text-[11px] text-slate-700 transition-colors"
                      >
                        {c.name.split(' ')[0]} ({c.email.split('@')[0]})
                      </button>
                    ))}
                </div>
              </div>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Need a new account? </span>
                <button
                  type="button"
                  onClick={() => { setMode('CUSTOMER_SIGNUP'); setErrorMessage(null); }}
                  className="text-xs font-bold text-amber-600 hover:underline"
                >
                  Create Customer Account
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* MODE 3: ADMIN SECURITY LOGIN (ONLY ADMIN ALLOWED) */}
          {/* ============================================================ */}
          {mode === 'ADMIN_LOGIN' && (
            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-900 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Restricted Administrative Area</strong>
                  <span className="text-[11px] text-red-700 leading-tight">
                    Only authorized Fleet Operations Directors and System Administrators with ROLE_ADMIN privileges may authenticate here. Customer accounts are strictly prohibited.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="admin@crms-enterprise.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Admin Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="admin123"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fleet Security PIN</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="9821"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-center tracking-widest focus:ring-2 focus:ring-red-500 focus:bg-white focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                Authenticate & Access Admin Console
              </button>

              {/* Demo Admin Auto-Fill */}
              <div className="p-3 bg-slate-100 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 text-[11px]">Demo Administrator Credentials</p>
                  <p className="text-[10px] text-slate-500">admin@crms-enterprise.com • PIN: 9821</p>
                </div>
                <button
                  type="button"
                  onClick={fillDemoAdmin}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 text-[11px] shadow-2xs transition-colors"
                >
                  Quick Fill
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
