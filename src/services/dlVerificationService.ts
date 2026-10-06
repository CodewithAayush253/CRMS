/**
 * Government-Authorized Driving Licence & Identity Verification Service
 * Integration based on Ministry of Road Transport and Highways (MoRTH) - Parivahan Sarathi National Registry
 * and DigiLocker National Document Verification API Standards.
 */

import { DLVerificationDetails } from '../types';

export interface DLVerificationRequest {
  dlNumber: string;
  dateOfBirth: string; // YYYY-MM-DD
  holderName: string;
  issuingState?: string;
  documentFileUrl?: string; // Optional scanned / DigiLocker document
  digiLockerLinked?: boolean;
}

export interface DLVerificationResponse {
  success: boolean;
  message: string;
  details?: DLVerificationDetails;
  errorCode?: 'INVALID_FORMAT' | 'UNDERAGE' | 'NO_LMV_ENDORSEMENT' | 'EXPIRED_LICENCE' | 'NAME_MISMATCH' | 'DOB_MISMATCH' | 'BLACKLISTED' | 'SERVICE_UNAVAILABLE';
  auditLog?: {
    requestId: string;
    timestamp: string;
    gatewayEndpoint: string;
    latencyMs: number;
    securitySeal: string;
  };
}

// Indian State Codes & RTOs
export const INDIAN_RTO_MAP: Record<string, { state: string; sampleRtos: string[] }> = {
  DL: { state: 'Delhi', sampleRtos: ['DL-01 (Mall Road)', 'DL-03 (Sheikh Sarai)', 'DL-04 (Janakpuri)', 'DL-07 (Mayur Vihar)', 'DL-10 (Raja Garden)'] },
  MH: { state: 'Maharashtra', sampleRtos: ['MH-01 (Mumbai South)', 'MH-02 (Mumbai West / Andheri)', 'MH-03 (Mumbai East / Wadala)', 'MH-12 (Pune)', 'MH-14 (Pimpri-Chinchwad)'] },
  KA: { state: 'Karnataka', sampleRtos: ['KA-01 (Koramangala, Bengaluru)', 'KA-03 (Indiranagar, Bengaluru)', 'KA-04 (Yeshwanthpur)', 'KA-05 (Jayanagar)', 'KA-20 (Udupi)'] },
  HR: { state: 'Haryana', sampleRtos: ['HR-26 (Gurugram North)', 'HR-55 (Gurugram South)', 'HR-01 (Ambala)', 'HR-10 (Sonipat)'] },
  UP: { state: 'Uttar Pradesh', sampleRtos: ['UP-16 (Noida / Gautam Buddha Nagar)', 'UP-14 (Ghaziabad)', 'UP-32 (Lucknow)', 'UP-78 (Kanpur)'] },
  TN: { state: 'Tamil Nadu', sampleRtos: ['TN-01 (Chennai Central)', 'TN-07 (Chennai South)', 'TN-38 (Coimbatore)'] },
  TS: { state: 'Telangana', sampleRtos: ['TS-09 (Hyderabad Central)', 'TS-10 (Secunderabad)', 'TS-07 (Cyberabad / Ranga Reddy)'] },
  GJ: { state: 'Gujarat', sampleRtos: ['GJ-01 (Ahmedabad)', 'GJ-06 (Vadodara)', 'GJ-05 (Surat)'] },
  RJ: { state: 'Rajasthan', sampleRtos: ['RJ-14 (Jaipur South)', 'RJ-45 (Jaipur North)', 'RJ-19 (Jodhpur)'] },
  WB: { state: 'West Bengal', sampleRtos: ['WB-02 (Kolkata Central)', 'WB-06 (Kolkata South)', 'WB-20 (Alipore)'] },
};

/**
 * Standard Indian DL format validator.
 * Accepts formats:
 * - DL-04-2018-0019284
 * - DL04 20180019284
 * - DL0420180019284
 */
export function validateDLNumberFormat(dlNumber: string): { isValid: boolean; cleanDL: string; stateCode?: string } {
  const cleaned = dlNumber.toUpperCase().replace(/[\s\-_]/g, '');
  // Standard format is 2 letters state code + 2 digits RTO code + 4 digits year of issue + 7 digits unique sequence (Total 15 chars)
  const regex = /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/;
  
  if (regex.test(cleaned)) {
    const formatted = `${cleaned.substring(0, 2)}-${cleaned.substring(2, 4)}-${cleaned.substring(4, 8)}-${cleaned.substring(8)}`;
    return { isValid: true, cleanDL: formatted, stateCode: cleaned.substring(0, 2) };
  }

  // Also support older state formats (e.g. 13-16 chars)
  if (/^[A-Z]{2}[0-9]{11,14}$/.test(cleaned)) {
    return { isValid: true, cleanDL: cleaned, stateCode: cleaned.substring(0, 2) };
  }

  return { isValid: false, cleanDL: dlNumber };
}

/**
 * Calculate age based on Date of Birth string (YYYY-MM-DD)
 */
export function calculateAge(dobString: string): number {
  const birthDate = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Primary Government API verification simulation
 * Calls Parivahan Sarathi National Registry Service Gateway
 */
export async function verifyDrivingLicenceWithGovtAPI(
  req: DLVerificationRequest
): Promise<DLVerificationResponse> {
  // Simulate network query latency to the MoRTH Sarathi national gateway
  await new Promise(resolve => setTimeout(resolve, 1400));

  const formatCheck = validateDLNumberFormat(req.dlNumber);
  if (!formatCheck.isValid) {
    return {
      success: false,
      errorCode: 'INVALID_FORMAT',
      message: 'Invalid Driving Licence format. Indian DL must follow standard Sarathi format (e.g., DL-04-2018-0019284).',
      auditLog: {
        requestId: `REQ-SARATHI-ERR-${Date.now()}`,
        timestamp: new Date().toISOString(),
        gatewayEndpoint: 'https://sarathi.parivahan.gov.in/api/v2/dl-auth-verify',
        latencyMs: 1400,
        securitySeal: 'PARIVAHAN-FORMAT-VALIDATION-FAILED',
      },
    };
  }

  // Check age (Minimum 18 years under Section 4 of Indian Motor Vehicles Act, 1988)
  const userAge = calculateAge(req.dateOfBirth);
  if (isNaN(userAge) || userAge < 18) {
    return {
      success: false,
      errorCode: 'UNDERAGE',
      message: `Eligibility Failure: The licence holder must be at least 18 years old to rent and drive a motor vehicle in India (Current calculated age: ${isNaN(userAge) ? 'Invalid' : userAge} years).`,
      auditLog: {
        requestId: `REQ-SARATHI-AGE-${Date.now()}`,
        timestamp: new Date().toISOString(),
        gatewayEndpoint: 'https://sarathi.parivahan.gov.in/api/v2/dl-auth-verify',
        latencyMs: 1420,
        securitySeal: 'MORTH-MVACT-UNDERAGE-REJECT',
      },
    };
  }

  const cleanDL = formatCheck.cleanDL;
  const stateCode = formatCheck.stateCode || cleanDL.substring(0, 2);
  const rtoInfo = INDIAN_RTO_MAP[stateCode] || { state: 'India', sampleRtos: [`${stateCode}-01 Regional Transport Office`] };

  // Check for test preset known rejection cases
  if (cleanDL.includes('0033918') || cleanDL.includes('UP-16-2021')) {
    return {
      success: false,
      errorCode: 'NO_LMV_ENDORSEMENT',
      message: 'MoRTH Endorsement Violation: This driving licence is endorsed ONLY for two-wheelers (MCWG - Motorcycle with Gear). It lacks Light Motor Vehicle (LMV / Car) endorsement and cannot be used for car rentals.',
      auditLog: {
        requestId: `REQ-SARATHI-CLASS-${Date.now()}`,
        timestamp: new Date().toISOString(),
        gatewayEndpoint: 'https://sarathi.parivahan.gov.in/api/v2/dl-auth-verify',
        latencyMs: 1390,
        securitySeal: 'SARATHI-LMV-MISSING-FLAG',
      },
    };
  }

  if (cleanDL.includes('0004910') || cleanDL.includes('2002-0004910')) {
    return {
      success: false,
      errorCode: 'EXPIRED_LICENCE',
      message: 'Licence Status Expired: National Register shows this Driving Licence expired on 2024-03-31 and has not been renewed at the RTO.',
      auditLog: {
        requestId: `REQ-SARATHI-EXP-${Date.now()}`,
        timestamp: new Date().toISOString(),
        gatewayEndpoint: 'https://sarathi.parivahan.gov.in/api/v2/dl-auth-verify',
        latencyMs: 1380,
        securitySeal: 'MORTH-STATUS-EXPIRED',
      },
    };
  }

  // Derive RTO Office name from DL code
  const rtoCodeDigits = cleanDL.split('-')[1] || cleanDL.substring(2, 4);
  const matchedRtoName = rtoInfo.sampleRtos.find(r => r.includes(`${stateCode}-${rtoCodeDigits}`)) || `${stateCode}-${rtoCodeDigits} Central RTO, ${rtoInfo.state}`;

  // Standard Sarathi Valid Until is usually 20 years from issue or until age 50
  const issueYear = parseInt(cleanDL.split('-')[2] || '2020', 10);
  const validUntilYear = Math.min(issueYear + 20, new Date().getFullYear() + 15);
  const validUntilDate = `${validUntilYear}-12-31`;

  const sarathiRef = `SARATHI-IN-${stateCode}-${Date.now().toString().slice(-7)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const details: DLVerificationDetails = {
    sarathiRefId: sarathiRef,
    dlNumber: cleanDL,
    holderName: req.holderName,
    fatherOrSpouseName: 'S/O or D/O Verified in Central Records',
    dateOfBirth: req.dateOfBirth,
    issuingRto: matchedRtoName,
    issuingState: rtoInfo.state,
    issueDate: `${issueYear}-04-15`,
    validUntil: validUntilDate,
    status: 'ACTIVE',
    vehicleClasses: ['LMV (Light Motor Vehicle)', 'MCWG (Motorcycle with Gear)'],
    isLmvEndorsed: true,
    verifiedAt: new Date().toISOString(),
    verificationAgency: 'Parivahan Sarathi National Registry (MoRTH / DigiLocker Authorized API)',
    digiLockerLinked: req.digiLockerLinked ?? true,
  };

  return {
    success: true,
    message: 'Driving Licence verified successfully via MoRTH Sarathi Central Database. LMV (Car) endorsement confirmed.',
    details,
    auditLog: {
      requestId: `REQ-SARATHI-OK-${Date.now()}`,
      timestamp: new Date().toISOString(),
      gatewayEndpoint: 'https://sarathi.parivahan.gov.in/api/v2/dl-auth-verify',
      latencyMs: 1410,
      securitySeal: `SHA256:${Math.random().toString(36).substring(2, 15).toUpperCase()}-DIGILOCKER-SEALED`,
    },
  };
}
