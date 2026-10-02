export type VehicleCategory = 'Sedan' | 'SUV' | 'Luxury' | 'Electric' | 'Sports' | 'Van' | 'Hatchback' | 'Coupe';
export type TransmissionType = 'Automatic' | 'Manual';
export type FuelType = 'Petrol' | 'Diesel' | 'Electric' | 'Hybrid';
export type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RESERVED';

export interface Vehicle {
  id: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  transmission: TransmissionType;
  fuelType: FuelType;
  seats: number;
  luggageCapacity: number; // in bags
  dailyRate: number; // in INR (₹)
  securityDeposit: number; // in INR (₹)
  status: VehicleStatus;
  mileage: number; // in miles
  licensePlate: string;
  features: string[];
  imageUrl: string;
  rating: number;
  reviewCount: number;
  location: string;
  horsepower: number;
  fuelEfficiency: string; // e.g. "34 MPG" or "280 mi Range"
}

export type UserRole = 'ROLE_CUSTOMER' | 'ROLE_ADMIN';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  role: UserRole;
  memberSince: string;
  totalRentals: number;
  loyaltyPoints: number;
  avatarUrl: string;
  password?: string;
}

export type InsuranceType = 'BASIC' | 'PREMIUM' | 'COLLISION_WAIVER';

export interface AddOnOptions {
  gps: boolean;
  childSeat: boolean;
  extraDriver: boolean;
  roadsideAssistance: boolean;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PAID' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'PENDING';

export interface Booking {
  id: string;
  bookingNumber: string;
  vehicleId: string;
  vehicleName: string;
  vehicleCategory: VehicleCategory;
  vehicleImage: string;
  licensePlate: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  pickupDate: string; // ISO string YYYY-MM-DD
  returnDate: string; // ISO string YYYY-MM-DD
  pickupLocation: string;
  returnLocation: string;
  actualReturnDate?: string; // ISO string YYYY-MM-DDTHH:mm
  status: BookingStatus;
  
  // Price breakdown
  rentalDays: number;
  dailyRate: number;
  basePrice: number;
  discountAmount: number;
  discountLabel?: string;
  insuranceType: InsuranceType;
  insuranceCost: number;
  addOns: AddOnOptions;
  addOnsCost: number;
  taxes: number;
  securityDeposit: number;
  totalAmount: number;
  
  // Late fees & adjustments on return
  hoursLate?: number;
  lateFee?: number;
  fuelFee?: number;
  damageFee?: number;
  finalPaidAmount?: number;
  
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  transactionId: string;
  bookingId: string;
  bookingNumber: string;
  customerName: string;
  amount: number;
  method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NET_BANKING' | 'PAYPAL';
  status: 'SUCCESS' | 'REFUNDED' | 'PENDING';
  timestamp: string;
  cardLast4?: string;
  type: 'RENTAL_PAYMENT' | 'LATE_FEE' | 'REFUND';
}

export type MaintenanceType = 
  | 'OIL_CHANGE' 
  | 'BRAKE_INSPECTION' 
  | 'TIRE_ROTATION' 
  | 'ENGINE_DIAGNOSTIC' 
  | 'ANNUAL_SERVICE' 
  | 'CLEANING_DETAILING';

export type MaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
export type MaintenancePriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  serviceType: MaintenanceType;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  startDate: string;
  completedDate?: string;
  cost: number;
  description: string;
  technician: string;
  notes?: string;
}

export interface PriceCalculationResult {
  days: number;
  dailyRate: number;
  basePrice: number;
  discountPercent: number;
  discountAmount: number;
  discountStrategy: string;
  insuranceRate: number;
  insuranceTotal: number;
  addOnsTotal: number;
  taxes: number;
  securityDeposit: number;
  subtotal: number;
  totalAmount: number;
}

export type ReviewModerationStatus = 'APPROVED' | 'PENDING' | 'FLAGGED' | 'REJECTED';

export interface VehicleReview {
  id: string;
  vehicleId: string;
  vehicleName: string;
  bookingId: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number; // 1 to 5
  cleanlinessRating?: number;
  comfortRating?: number;
  serviceRating?: number;
  title: string;
  comment: string;
  status: ReviewModerationStatus;
  createdAt: string;
  adminNotes?: string;
  verifiedRental?: boolean;
}

// Software-Based Theft Prevention & Vehicle Telematics Security Types
export type ImmobilizerState = 'DISARMED' | 'ARMED' | 'EMERGENCY_LOCKOUT' | 'PENDING_SAFE_SHUTDOWN';

export type TheftThreatSeverity = 'CRITICAL' | 'WARNING' | 'RESOLVED' | 'INFO';

export type TheftThreatType = 
  | 'RELAY_ATTACK_DETECTED' 
  | 'GEOFENCE_BREACH' 
  | 'UNSCHEDULED_TOW_MOTION' 
  | 'UNAUTHORIZED_OBD_ACCESS' 
  | 'RF_JAMMING_ATTACK' 
  | 'PIN_ATTEMPTS_EXCEEDED' 
  | 'SAFE_IMMOBILIZER_EXECUTED';

export interface VehicleSecurityConfig {
  vehicleId: string;
  immobilizerStatus: ImmobilizerState;
  pinToDriveEnabled: boolean;
  pinCode: string; // 4-digit numeric code
  geofenceEnabled: boolean;
  geofenceZoneName: string;
  geofenceRadiusKm: number;
  centerCoordinates: { lat: number; lng: number };
  currentCoordinates: { lat: number; lng: number; address: string; speedKmh: number };
  canBusRelayProtection: boolean;
  towTamperAlarm: boolean;
  jammerDetection: boolean;
  sentryMode: boolean;
  valetSpeedLimitKmh: number | null;
  theftRiskScore: number; // 0 - 100
  lastSecurityPing: string;
  engineRunning: boolean;
  policeIncidentActive: boolean;
}

export interface TheftSecurityAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  timestamp: string;
  severity: TheftThreatSeverity;
  type: TheftThreatType;
  title: string;
  description: string;
  actionTaken: string;
  location: string;
  speedKmh: number;
  resolved: boolean;
}

// GPS Telematics & Real-Time Vehicle Tracking
export type GpsConnectionStatus = 'ONLINE' | 'ACTIVE_TRIP' | 'PARKED' | 'STANDBY' | 'SIGNAL_ALERT';

export interface GpsCoordinate {
  lat: number;
  lng: number;
  speedKmh?: number;
  timestamp?: string;
  altitudeMeters?: number;
  heading?: number; // 0 - 360 degrees
}

export interface VehicleGpsTelemetry {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  vin: string;
  category: VehicleCategory;
  imageUrl: string;
  status: VehicleStatus;
  gpsStatus: GpsConnectionStatus;
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
    speedKmh: number;
    heading: number;
    altitudeMeters: number;
    accuracyMeters: number;
    satellitesLocked: number;
  };
  activeRental?: {
    bookingId: string;
    bookingNumber: string;
    renterName: string;
    renterEmail: string;
    renterPhone: string;
    pickupLocation: string;
    returnLocation: string;
    pickupDate: string;
    returnDate: string;
    tripDistanceKm: number;
    destinationEtaMinutes: number;
  };
  breadcrumbs: GpsCoordinate[];
  batteryPercent: number;
  fuelOrChargePercent: number;
  lastPingTime: string;
  geofenceRadiusKm: number;
  isMoving: boolean;
}

export interface GeofenceNotification {
  id: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  timestamp: string;
  distanceKm: number;
  maxRadiusKm: number;
  excessKm: number;
  currentAddress: string;
  speedKmh: number;
  autoImmobilizeTriggered: boolean;
  acknowledged: boolean;
  zoneName: string;
}

export interface GeofenceSurveillanceStatus {
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  enabled: boolean;
  zoneName: string;
  centerCoordinates: { lat: number; lng: number };
  currentCoordinates: { lat: number; lng: number; address: string; speedKmh: number };
  radiusKm: number;
  currentDistanceKm: number;
  usagePercentage: number;
  isBreached: boolean;
  excessDistanceKm: number;
  lastBreachTimestamp?: string;
}


