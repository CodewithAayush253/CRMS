import { Vehicle, Booking, VehicleGpsTelemetry, GpsCoordinate, GpsConnectionStatus } from '../types';

const STORAGE_KEY_GPS_DATA = 'crms_gps_telemetry_v1';

// Preset high-fidelity coordinates across major operational hubs (NCR, Mumbai, Bengaluru)
const DEFAULT_LOCATIONS: Record<string, { lat: number; lng: number; address: string; heading: number }> = {
  'veh-1': { lat: 28.5562, lng: 77.1000, address: 'Aerocity Metro Corridor, New Delhi', heading: 45 },
  'veh-2': { lat: 28.5355, lng: 77.3910, address: 'Noida-Greater Noida Expressway, Sector 128', heading: 135 },
  'veh-3': { lat: 12.9279, lng: 77.6271, address: 'Koramangala 4th Block, Bengaluru', heading: 270 },
  'veh-4': { lat: 19.0660, lng: 72.8687, address: 'Bandra Kurla Complex (BKC), Mumbai', heading: 180 },
  'veh-5': { lat: 28.4984, lng: 77.0926, address: 'DLF Cyber City, Phase 2, Gurugram', heading: 90 },
  'veh-6': { lat: 28.5244, lng: 77.2066, address: 'Saket District Centre, New Delhi', heading: 315 },
  'veh-7': { lat: 28.5612, lng: 77.0982, address: 'Terminal 3 Departure Flyover, IGI Airport', heading: 80 },
  'veh-8': { lat: 19.0886, lng: 72.8679, address: 'Chhatrapati Shivaji Maharaj Airport T2, Mumbai', heading: 220 },
  'veh-9': { lat: 12.9716, lng: 77.5946, address: 'MG Road Metro Station, Bengaluru', heading: 110 },
  'veh-10': { lat: 28.6139, lng: 77.2090, address: 'Connaught Place Inner Circle, New Delhi', heading: 0 },
};

class GpsTrackingService {
  private telemetryMap: Map<string, VehicleGpsTelemetry> = new Map();
  private subscribers: Set<(data: VehicleGpsTelemetry[]) => void> = new Set();
  private timer: any = null;

  constructor() {
    this.startLiveSimulation();
  }

  public initialize(vehicles: Vehicle[], bookings: Booking[]) {
    const activeBookingsByVehicle = new Map<string, Booking>();
    bookings.forEach(b => {
      if (b.status === 'ACTIVE' || b.status === 'CONFIRMED') {
        activeBookingsByVehicle.set(b.vehicleId, b);
      }
    });

    vehicles.forEach(vehicle => {
      const activeBooking = activeBookingsByVehicle.get(vehicle.id);
      const isRented = vehicle.status === 'RENTED' || !!activeBooking;
      const baseLoc = DEFAULT_LOCATIONS[vehicle.id] || {
        lat: 28.5500 + (Math.random() - 0.5) * 0.1,
        lng: 77.1500 + (Math.random() - 0.5) * 0.1,
        address: `${vehicle.location || 'Central Fleet Terminal'}`,
        heading: Math.floor(Math.random() * 360)
      };

      const existing = this.telemetryMap.get(vehicle.id);
      const speed = isRented ? (existing?.currentLocation.speedKmh || Math.floor(35 + Math.random() * 45)) : 0;
      const isMoving = speed > 0;

      // Seed realistic historic breadcrumbs for trip line rendering
      const breadcrumbs: GpsCoordinate[] = existing?.breadcrumbs?.length ? existing.breadcrumbs : [
        { lat: baseLoc.lat - 0.015, lng: baseLoc.lng - 0.018, speedKmh: Math.max(0, speed - 12), timestamp: new Date(Date.now() - 15 * 60000).toISOString() },
        { lat: baseLoc.lat - 0.010, lng: baseLoc.lng - 0.011, speedKmh: Math.max(0, speed - 5), timestamp: new Date(Date.now() - 10 * 60000).toISOString() },
        { lat: baseLoc.lat - 0.005, lng: baseLoc.lng - 0.004, speedKmh: speed, timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
        { lat: baseLoc.lat, lng: baseLoc.lng, speedKmh: speed, timestamp: new Date().toISOString() },
      ];

      const telemetry: VehicleGpsTelemetry = {
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.make} ${vehicle.model}`,
        licensePlate: vehicle.licensePlate,
        vin: vehicle.vin,
        category: vehicle.category,
        imageUrl: vehicle.imageUrl,
        status: isRented ? 'RENTED' : vehicle.status,
        gpsStatus: isRented ? (isMoving ? 'ACTIVE_TRIP' : 'PARKED') : 'ONLINE',
        currentLocation: {
          lat: existing?.currentLocation.lat || baseLoc.lat,
          lng: existing?.currentLocation.lng || baseLoc.lng,
          address: baseLoc.address,
          speedKmh: speed,
          heading: existing?.currentLocation.heading || baseLoc.heading,
          altitudeMeters: Math.floor(210 + Math.random() * 25),
          accuracyMeters: 1.2,
          satellitesLocked: 14,
        },
        activeRental: activeBooking ? {
          bookingId: activeBooking.id,
          bookingNumber: activeBooking.bookingNumber,
          renterName: activeBooking.customerName,
          renterEmail: activeBooking.customerEmail,
          renterPhone: '+91 98' + Math.floor(10000000 + Math.random() * 90000000),
          pickupLocation: activeBooking.pickupLocation,
          returnLocation: activeBooking.returnLocation,
          pickupDate: activeBooking.pickupDate,
          returnDate: activeBooking.returnDate,
          tripDistanceKm: Math.floor(34 + Math.random() * 45),
          destinationEtaMinutes: Math.floor(18 + Math.random() * 25),
        } : undefined,
        breadcrumbs,
        batteryPercent: Math.floor(82 + Math.random() * 15),
        fuelOrChargePercent: Math.floor(65 + Math.random() * 30),
        lastPingTime: new Date().toISOString(),
        geofenceRadiusKm: 50,
        isMoving,
      };

      this.telemetryMap.set(vehicle.id, telemetry);
    });

    this.notifySubscribers();
  }

  public getTelemetry(vehicleId: string): VehicleGpsTelemetry | undefined {
    return this.telemetryMap.get(vehicleId);
  }

  public getAllTelemetry(): VehicleGpsTelemetry[] {
    return Array.from(this.telemetryMap.values());
  }

  public getRentedVehiclesTelemetry(): VehicleGpsTelemetry[] {
    return Array.from(this.telemetryMap.values()).filter(t => t.status === 'RENTED' || !!t.activeRental);
  }

  public subscribe(callback: (data: VehicleGpsTelemetry[]) => void): () => void {
    this.subscribers.add(callback);
    callback(this.getAllTelemetry());
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notifySubscribers() {
    const list = this.getAllTelemetry();
    this.subscribers.forEach(cb => cb(list));
  }

  /**
   * Continuous background GPS telematics ping and coordinate progression
   */
  private startLiveSimulation() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.simulationStep();
    }, 3500);
  }

  public simulationStep() {
    let hasChanges = false;

    this.telemetryMap.forEach((tel, vId) => {
      if (tel.isMoving && tel.currentLocation.speedKmh > 0) {
        // Move vehicle in direction of heading slightly (~0.0003 deg per tick)
        const rad = (tel.currentLocation.heading * Math.PI) / 180;
        const deltaLat = Math.cos(rad) * 0.00028;
        const deltaLng = Math.sin(rad) * 0.00028;

        const newLat = tel.currentLocation.lat + deltaLat;
        const newLng = tel.currentLocation.lng + deltaLng;
        const speedVariance = Math.floor((Math.random() - 0.45) * 4);
        const newSpeed = Math.max(15, Math.min(105, tel.currentLocation.speedKmh + speedVariance));

        // Slight heading drift along road curves
        const newHeading = (tel.currentLocation.heading + (Math.random() - 0.5) * 6 + 360) % 360;

        const newPoint: GpsCoordinate = {
          lat: newLat,
          lng: newLng,
          speedKmh: newSpeed,
          heading: Math.round(newHeading),
          timestamp: new Date().toISOString()
        };

        const updatedBreadcrumbs = [...tel.breadcrumbs.slice(-25), newPoint];

        this.telemetryMap.set(vId, {
          ...tel,
          currentLocation: {
            ...tel.currentLocation,
            lat: newLat,
            lng: newLng,
            speedKmh: newSpeed,
            heading: Math.round(newHeading),
          },
          breadcrumbs: updatedBreadcrumbs,
          lastPingTime: new Date().toISOString(),
        });
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.notifySubscribers();
    }
  }

  /**
   * Ping GPS receiver immediately
   */
  public pingVehicleGps(vehicleId: string): VehicleGpsTelemetry | undefined {
    const item = this.telemetryMap.get(vehicleId);
    if (!item) return undefined;

    const updated: VehicleGpsTelemetry = {
      ...item,
      lastPingTime: new Date().toISOString(),
      currentLocation: {
        ...item.currentLocation,
        accuracyMeters: 0.9,
        satellitesLocked: 16,
      }
    };
    this.telemetryMap.set(vehicleId, updated);
    this.notifySubscribers();
    return updated;
  }

  /**
   * Trigger Remote Horn / Hazard Lights chirp
   */
  public triggerChirp(vehicleId: string): boolean {
    const item = this.telemetryMap.get(vehicleId);
    if (!item) return false;
    // Broadcast event
    return true;
  }
}

export const gpsTrackingService = new GpsTrackingService();
