import { Vehicle, Customer, Booking, PaymentTransaction, MaintenanceRecord, VehicleReview } from '../types';
import { 
  INITIAL_VEHICLES, 
  INITIAL_CUSTOMERS, 
  INITIAL_BOOKINGS, 
  INITIAL_PAYMENTS, 
  INITIAL_MAINTENANCE, 
  INITIAL_REVIEWS 
} from '../data/initialData';

const STORAGE_KEYS = {
  VEHICLES: 'crms_vehicles_v2_inr',
  CUSTOMERS: 'crms_customers_v2_inr',
  BOOKINGS: 'crms_bookings_v2_inr',
  PAYMENTS: 'crms_payments_v2_inr',
  MAINTENANCE: 'crms_maintenance_v2_inr',
  REVIEWS: 'crms_reviews_v2_inr',
  CURRENT_USER: 'crms_current_user_v2_inr',
};

export const StorageService = {
  getVehicles(): Vehicle[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VEHICLES);
      return data ? JSON.parse(data) : INITIAL_VEHICLES;
    } catch {
      return INITIAL_VEHICLES;
    }
  },

  saveVehicles(vehicles: Vehicle[]) {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
  },

  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : INITIAL_CUSTOMERS;
    } catch {
      return INITIAL_CUSTOMERS;
    }
  },

  saveCustomers(customers: Customer[]) {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  },

  getBookings(): Booking[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      return data ? JSON.parse(data) : INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  },

  saveBookings(bookings: Booking[]) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  },

  getPayments(): PaymentTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      return data ? JSON.parse(data) : INITIAL_PAYMENTS;
    } catch {
      return INITIAL_PAYMENTS;
    }
  },

  savePayments(payments: PaymentTransaction[]) {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  },

  getMaintenance(): MaintenanceRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
      return data ? JSON.parse(data) : INITIAL_MAINTENANCE;
    } catch {
      return INITIAL_MAINTENANCE;
    }
  },

  saveMaintenance(maintenance: MaintenanceRecord[]) {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(maintenance));
  },

  getReviews(): VehicleReview[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REVIEWS);
      return data ? JSON.parse(data) : INITIAL_REVIEWS;
    } catch {
      return INITIAL_REVIEWS;
    }
  },

  saveReviews(reviews: VehicleReview[]) {
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(reviews));
  },

  getCurrentUser(): Customer | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return null;
  },

  setCurrentUser(user: Customer | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  resetAll() {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(INITIAL_VEHICLES));
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(INITIAL_BOOKINGS));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, JSON.stringify(INITIAL_MAINTENANCE));
    localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(INITIAL_REVIEWS));
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};
