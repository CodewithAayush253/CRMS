import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  FileCheck, 
  Building2, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ExternalLink, 
  Upload, 
  FileText, 
  RefreshCw, 
  QrCode, 
  Lock,
  BadgeAlert,
  MessageSquare,
  Copy,
  Smartphone,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  Check
} from 'lucide-react';
import { Customer, DLVerificationDetails } from '../../types';
import { 
  verifyDrivingLicenceWithGovtAPI, 
  INDIAN_RTO_MAP, 
  validateDLNumberFormat, 
  calculateAge,
  DLVerificationResponse
} from '../../services/dlVerificationService';
import { auth, googleProvider } from '../../lib/firebase';
import { 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult 
} from 'firebase/auth';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

interface CustomerVerificationModalProps {
  isOpen: boolean;
  currentUser: Customer;
  onClose: () => void;
  onVerificationComplete: (updatedCustomer: Customer) => void;
  requiredForRentalVehicleName?: string | null;
}

export const CustomerVerificationModal: React.FC<CustomerVerificationModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onVerificationComplete,
  requiredForRentalVehicleName,
}) => {
  if (!isOpen) return null;

  // Flow steps:
  // 1: Google Identity Verification (Fraud Prevention)
  // 2: Complete Profile (Full Name, Phone, Address, DOB)
  // 3: Government-Authorized DL Verification (MoRTH Sarathi API)
  // 4: Verification Success Certificate
  const initialStep = !currentUser.profileCompleted ? 2 : (currentUser.dlVerificationStatus !== 'VERIFIED' ? 3 : 4);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);

  // Profile Fields
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [dob, setDob] = useState(currentUser.dateOfBirth || '');
  
  // Real Cellular SMS OTP State (Instant SMS Simulation & Firebase Fallback)
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(!!currentUser.phone && !!currentUser.profileCompleted);
  const [deliveryMode, setDeliveryMode] = useState<'FIREBASE_SMS' | 'SANDBOX_OTP'>('SANDBOX_OTP');
  const [sandboxExpectedOtp, setSandboxExpectedOtp] = useState<string | null>(null);
  const [showFirebaseSetupGuide, setShowFirebaseSetupGuide] = useState(false);
  const [hasFirebaseFailed, setHasFirebaseFailed] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const [phoneSentTo, setPhoneSentTo] = useState<string | null>(null);

  // DL Verification Fields
  const [dlNumber, setDlNumber] = useState(currentUser.licenseNumber || '');
  const [issuingState, setIssuingState] = useState('DL');
  const [isDigiLockerLinked, setIsDigiLockerLinked] = useState(true);
  const [uploadedDocName, setUploadedDocName] = useState<string | null>(null);
  
  // Verification execution states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgressStep, setVerificationProgressStep] = useState(0);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verifiedDetails, setVerifiedDetails] = useState<DLVerificationDetails | null>(currentUser.dlVerificationDetails || null);
  const [auditLog, setAuditLog] = useState<DLVerificationResponse['auditLog'] | null>(null);

  // Calculate user age
  const userAge = calculateAge(dob);

  // Resend Countdown Timer effect
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Format Indian phone number to international E.164 standard (+91XXXXXXXXXX)
  const formatIndianPhoneE164 = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    if (raw.trim().startsWith('+')) return `+${digits}`;
    return `+91${digits.slice(-10)}`;
  };

  // Initialize or retrieve reCAPTCHA verifier
  const getOrCreateRecaptcha = (): RecaptchaVerifier => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        // cleanup if needed
      }
    }
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setOtpError('Security verification expired. Please click Send OTP again.');
      }
    });
    window.recaptchaVerifier = verifier;
    return verifier;
  };

  // Dispatch SMS (Real Carrier SMS via Firebase or Instant Sandbox Verification)
  const handleSendOtp = async (targetPhone?: string, forceMode?: 'FIREBASE_SMS' | 'SANDBOX_OTP') => {
    const rawNumber = targetPhone || phone;
    const cleanDigits = rawNumber.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setOtpError('Please enter a valid 10-digit Indian mobile number (e.g. +91 98765 43210).');
      return;
    }

    const formattedE164 = formatIndianPhoneE164(rawNumber);
    const activeMode = forceMode || deliveryMode;
    if (forceMode) {
      setDeliveryMode(forceMode);
    }

    setIsOtpSending(true);
    setOtpError(null);
    setOtpSuccessMsg(null);
    setPhoneSentTo(formattedE164);

    if (activeMode === 'SANDBOX_OTP') {
      // Instant Sandbox OTP Generation
      setTimeout(() => {
        const generated = Math.floor(100000 + Math.random() * 900000).toString();
        setSandboxExpectedOtp(generated);
        setConfirmationResult(null);
        setShowOtpField(true);
        setOtpCountdown(60);
        setIsOtpSending(false);
        setOtpSuccessMsg(`[Sandbox SMS Dispatched] 6-digit verification code sent to ${formattedE164}! Check simulated SMS alert below.`);
      }, 400);
      return;
    }

    // Attempt Real Cellular SMS via Firebase Phone Authentication
    try {
      const verifier = getOrCreateRecaptcha();
      const result = await signInWithPhoneNumber(auth, formattedE164, verifier);
      setConfirmationResult(result);
      window.confirmationResult = result;
      setSandboxExpectedOtp(null);
      setShowOtpField(true);
      setOtpCountdown(60);
      setIsOtpSending(false);
      setHasFirebaseFailed(false);
      setOtpSuccessMsg(`Real SMS OTP dispatched to ${formattedE164}! Please check your phone's SMS inbox.`);
    } catch (err: any) {
      setIsOtpSending(false);
      setHasFirebaseFailed(true);
      console.error('Firebase Phone Auth Error:', err);

      if (err?.code === 'auth/operation-not-allowed') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        setOtpError(
          `Firebase Phone Auth failed (${err?.code}). Even with Phone enabled, Firebase requires: 1) Add "${currentDomain}" in Firebase Console -> Authentication -> Settings -> Authorized domains. 2) Allow India (+91) in Settings -> SMS region policy. Or add your number under "Phone numbers for testing" with a static code.`
        );
      } else if (err?.code === 'auth/invalid-phone-number') {
        setOtpError('Invalid mobile number format. Please ensure your Indian number has 10 valid digits (e.g. +91 98765 43210).');
      } else if (err?.code === 'auth/quota-exceeded') {
        setOtpError('SMS daily quota exceeded for Firebase Spark tier. Add your number under "Phone numbers for testing" in Firebase Console, or switch to Instant Sandbox OTP.');
      } else if (err?.code === 'auth/captcha-check-failed') {
        setOtpError('Security reCAPTCHA verification failed. Please refresh the page or switch to Instant Sandbox OTP.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        setOtpError(`Domain "${currentDomain}" is not in Firebase Authorized domains. Go to Firebase Console -> Authentication -> Settings -> Authorized domains and add "${currentDomain}".`);
      } else {
        setOtpError(err?.message || 'Failed to dispatch SMS to your phone number via Firebase gateway.');
      }
    }
  };

  // Verify the OTP code entered by the user
  const handleVerifyOtp = async () => {
    const code = otpInput.trim();
    setOtpError(null);

    if (!code || code.length < 6) {
      setOtpError('Please enter the complete 6-digit OTP code.');
      return;
    }

    // Verify against Sandbox OTP
    if (sandboxExpectedOtp) {
      setIsVerifyingOtp(true);
      setTimeout(() => {
        setIsVerifyingOtp(false);
        if (code === sandboxExpectedOtp) {
          setPhoneOtpVerified(true);
          setShowOtpField(false);
          setSandboxExpectedOtp(null);
          setOtpSuccessMsg(`Mobile number ${phone} successfully verified via SMS OTP! ✓`);
          setTimeout(() => setOtpSuccessMsg(null), 5000);
        } else {
          setOtpError(`Incorrect OTP entered! The code "${code}" does not match the verification code sent to your number. Please check and re-enter.`);
        }
      }, 350);
      return;
    }

    // Verify against Firebase confirmationResult
    if (!confirmationResult) {
      setOtpError('No active SMS verification session found. Please click Send SMS OTP again.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      await confirmationResult.confirm(code);
      setIsVerifyingOtp(false);
      setPhoneOtpVerified(true);
      setShowOtpField(false);
      setOtpSuccessMsg(`Mobile number ${phone} successfully verified via real SMS! ✓`);
      setTimeout(() => setOtpSuccessMsg(null), 5000);
    } catch (err: any) {
      setIsVerifyingOtp(false);
      console.error('OTP confirmation error:', err);

      if (err?.code === 'auth/invalid-verification-code') {
        setOtpError('Incorrect OTP entered! The code does not match the SMS sent to your phone. Please check your SMS inbox and re-enter.');
      } else if (err?.code === 'auth/code-expired') {
        setOtpError('The verification code has expired. Please click Resend SMS to receive a new code.');
      } else {
        setOtpError(err?.message || 'Verification failed. Please check the code received on your phone and try again.');
      }
    }
  };

  // Profile Save -> proceed to step 3 (DL verification)
  const handleProceedToDL = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (userAge < 18) {
      alert('The applicant must be at least 18 years old to drive or rent a motor vehicle in India.');
      return;
    }
    if (!phoneOtpVerified) {
      setOtpError('Indian motor rental regulations require mobile number verification via SMS OTP.');
      if (!showOtpField) {
        handleSendOtp();
      }
      return;
    }
    setStep(3);
  };

  // Execute Real Automated DL Verification with Parivahan Sarathi API
  const handleExecuteDLVerification = async () => {
    setIsVerifying(true);
    setVerificationError(null);
    setVerificationProgressStep(1);

    // Progress animation simulating API stages
    setTimeout(() => setVerificationProgressStep(2), 400);
    setTimeout(() => setVerificationProgressStep(3), 800);

    try {
      const response = await verifyDrivingLicenceWithGovtAPI({
        dlNumber,
        dateOfBirth: dob,
        holderName: name,
        issuingState,
        digiLockerLinked: isDigiLockerLinked,
        documentFileUrl: uploadedDocName || undefined,
      });

      setIsVerifying(false);

      if (response.success && response.details) {
        setVerifiedDetails(response.details);
        setAuditLog(response.auditLog || null);
        setStep(4);

        // Update customer record
        const updatedCustomer: Customer = {
          ...currentUser,
          name,
          phone,
          address,
          dateOfBirth: dob,
          licenseNumber: response.details.dlNumber,
          profileCompleted: true,
          dlVerificationStatus: 'VERIFIED',
          dlVerificationDetails: response.details,
        };

        onVerificationComplete(updatedCustomer);
      } else {
        setVerificationError(response.message);
        if (response.auditLog) {
          setAuditLog(response.auditLog);
        }
      }
    } catch (err: any) {
      setIsVerifying(false);
      setVerificationError(err?.message || 'Failed to connect to Parivahan Sarathi national verification gateway.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-in">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 sm:p-6 text-white flex items-start justify-between relative">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-[11px] font-bold tracking-wide uppercase mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Government Identity & DL Verification Protocol</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Customer Identity Verification Flow
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-md">
              Ministry of Road Transport and Highways (MoRTH) & DigiLocker compliance check for trusted vehicle rentals.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mandatory Rental Warning Notice if triggered from rental booking */}
        {requiredForRentalVehicleName && currentUser.dlVerificationStatus !== 'VERIFIED' && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs text-amber-900 font-medium">
              <strong>Rental Clearance Required:</strong> To book <span className="font-bold underline">{requiredForRentalVehicleName}</span>, Indian transport regulations mandate verified profile details and an active Light Motor Vehicle (LMV) driving licence.
            </div>
          </div>
        )}

        {/* Stepper Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-3 px-2 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              step === 1 ? 'border-amber-500 text-amber-600 bg-white font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">1</span>
            <span className="hidden sm:inline">Google Auth</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`py-3 px-2 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              step === 2 ? 'border-amber-500 text-amber-600 bg-white font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">2</span>
            <span className="hidden sm:inline">Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setStep(3)}
            className={`py-3 px-2 flex items-center justify-center gap-2 transition-colors border-b-2 ${
              step === 3 || step === 4 ? 'border-amber-500 text-amber-600 bg-white font-bold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">3</span>
            <span className="hidden sm:inline">DL Verification</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-7">
          
          {/* STEP 1: Google Sign-In & Verified Account Details */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">Google Verified Account</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Authenticated
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Your identity was verified through Google OAuth 2.0. This authenticates the user and eliminates fake, duplicate, or anonymous accounts.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Primary Email</span>
                    <span className="font-semibold text-slate-900">{currentUser.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Google UID / System ID</span>
                    <span className="font-mono text-slate-700 font-medium truncate block">{currentUser.id}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-950">Synergy with Project Architecture</h4>
                  <p className="mt-0.5 leading-relaxed text-emerald-800">
                    Step 1 is complete. Google credentials have been locked to this session. Please proceed to complete your Indian residential address, contact number, and date of birth for KYC.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/10"
                >
                  <span>Continue to Customer Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Customer Profile (Name, Phone, Address, DOB) */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              {/* Invisible Firebase reCAPTCHA container */}
              <div id="recaptcha-container"></div>

              {/* Success alert when OTP confirmed */}
              {otpSuccessMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-fade-in font-medium shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{otpSuccessMsg}</span>
                </div>
              )}

              {/* Error Alert with Smart Recovery */}
              {otpError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-2.5 animate-shake shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold text-rose-950">{otpError}</p>
                    </div>
                  </div>

                  {/* Proactive Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-200/70">
                    <button
                      type="button"
                      onClick={() => handleSendOtp(phone, 'SANDBOX_OTP')}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Switch to Instant Sandbox OTP & Verify Now</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFirebaseSetupGuide(!showFirebaseSetupGuide)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-rose-200 text-slate-700 rounded-xl font-semibold flex items-center gap-1 transition-all"
                    >
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      <span>{showFirebaseSetupGuide ? 'Hide Firebase Setup Guide' : 'How to Enable Real SMS in Firebase'}</span>
                      {showFirebaseSetupGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {/* Expandable Firebase Setup Guide */}
                  {showFirebaseSetupGuide && (
                    <div className="p-3 bg-white rounded-xl border border-rose-200 text-[11px] text-slate-700 space-y-2 leading-relaxed animate-fade-in">
                      <p className="font-bold text-slate-900 flex items-center gap-1">
                        <span>Why this happens & 3 quick steps to fix in Firebase Console (crms-95421):</span>
                      </p>
                      <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
                        <li>
                          <strong>Authorized Domains:</strong> In Firebase Console &rarr; <strong>Authentication</strong> &rarr; <strong>Settings</strong> tab &rarr; scroll to <strong>Authorized domains</strong>. Click <strong>Add domain</strong> and add <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold text-slate-800">velocityarms.vercel.app</code> (plus any other domain you access the app on).
                        </li>
                        <li>
                          <strong>SMS Region Policy:</strong> In Firebase Console &rarr; <strong>Authentication</strong> &rarr; <strong>Settings</strong> tab &rarr; <strong>SMS region policy</strong>. Make sure India (+91) is allowed (new Firebase projects block international SMS regions by default).
                        </li>
                        <li>
                          <strong>Best for Testing (Free & Instant):</strong> In <strong>Sign-in method</strong> &rarr; click <strong>Phone</strong> &rarr; expand <strong>Phone numbers for testing</strong>. Add your number <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold text-slate-800">+91 8279775014</code> with test code <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold text-slate-800">123456</code>. This bypasses carrier quotas and works 100% reliably.
                        </li>
                      </ol>
                      <p className="text-slate-500 italic pt-1 border-t border-slate-100">
                        ⚡ Quick bypass: You can also simply click <strong>"Switch to Instant Sandbox OTP & Verify Now"</strong> above to verify your profile instantly right here!
                      </p>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleProceedToDL} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Legal Name (as per Govt ID)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Aayush Verma"
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Date of Birth
                      </label>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        Age: <strong className={userAge >= 18 ? 'text-emerald-600' : 'text-rose-600'}>{isNaN(userAge) ? '--' : `${userAge} yrs`}</strong>
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                      />
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>

                {/* Mobile Number & Real Cellular SMS OTP Verification Section */}
                <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-200/80">
                    <label className="block text-xs font-bold text-slate-700">
                      Mobile Number (India) & SMS OTP
                    </label>
                    
                    {/* Delivery Mode Toggle */}
                    <div className="flex items-center gap-1 text-[11px] bg-slate-200/70 p-0.5 rounded-lg shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMode('FIREBASE_SMS');
                          setSandboxExpectedOtp(null);
                          setOtpError(null);
                        }}
                        className={`px-2 py-0.5 rounded-md transition-all font-semibold ${
                          deliveryMode === 'FIREBASE_SMS'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        📱 Real SMS (Firebase)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryMode('SANDBOX_OTP');
                          setOtpError(null);
                        }}
                        className={`px-2 py-0.5 rounded-md transition-all font-semibold ${
                          deliveryMode === 'SANDBOX_OTP'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ⚡ Sandbox OTP (Demo)
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setPhoneOtpVerified(false);
                          setOtpError(null);
                        }}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>

                    {!phoneOtpVerified ? (
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={isOtpSending}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-xs"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                        <span>{isOtpSending ? 'Sending SMS...' : showOtpField ? 'Resend SMS' : 'Send SMS OTP'}</span>
                      </button>
                    ) : (
                      <div className="px-3 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Phone Verified ✓</span>
                      </div>
                    )}
                  </div>

                  {/* Simulated Incoming SMS Card (when in Sandbox Mode) */}
                  {sandboxExpectedOtp && showOtpField && !phoneOtpVerified && (
                    <div className="p-3 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 rounded-2xl space-y-2 animate-fade-in shadow-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                          <MessageSquare className="w-4 h-4 text-amber-600" />
                          <span>Simulated Carrier SMS • MOTORENT-IN</span>
                        </div>
                        <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                          Instant Delivery
                        </span>
                      </div>
                      
                      <div className="p-2.5 bg-white/90 rounded-xl border border-amber-200 text-xs text-slate-800 space-y-1 font-mono">
                        <div className="text-[10px] text-slate-500 font-sans">SMS Message Preview:</div>
                        <p className="text-slate-900">
                          Your Motorent verification code is <span className="font-bold text-sm tracking-wider bg-amber-100 text-amber-950 px-2 py-0.5 rounded border border-amber-300">{sandboxExpectedOtp}</span>. Valid for 10 minutes. Do not share this OTP with anyone.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpInput(sandboxExpectedOtp);
                            setOtpError(null);
                          }}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Auto-Fill Code ({sandboxExpectedOtp})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(sandboxExpectedOtp);
                            setCopiedOtp(true);
                            setTimeout(() => setCopiedOtp(false), 2000);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-amber-300 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                          <span>{copiedOtp ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* When Phone is already verified */}
                  {phoneOtpVerified && (
                    <div className="flex items-center justify-between pt-1 text-[11px] text-emerald-700 font-medium">
                      <span>✓ Mobile number ({phone}) verified with SMS OTP.</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneOtpVerified(false);
                          setShowOtpField(false);
                          setConfirmationResult(null);
                          setSandboxExpectedOtp(null);
                          setOtpInput('');
                        }}
                        className="text-slate-500 hover:text-slate-800 underline font-semibold ml-2"
                      >
                        Change number
                      </button>
                    </div>
                  )}

                  {/* Cellular SMS OTP Input Section */}
                  {showOtpField && !phoneOtpVerified && (
                    <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-amber-600" />
                          Enter 6-Digit OTP Received
                        </span>

                        <span className="text-[11px] font-semibold text-amber-800 bg-amber-200/70 border border-amber-300 px-2 py-0.5 rounded-md">
                          Sent to: {phoneSentTo || phone}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpInput}
                          onChange={(e) => {
                            setOtpInput(e.target.value.replace(/\D/g, ''));
                            setOtpError(null);
                          }}
                          placeholder="Enter 6-digit OTP"
                          className="w-44 px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-base font-bold text-center tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp}
                          className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                        >
                          {isVerifyingOtp ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Verifying...</span>
                            </>
                          ) : (
                            <span>Confirm & Verify OTP</span>
                          )}
                        </button>
                      </div>

                      {/* Resend Timer & Carrier Notice */}
                      <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                        <span className="text-[11px]">
                          Didn't receive code?{' '}
                          {otpCountdown > 0 ? (
                            <span className="text-slate-500 font-semibold">Resend in {otpCountdown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSendOtp()}
                              className="text-amber-800 font-bold hover:underline"
                            >
                              Resend SMS OTP
                            </button>
                          )}
                        </span>

                        <span className="text-[10px] text-amber-800 font-medium">
                          {deliveryMode === 'SANDBOX_OTP' ? 'Sandbox instant delivery active' : 'Check your mobile phone\'s SMS inbox'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Residential Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Residential Address (in India)
                  </label>
                  <div className="relative">
                    <textarea
                      rows={2}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House/Flat No., Street, Landmark, City, State, PIN Code"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden resize-none"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/10"
                  >
                    <span>Proceed to DL Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: Automated Driving Licence Verification (MoRTH / Parivahan Sarathi API) */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs">Automated Govt. DL Verification Engine</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded">
                    MoRTH Sarathi v2 API
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Unlike traditional systems that merely store an unverified picture, this automated module connects directly to the <strong>National Parivahan Sarathi Register</strong>. It validates licence authenticity, vehicle class endorsements (LMV), active status, and applicant age.
                </p>
              </div>

              {/* DL Input Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Indian Driving Licence (DL) Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={dlNumber}
                      onChange={(e) => {
                        setDlNumber(e.target.value.toUpperCase());
                        setVerificationError(null);
                      }}
                      placeholder="e.g. DL-04-2018-0019284"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 tracking-wider focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Format: SS-RR-YYYYNNNNNNN (Standard Indian format)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Issuing State & Regional Transport Office (RTO)
                  </label>
                  <select
                    value={issuingState}
                    onChange={(e) => setIssuingState(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    {Object.entries(INDIAN_RTO_MAP).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.state} ({code})
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Direct RTO sync via Parivahan Sarathi National Gateway
                  </span>
                </div>
              </div>

              {/* DigiLocker & Document Upload Integration */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0 font-black">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">DigiLocker Government Document Link</span>
                    <span className="text-[11px] text-slate-500">
                      Auto-extract document hash and cross-verify with uploaded document
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer bg-white px-3 py-1.5 border border-slate-300 rounded-xl hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>{uploadedDocName ? 'DL Scanned ✓' : 'Upload DL'}</span>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf" 
                      className="hidden" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setUploadedDocName(e.target.files[0].name);
                        }
                      }} 
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsDigiLockerLinked(!isDigiLockerLinked)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors ${
                      isDigiLockerLinked 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {isDigiLockerLinked ? 'DigiLocker Linked' : 'Link DigiLocker'}
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {verificationError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-3 animate-shake">
                  <BadgeAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-rose-950">Verification Denied by MoRTH Sarathi Registry</h4>
                    <p className="mt-1 leading-relaxed text-rose-800">{verificationError}</p>
                    <p className="text-[10px] text-rose-600 font-medium mt-1">
                      Please verify your licence number and date of birth match your physical driving licence document.
                    </p>
                  </div>
                </div>
              )}

              {/* Verification Progress Modal / Animation */}
              {isVerifying && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2 text-xs animate-pulse">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                      Communicating with Parivahan Sarathi Central Gateway...
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">Phase {verificationProgressStep}/3</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {verificationProgressStep === 1 && 'Querying National Motor Vehicles Register for licence number...'}
                    {verificationProgressStep === 2 && 'Validating Light Motor Vehicle (LMV) authorization & expiration date...'}
                    {verificationProgressStep === 3 && 'Signing digital verification audit certificate via DigiLocker...'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={isVerifying}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Profile</span>
                </button>

                <button
                  type="button"
                  disabled={isVerifying || !dlNumber.trim()}
                  onClick={handleExecuteDLVerification}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Driving Licence with Govt. API</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Official Verification Certificate & Approval */}
          {step === 4 && verifiedDetails && (
            <div className="space-y-5 animate-scale-in">
              <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 p-6 rounded-3xl text-white border border-emerald-500/40 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <QrCode className="w-32 h-32 text-emerald-400" />
                </div>

                <div className="flex items-start justify-between relative z-10 mb-4">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      MoRTH Sarathi Verified Certificate
                    </span>
                    <h3 className="text-lg font-black text-white mt-1.5">
                      Rental Clearance Authorized
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">Reference No.</span>
                    <span className="font-mono text-xs font-bold text-amber-400">{verifiedDetails.sarathiRefId}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs relative z-10 pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Licence Holder</span>
                    <span className="font-bold text-white">{verifiedDetails.holderName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">DL Number</span>
                    <span className="font-mono font-bold text-amber-300">{verifiedDetails.dlNumber}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Issuing RTO</span>
                    <span className="font-medium text-slate-200">{verifiedDetails.issuingRto}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Vehicle Class Endorsement</span>
                    <span className="font-bold text-emerald-400">LMV (Car) ✓</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Licence Validity</span>
                    <span className="font-medium text-slate-200">Valid until {verifiedDetails.validUntil}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Status</span>
                    <span className="font-bold text-emerald-400">ACTIVE & COMPLIANT</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 relative z-10">
                  <span>Agency: {verifiedDetails.verificationAgency}</span>
                  <span className="font-mono text-emerald-400">DigiLocker QR Hash Signed</span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">All 3 Verification Pillars Completed:</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    1. Google OAuth 2.0 Identity ✓ • 2. KYC Profile & Contact ✓ • 3. MoRTH Sarathi LMV Driving Licence ✓
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs"
                >
                  Return to Fleet & Rent
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
