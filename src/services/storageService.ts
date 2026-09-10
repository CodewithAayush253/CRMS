import { db } from '../lib/firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { Vehicle, Customer, Booking, PaymentTransaction, MaintenanceRecord, VehicleReview } from '../types';
import { 
  INITIAL_VEHICLES, 
  INITIAL_CUSTOMERS, 
  INITIAL_BOOKINGS, 
  INITIAL_PAYMENTS, 
  INITIAL_MAINTENANCE, 
  INITIAL_REVIEWS 
} from '../data/initialData';

const COLLECTIONS = {
  VEHICLES: 'vehicles',
  CUSTOMERS: 'customers',
  BOOKINGS: 'bookings',
  PAYMENTS: 'payments',
  MAINTENANCE: 'maintenance',
  REVIEWS: 'reviews',
};

const STORAGE_KEYS = {
  CURRENT_USER: 'crms_current_user_v2_inr',
};

// Helper to get collection items with instant local/initial fallback and background sync
async function seedCollectionIfEmpty<T extends { id: string }>(collectionName: string, initialData: T[]): Promise<T[]> {
  const localKey = `crms_${collectionName}_v2`;

  // Try fetching from Firestore first
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const remoteItems: T[] = [];
      snapshot.forEach((docSnap) => {
        remoteItems.push(docSnap.data() as T);
      });
      localStorage.setItem(localKey, JSON.stringify(remoteItems));
      return remoteItems;
    } else {
      // Seed Firestore if empty with initialData
      const items = [...initialData];
      for (const item of items) {
        await setDoc(doc(db, collectionName, String(item.id)), item);
      }
      localStorage.setItem(localKey, JSON.stringify(items));
      return items;
    }
  } catch (err) {
    console.warn(`Firestore sync note for ${collectionName}:`, err);
    // Fallback to local storage if offline/error
    const local = localStorage.getItem(localKey);
    if (local) {
      return JSON.parse(local);
    }
    const items = [...initialData];
    localStorage.setItem(localKey, JSON.stringify(items));
    return items;
  }
}

async function saveCollectionToFirestore<T extends { id: string }>(collectionName: string, items: T[]) {
  try {
    for (const item of items) {
      await setDoc(doc(db, collectionName, String(item.id)), item);
    }
  } catch (err) {
    console.warn(`Firestore save fallback for ${collectionName}:`, err);
    localStorage.setItem(`crms_${collectionName}_v2`, JSON.stringify(items));
  }
}

export const StorageService = {
  async getVehicles(): Promise<Vehicle[]> {
    return await seedCollectionIfEmpty(COLLECTIONS.VEHICLES, INITIAL_VEHICLES);
  },

  async saveVehicles(vehicles: Vehicle[]) {
    await saveCollectionToFirestore(COLLECTIONS.VEHICLES, vehicles);
  },

  async deleteVehicle(vehicleId: string) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.VEHICLES, String(vehicleId)));
    } catch (err) {
      console.warn('Firestore delete vehicle note:', err);
    }
    // Also update local storage cache
    const localKey = `crms_${COLLECTIONS.VEHICLES}_v2`;
    const local = localStorage.getItem(localKey);
    if (local) {
      try {
        const vehicles: Vehicle[] = JSON.parse(local);
        const updated = vehicles.filter(v => v.id !== vehicleId);
        localStorage.setItem(localKey, JSON.stringify(updated));
      } catch (e) {
        console.error('Error updating local cache on delete:', e);
      }
    }
  },

  async getCustomers(): Promise<Customer[]> {
    const list = await seedCollectionIfEmpty(COLLECTIONS.CUSTOMERS, INITIAL_CUSTOMERS);
    
    // Guarantee admin
    const adminIdx = list.findIndex(c => c.email.toLowerCase() === 'av8279@admin.crms');
    const adminUser: Customer = {
      id: 'admin-1',
      name: 'Aayush (Fleet Admin)',
      email: 'av8279@admin.crms',
      phone: '+91 98100 00001',
      licenseNumber: 'DL-01-2015-1122334',
      role: 'ROLE_ADMIN',
      memberSince: '2022-01-10',
      totalRentals: 0,
      loyaltyPoints: 99999,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      password: 'Aayush@2005',
    };

    if (adminIdx === -1) {
      list.push(adminUser);
      await setDoc(doc(db, COLLECTIONS.CUSTOMERS, 'admin-1'), adminUser);
    } else {
      list[adminIdx].password = 'Aayush@2005';
      list[adminIdx].role = 'ROLE_ADMIN';
      list[adminIdx].name = 'Aayush (Fleet Admin)';
    }
    return list;
  },

  async saveCustomers(customers: Customer[]) {
    await saveCollectionToFirestore(COLLECTIONS.CUSTOMERS, customers);
  },

  async getBookings(): Promise<Booking[]> {
    return await seedCollectionIfEmpty(COLLECTIONS.BOOKINGS, INITIAL_BOOKINGS);
  },

  async saveBookings(bookings: Booking[]) {
    await saveCollectionToFirestore(COLLECTIONS.BOOKINGS, bookings);
  },

  async getPayments(): Promise<PaymentTransaction[]> {
    return await seedCollectionIfEmpty(COLLECTIONS.PAYMENTS, INITIAL_PAYMENTS);
  },

  async savePayments(payments: PaymentTransaction[]) {
    await saveCollectionToFirestore(COLLECTIONS.PAYMENTS, payments);
  },

  async getMaintenance(): Promise<MaintenanceRecord[]> {
    return await seedCollectionIfEmpty(COLLECTIONS.MAINTENANCE, INITIAL_MAINTENANCE);
  },

  async saveMaintenance(maintenance: MaintenanceRecord[]) {
    await saveCollectionToFirestore(COLLECTIONS.MAINTENANCE, maintenance);
  },

  async getReviews(): Promise<VehicleReview[]> {
    return await seedCollectionIfEmpty(COLLECTIONS.REVIEWS, INITIAL_REVIEWS);
  },

  async saveReviews(reviews: VehicleReview[]) {
    await saveCollectionToFirestore(COLLECTIONS.REVIEWS, reviews);
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

  saveCurrentUser(customer: Customer | null) {
    if (customer) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(customer));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  setCurrentUser(customer: Customer | null) {
    this.saveCurrentUser(customer);
  },

  resetAll() {
    localStorage.clear();
    window.location.reload();
  }
};
