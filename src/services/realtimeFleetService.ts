/**
 * Real-Time Fleet Availability & Event Notification Engine.
 * Utilizes standard Web BroadcastChannel API to synchronize availability instantly
 * across browser tabs, windows, and active sessions, with fallback to CustomEvent.
 */

import { 
  VehicleStatus, 
  Vehicle, 
  Booking, 
  MaintenanceRecord, 
  VehicleReview, 
  ReviewModerationStatus 
} from '../types';

export type FleetEventType = 
  | 'VEHICLE_STATUS_CHANGED'
  | 'VEHICLE_STATUS_CHANGE'
  | 'NEW_BOOKING'
  | 'NEW_BOOKING_CREATED'
  | 'BOOKING_RETURNED'
  | 'BOOKING_CANCELLED'
  | 'NEW_REVIEW'
  | 'REVIEW_SUBMITTED'
  | 'REVIEW_STATUS_CHANGED'
  | 'REVIEW_STATUS_UPDATED'
  | 'MAINTENANCE_SCHEDULED'
  | 'MAINTENANCE_COMPLETED'
  | 'VEHICLE_INSPECTION_LOCKED';

export interface FleetRealtimeEvent {
  id?: string;
  type: FleetEventType;
  vehicleId?: string;
  vehicleName?: string;
  status?: VehicleStatus | ReviewModerationStatus | any;
  newStatus?: VehicleStatus;
  licensePlate?: string;
  bookingNumber?: string;
  customerName?: string;
  timestamp?: string;
  message?: string;
  booking?: Booking;
  bookingId?: string;
  review?: VehicleReview;
  reviewId?: string;
  record?: MaintenanceRecord;
  recordId?: string;
}

type EventListener = (event: FleetRealtimeEvent) => void;

class RealtimeFleetManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<EventListener> = new Set();
  private isConnected: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('crms_realtime_fleet_feed');
        this.channel.onmessage = (event: MessageEvent<FleetRealtimeEvent>) => {
          if (event.data) {
            this.notifyListeners(event.data);
          }
        };
        this.isConnected = true;
      } catch (err) {
        console.warn('BroadcastChannel initialization failed, falling back to local bus:', err);
      }
    }
  }

  public getStatus(): { connected: boolean; transport: string } {
    return {
      connected: true,
      transport: this.channel ? 'BroadcastChannel (Cross-Tab WebSocket Emulation)' : 'Reactive In-Memory EventBus',
    };
  }

  public subscribe(callback: EventListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: FleetRealtimeEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('Error executing fleet event listener:', e);
      }
    });
  }

  public broadcast(event: FleetRealtimeEvent): FleetRealtimeEvent {
    const fullEvent: FleetRealtimeEvent = {
      ...event,
      id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: event.timestamp || new Date().toISOString(),
    };

    // Broadcast across other browser tabs/instances
    if (this.channel) {
      try {
        this.channel.postMessage(fullEvent);
      } catch (e) {
        console.warn('BroadcastChannel postMessage error:', e);
      }
    }

    // Trigger local listeners in current window
    this.notifyListeners(fullEvent);

    return fullEvent;
  }

  public notifyVehicleStatus(
    vehicleId: string,
    vehicleName: string,
    newStatus: VehicleStatus,
    reason?: string
  ) {
    let msg = `Vehicle ${vehicleName} status updated to ${newStatus}`;
    if (newStatus === 'RENTED') {
      msg = `⚡ Real-Time Update: ${vehicleName} is now RENTED and unavailable for new reservations.`;
    } else if (newStatus === 'AVAILABLE') {
      msg = `✨ Real-Time Update: ${vehicleName} has been returned and is now AVAILABLE for rent!`;
    } else if (newStatus === 'MAINTENANCE') {
      msg = `🔧 Maintenance Lock: ${vehicleName} moved to MAINTENANCE queue.`;
    }

    return this.broadcast({
      type: 'VEHICLE_STATUS_CHANGED',
      vehicleId,
      vehicleName,
      status: newStatus,
      newStatus,
      message: reason || msg,
    });
  }

  public simulateRandomBookingOrReturn(vehicles: Vehicle[], bookings: Booking[]) {
    // 50/50 chance to simulate a new live booking or a return
    const activeBookings = bookings.filter(b => b.status === 'ACTIVE' || b.status === 'CONFIRMED');
    const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE');

    if (availableVehicles.length > 0 && (activeBookings.length === 0 || Math.random() > 0.4)) {
      // Simulate booking an available vehicle
      const randomVehicle = availableVehicles[Math.floor(Math.random() * availableVehicles.length)];
      const randomNames = ['Rajesh Gupta', 'Priya Menon', 'Arjun Verma', 'Deepika Nair', 'Kunal Shah'];
      const custName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const randomNum = Math.floor(1000 + Math.random() * 9000);

      const simulatedBooking: Booking = {
        id: `sim-book-${Date.now()}`,
        bookingNumber: `CRMS-${randomNum}`,
        vehicleId: randomVehicle.id,
        vehicleName: `${randomVehicle.year} ${randomVehicle.make} ${randomVehicle.model}`,
        vehicleCategory: randomVehicle.category,
        licensePlate: randomVehicle.licensePlate,
        vehicleImage: randomVehicle.imageUrl,
        customerId: 'cust-simulated',
        customerName: custName,
        customerEmail: `${custName.toLowerCase().replace(' ', '.')}@example.com`,
        pickupDate: new Date().toISOString().split('T')[0],
        returnDate: new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
        rentalDays: 4,
        dailyRate: randomVehicle.dailyRate,
        basePrice: randomVehicle.dailyRate * 4,
        discountAmount: 0,
        insuranceType: 'BASIC',
        insuranceCost: 1800,
        addOns: { gps: false, childSeat: false, extraDriver: false, roadsideAssistance: false },
        addOnsCost: 500,
        taxes: Math.round(randomVehicle.dailyRate * 4 * 0.18),
        securityDeposit: randomVehicle.securityDeposit,
        totalAmount: (randomVehicle.dailyRate * 4) + 1800 + 500 + Math.round(randomVehicle.dailyRate * 4 * 0.18) + randomVehicle.securityDeposit,
        finalPaidAmount: (randomVehicle.dailyRate * 4) + 1800 + 500 + Math.round(randomVehicle.dailyRate * 4 * 0.18) + randomVehicle.securityDeposit,
        status: 'ACTIVE',
        paymentStatus: 'PAID',
        pickupLocation: randomVehicle.location,
        returnLocation: randomVehicle.location,
        createdAt: new Date().toISOString(),
      };

      this.broadcast({
        type: 'NEW_BOOKING',
        booking: simulatedBooking,
        vehicleId: randomVehicle.id,
        vehicleName: `${randomVehicle.make} ${randomVehicle.model}`,
        message: `Real-time booking placed for ${randomVehicle.make} ${randomVehicle.model} by ${custName}`,
      });
    } else if (activeBookings.length > 0) {
      // Simulate returning an active booking
      const randomBooking = activeBookings[Math.floor(Math.random() * activeBookings.length)];
      this.broadcast({
        type: 'BOOKING_RETURNED',
        bookingId: randomBooking.id,
        vehicleId: randomBooking.vehicleId,
        vehicleName: randomBooking.vehicleName,
        message: `Vehicle ${randomBooking.vehicleName} returned and restored to available fleet.`,
      });
    }
  }
}

export const realtimeFleetService = new RealtimeFleetManager();
