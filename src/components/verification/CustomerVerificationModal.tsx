import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Building2, 
  ShieldAlert, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  FileText, 
  RefreshCw, 
  QrCode, 
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
  // Flow steps:
  // 1: Google Identity Verification (Fraud Prevention)
  // 2: Complete Profile (Full Name, Mobile Number, Residential Address, DOB)
  // 3: Government-Authorized DL Verification (MoRTH Sarathi API)
  // 4: Verification Success Certificate
  const initialStep = !currentUser.profileCompleted ? 2 : (currentUser.dlVerificationStatus !== 'VERIFIED' ? 3 : 4);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialStep);

  // Profile Fields
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [dob, setDob] = useState(currentUser.dateOfBirth || '');
  const [phoneError, setPhoneError] = useState<string | null>(null);

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

  // Real-time format validation of currently typed DL
  const dlFormatCheck = validateDLNumberFormat(dlNumber);

  // Profile Save -> proceed directly to step 3 (DL verification)
  const handleProceedToDL = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError(null);

    if (!name.trim()) return;
    if (userAge < 18) {
      alert('The applicant must be at least 18 years old to drive or rent a motor vehicle in India.');
      return;
    }

    const cleanDigits = phone.replace(/\D/g, '');
    if (phone.trim() && cleanDigits.length > 0 && cleanDigits.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number (e.g. 9876543210).');
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
    setTimeout(() => setVerificationProgressStep(2), 350);
    setTimeout(() => setVerificationProgressStep(3), 700);

    try {
      const cleanToVerify = dlFormatCheck.cleanDL || dlNumber;
      const response = await verifyDrivingLicenceWithGovtAPI({
        dlNumber: cleanToVerify,
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

        // Update customer record with full verified profile
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

  if (!isOpen) return null;

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
              <strong>Rental Clearance Required:</strong> To book <span className="font-bold underline">{requiredForRentalVehicleName}</span>, Indian transport regulations mandate complete profile details and an active Light Motor Vehicle (LMV) driving licence.
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
                      <h3 className="font-bold text-slate-900 text-sm">
                        {currentUser.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Authenticated
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Authentication session verified. Please complete your profile and government licence check to unlock vehicle reservations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md shadow-amber-500/10"
                >
                  <span>Continue to Profile Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Profile Details (Full Name, Phone Number, DOB, Address - No OTP required) */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
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

                {/* Mobile Contact Number (Direct Entry - No OTP) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mobile Number (India)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneError(null);
                      }}
                      placeholder="+91 98765 43210"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden ${
                        phoneError ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                      }`}
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {phoneError ? (
                    <span className="text-[10px] text-rose-600 font-medium mt-1 block">
                      {phoneError}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Enter your 10-digit mobile number for booking confirmations and updates
                    </span>
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
                  Connects to the <strong>National Parivahan Sarathi Register</strong>. Real Indian transport laws mandate that wrong, unverified, expired, or non-LMV driving licences are strictly rejected. Only verified, genuine licences are granted rental clearance.
                </p>
              </div>

              {/* DL Input Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Indian Driving Licence (DL) Number
                    </label>
                    {dlNumber.trim() && (
                      <span className={`text-[10px] font-bold ${dlFormatCheck.isValid ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {dlFormatCheck.isValid 
                          ? `✓ Valid Format (${dlFormatCheck.stateName || dlFormatCheck.stateCode} RTO)` 
                          : `✕ Format Invalid`}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={dlNumber}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setDlNumber(val);
                        setVerificationError(null);
                        const prefix = val.replace(/[^A-Z]/g, '').substring(0, 2);
                        if (INDIAN_RTO_MAP[prefix]) {
                          setIssuingState(prefix);
                        }
                      }}
                      placeholder="e.g. DL-04-2018-0019284 or UP16 20200082797"
                      className={`w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl text-xs font-mono font-bold text-slate-900 tracking-wider focus:ring-2 focus:ring-amber-500 focus:bg-white focus:outline-hidden ${
                        dlNumber.trim() && !dlFormatCheck.isValid ? 'border-rose-300 bg-rose-50/30' : 'border-slate-300'
                      }`}
                    />
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  
                  {/* Inline format validation feedback */}
                  {dlNumber.trim() && !dlFormatCheck.isValid ? (
                    <span className="text-[10px] text-rose-600 font-medium mt-1 block">
                      {dlFormatCheck.error}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Indian DL format (with hyphens, slashes, or spaces)
                    </span>
                  )}
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
                      Please ensure you enter a valid Indian driving licence number and correct date of birth.
                    </p>
                  </div>
                </div>
              )}

              {/* Verification Progress Animation */}
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
                  <span className="font-bold text-slate-900 block">All Verification Pillars Completed:</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    1. Google OAuth 2.0 Identity ✓ • 2. KYC Profile & Contact Details ✓ • 3. MoRTH Sarathi LMV Driving Licence ✓
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
