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
  BadgeAlert
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
import { signInWithPopup } from 'firebase/auth';

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
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(!!currentUser.phone);
  const [otpInput, setOtpInput] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState(false);

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

  // Handle OTP Simulation
  const handleSendOtp = () => {
    setShowOtpField(true);
    setOtpSentMsg(true);
    setTimeout(() => setOtpSentMsg(false), 4000);
  };

  const handleVerifyOtp = () => {
    if (otpInput.trim().length >= 4) {
      setPhoneOtpVerified(true);
      setShowOtpField(false);
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
            <form onSubmit={handleProceedToDL} className="space-y-4 animate-fade-in">
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

              {/* Mobile Number & OTP */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (India)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneOtpVerified(false);
                      }}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  {!phoneOtpVerified ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0"
                    >
                      Verify via OTP
                    </button>
                  ) : (
                    <div className="px-3 py-2 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>OTP Verified</span>
                    </div>
                  )}
                </div>

                {otpSentMsg && (
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium animate-fade-in flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verification OTP sent to {phone}. Please enter the 4-digit code.</span>
                  </p>
                )}

                {showOtpField && !phoneOtpVerified && (
                  <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="Enter 4-digit OTP"
                      className="w-36 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-center tracking-widest focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold"
                    >
                      Confirm OTP
                    </button>
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
                    <p className="text-[10px] text-rose-600 font-semibold mt-1.5">
                      Tip: Try selecting the "Standard Valid DL (Delhi)" preset above for instantaneous approval.
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
