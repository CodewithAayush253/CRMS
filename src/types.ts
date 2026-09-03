export type VehicleCategory = 'Sedan' | 'SUV' | 'Luxury' | 'Electric' | 'Sports' | 'Van';
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

