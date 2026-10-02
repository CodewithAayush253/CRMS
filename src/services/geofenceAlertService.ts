import { GeofenceNotification, GeofenceSurveillanceStatus, VehicleSecurityConfig } from '../types';
import { theftPreventionService } from './theftPreventionService';
import { gpsTrackingService } from './gpsTrackingService';

const STORAGE_KEY_GEOFENCE_NOTIFICATIONS = 'crms_geofence_notifications_v1';
const STORAGE_KEY_AUDIO_MUTED = 'crms_geofence_audio_muted_v1';
const STORAGE_KEY_AUTO_IMMOBILIZE = 'crms_geofence_auto_kill_v1';

// Calculate Great Circle Distance in KM using Haversine formula
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Professional Web Audio Synthesizer Dual-Tone Chime
export function playGeofenceSirenChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(780, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1240, ctx.currentTime + 0.18);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.36);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1450, ctx.currentTime + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.45);
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.2);
    osc2.stop(ctx.currentTime + 0.58);
  } catch (err) {
    console.debug('Geofence audio chime blocked or unavailable:', err);
  }
}

class GeofenceAlertService {
  private notifications: GeofenceNotification[] = [];
  private audioMuted: boolean = false;
  private autoImmobilizeOnBreach: boolean = true;
  private subscribers: Set<() => void> = new Set();
  private watchdogInterval: any = null;
  private lastBreachNotificationTime: Map<string, number> = new Map();

  constructor() {
    this.loadState();
    this.startWatchdog();
  }

  private loadState() {
    try {
      const storedNotifs = localStorage.getItem(STORAGE_KEY_GEOFENCE_NOTIFICATIONS);
      if (storedNotifs) {
        this.notifications = JSON.parse(storedNotifs);
      } else {
        // Seed initial geofence notification example for immediate admin visibility
        this.notifications = [
          {
            id: 'geo-notif-initial',
            vehicleId: 'veh-5',
            vehicleName: 'Hyundai Creta SX',
            licensePlate: 'HR-26-CR-9082',
            timestamp: new Date(Date.now() - 42 * 60000).toISOString(),
            distanceKm: 38.6,
            maxRadiusKm: 35,
            excessKm: 3.6,
            currentAddress: 'Sohna Elevated Corridor Outer Mile (Outside 35km Zone)',
            speedKmh: 54,
            autoImmobilizeTriggered: false,
            acknowledged: false,
            zoneName: 'Delhi-Gurugram Cyber City (35 km)',
          }
        ];
        this.saveNotifications();
      }

      const storedMute = localStorage.getItem(STORAGE_KEY_AUDIO_MUTED);
      if (storedMute !== null) {
        this.audioMuted = storedMute === 'true';
      }

      const storedAutoKill = localStorage.getItem(STORAGE_KEY_AUTO_IMMOBILIZE);
      if (storedAutoKill !== null) {
        this.autoImmobilizeOnBreach = storedAutoKill === 'true';
      }
    } catch (e) {
      console.warn('Failed loading geofence alert service state:', e);
    }
  }

  private saveNotifications() {
    try {
      localStorage.setItem(STORAGE_KEY_GEOFENCE_NOTIFICATIONS, JSON.stringify(this.notifications));
    } catch (e) {
      console.warn('Failed saving geofence notifications:', e);
    }
  }

  public subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  private notify() {
    this.subscribers.forEach(cb => cb());
  }

  public getNotifications(): GeofenceNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter(n => !n.acknowledged).length;
  }

  public isAudioMuted(): boolean {
    return this.audioMuted;
  }

  public toggleAudioMute(): boolean {
    this.audioMuted = !this.audioMuted;
    localStorage.setItem(STORAGE_KEY_AUDIO_MUTED, String(this.audioMuted));
    this.notify();
    return this.audioMuted;
  }

  public isAutoImmobilizeEnabled(): boolean {
    return this.autoImmobilizeOnBreach;
  }

  public toggleAutoImmobilize(): boolean {
    this.autoImmobilizeOnBreach = !this.autoImmobilizeOnBreach;
    localStorage.setItem(STORAGE_KEY_AUTO_IMMOBILIZE, String(this.autoImmobilizeOnBreach));
    this.notify();
    return this.autoImmobilizeOnBreach;
  }

  public acknowledgeNotification(id: string) {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, acknowledged: true } : n);
    this.saveNotifications();
    this.notify();
  }

  public acknowledgeAll() {
    this.notifications = this.notifications.map(n => ({ ...n, acknowledged: true }));
    this.saveNotifications();
    this.notify();
  }

  public clearAll() {
    this.notifications = [];
    this.saveNotifications();
    this.notify();
  }

  /**
   * Continuous Watchdog: inspects all vehicles against their pre-defined GPS geofence boundary.
   */
  public evaluateFleetGeofences() {
    const configs = theftPreventionService.getAllConfigs();
    let hasNewBreach = false;

    configs.forEach(config => {
      if (!config.geofenceEnabled) return;

      const dist = calculateDistanceKm(
        config.currentCoordinates.lat,
        config.currentCoordinates.lng,
        config.centerCoordinates.lat,
        config.centerCoordinates.lng
      );

      const isBreached = dist > config.geofenceRadiusKm;

      if (isBreached) {
        const lastNotif = this.lastBreachNotificationTime.get(config.vehicleId) || 0;
        const now = Date.now();

        // Throttle repeated notifications for the same breach to once per 2 minutes unless re-triggered
        if (now - lastNotif > 120000) {
          this.lastBreachNotificationTime.set(config.vehicleId, now);

          const excess = Number((dist - config.geofenceRadiusKm).toFixed(2));
          const autoKill = this.autoImmobilizeOnBreach;

          const notif: GeofenceNotification = {
            id: `geo-notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            vehicleId: config.vehicleId,
            vehicleName: `Vehicle ${config.vehicleId}`,
            licensePlate: 'FLEET',
            timestamp: new Date().toISOString(),
            distanceKm: dist,
            maxRadiusKm: config.geofenceRadiusKm,
            excessKm: excess,
            currentAddress: config.currentCoordinates.address,
            speedKmh: config.currentCoordinates.speedKmh,
            autoImmobilizeTriggered: autoKill,
            acknowledged: false,
            zoneName: config.geofenceZoneName,
          };

          // Find telemetry or vehicle to enrich name & plate
          const tel = gpsTrackingService.getTelemetry(config.vehicleId);
          if (tel) {
            notif.vehicleName = tel.vehicleName;
            notif.licensePlate = tel.licensePlate;
          }

          this.notifications = [notif, ...this.notifications].slice(0, 50);
          this.saveNotifications();
          hasNewBreach = true;

          // Also register alert in Anti-Theft center
          theftPreventionService.addAlert({
            vehicleId: config.vehicleId,
            vehicleName: notif.vehicleName,
            licensePlate: notif.licensePlate,
            severity: 'CRITICAL',
            type: 'GEOFENCE_BREACH',
            title: `Automated Geofence Breach: ${notif.vehicleName} (${notif.licensePlate})`,
            description: `Vehicle traveled ${dist} km from center, exceeding the ${config.geofenceRadiusKm} km authorized boundary by +${excess} km at ${config.currentCoordinates.speedKmh} km/h.`,
            actionTaken: autoKill 
              ? 'Safe Immobilizer auto-armed: Powertrain lockout queued for 0 km/h standstill.' 
              : 'Admin emergency notification dispatched; high-frequency GPS ping active.',
            location: config.currentCoordinates.address,
            speedKmh: config.currentCoordinates.speedKmh,
            resolved: false,
          });

          // If auto-kill is enabled, prime immobilizer
          if (autoKill && config.immobilizerStatus !== 'EMERGENCY_LOCKOUT') {
            theftPreventionService.triggerImmobilizer(
              config.vehicleId,
              notif.vehicleName,
              notif.licensePlate
            );
          }
        }
      }
    });

    if (hasNewBreach) {
      if (!this.audioMuted) {
        playGeofenceSirenChime();
      }
      this.notify();
    }
  }

  private startWatchdog() {
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);
    // Run evaluation every 3 seconds
    this.watchdogInterval = setInterval(() => {
      this.evaluateFleetGeofences();
    }, 3200);
  }

  /**
   * Returns complete geofence surveillance statuses for UI table and cards
   */
  public getSurveillanceStatuses(): GeofenceSurveillanceStatus[] {
    const configs = theftPreventionService.getAllConfigs();
    return configs.map(cfg => {
      const tel = gpsTrackingService.getTelemetry(cfg.vehicleId);
      const dist = calculateDistanceKm(
        cfg.currentCoordinates.lat,
        cfg.currentCoordinates.lng,
        cfg.centerCoordinates.lat,
        cfg.centerCoordinates.lng
      );
      const isBreached = dist > cfg.geofenceRadiusKm && cfg.geofenceEnabled;
      const usagePct = Math.round((dist / Math.max(1, cfg.geofenceRadiusKm)) * 100);
      const excess = isBreached ? Number((dist - cfg.geofenceRadiusKm).toFixed(2)) : 0;

      return {
        vehicleId: cfg.vehicleId,
        vehicleName: tel ? tel.vehicleName : `Vehicle ${cfg.vehicleId}`,
        licensePlate: tel ? tel.licensePlate : 'FLEET-PLATE',
        enabled: cfg.geofenceEnabled,
        zoneName: cfg.geofenceZoneName,
        centerCoordinates: cfg.centerCoordinates,
        currentCoordinates: cfg.currentCoordinates,
        radiusKm: cfg.geofenceRadiusKm,
        currentDistanceKm: dist,
        usagePercentage: usagePct,
        isBreached,
        excessDistanceKm: excess,
      };
    });
  }

  /**
   * Simulate a vehicle breaching its geofence boundary immediately
   * (e.g. moves 60km away and fires real-time notification)
   */
  public simulateBreach(vehicleId: string): GeofenceNotification {
    const config = theftPreventionService.getConfig(vehicleId);
    const tel = gpsTrackingService.getTelemetry(vehicleId);
    
    // Shift coords far enough to breach radius
    const breachDistance = config.geofenceRadiusKm + 12.5;
    // approx 0.01 deg per km
    const deltaDeg = (breachDistance / 111);
    const newLat = config.centerCoordinates.lat + deltaDeg;
    const newLng = config.centerCoordinates.lng + deltaDeg * 0.7;

    const newCoords = {
      lat: Number(newLat.toFixed(5)),
      lng: Number(newLng.toFixed(5)),
      address: `Interstate Highway Bypass (Out of Bounds: ${breachDistance.toFixed(1)} km from ${config.geofenceZoneName})`,
      speedKmh: 68,
    };

    theftPreventionService.updateConfig(vehicleId, {
      currentCoordinates: newCoords,
      theftRiskScore: 94,
    });

    const notif: GeofenceNotification = {
      id: `geo-notif-${Date.now()}`,
      vehicleId,
      vehicleName: tel?.vehicleName || 'Vehicle',
      licensePlate: tel?.licensePlate || 'FLEET',
      timestamp: new Date().toISOString(),
      distanceKm: breachDistance,
      maxRadiusKm: config.geofenceRadiusKm,
      excessKm: 12.5,
      currentAddress: newCoords.address,
      speedKmh: 68,
      autoImmobilizeTriggered: this.autoImmobilizeOnBreach,
      acknowledged: false,
      zoneName: config.geofenceZoneName,
    };

    this.notifications = [notif, ...this.notifications];
    this.saveNotifications();
    this.lastBreachNotificationTime.set(vehicleId, Date.now());

    theftPreventionService.addAlert({
      vehicleId,
      vehicleName: notif.vehicleName,
      licensePlate: notif.licensePlate,
      severity: 'CRITICAL',
      type: 'GEOFENCE_BREACH',
      title: `Automated Geofence Breach: ${notif.vehicleName} (${notif.licensePlate})`,
      description: `Vehicle exited authorized radius of ${config.geofenceRadiusKm} km (Distance: ${breachDistance.toFixed(1)} km, +12.5 km outside boundary) at 68 km/h.`,
      actionTaken: this.autoImmobilizeOnBreach
        ? 'Safe Remote Engine Kill Switch primed: decelerating to 0 km/h for shutdown.'
        : 'In-app siren sounded; admin notification triggered.',
      location: newCoords.address,
      speedKmh: 68,
      resolved: false,
    });

    if (this.autoImmobilizeOnBreach) {
      theftPreventionService.triggerImmobilizer(vehicleId, notif.vehicleName, notif.licensePlate);
    }

    if (!this.audioMuted) {
      playGeofenceSirenChime();
    }

    this.notify();
    return notif;
  }

  /**
   * Return vehicle back within safe geofence boundary
   */
  public returnVehicleToSafeBoundary(vehicleId: string) {
    const config = theftPreventionService.getConfig(vehicleId);
    const safeCoords = {
      lat: config.centerCoordinates.lat + 0.02,
      lng: config.centerCoordinates.lng + 0.02,
      address: `Safe Fleet Zone (Within ${config.geofenceZoneName})`,
      speedKmh: 0,
    };

    theftPreventionService.updateConfig(vehicleId, {
      currentCoordinates: safeCoords,
      theftRiskScore: Math.min(config.theftRiskScore, 10),
    });

    // Mark notifications for this vehicle as acknowledged
    this.notifications = this.notifications.map(n => 
      n.vehicleId === vehicleId ? { ...n, acknowledged: true } : n
    );
    this.saveNotifications();
    this.notify();
  }

  /**
   * Update vehicle's pre-defined geofence radius and zone
   */
  public updateVehicleGeofenceBoundary(vehicleId: string, radiusKm: number, zoneName?: string) {
    theftPreventionService.updateConfig(vehicleId, {
      geofenceRadiusKm: radiusKm,
      geofenceZoneName: zoneName || theftPreventionService.getConfig(vehicleId).geofenceZoneName,
    });
    this.notify();
  }
}

export const geofenceAlertService = new GeofenceAlertService();
