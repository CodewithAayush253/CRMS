import { VehicleSecurityConfig, TheftSecurityAlert, ImmobilizerState, TheftThreatType } from '../types';
import { realtimeFleetService } from './realtimeFleetService';

const STORAGE_KEY_CONFIGS = 'crms_vehicle_security_configs_v1';
const STORAGE_KEY_ALERTS = 'crms_theft_security_alerts_v1';

// Initial realistic security configurations mapped to fleet vehicles
export const INITIAL_SECURITY_CONFIGS: VehicleSecurityConfig[] = [
  {
    vehicleId: 'veh-1', // Tesla Model 3
    immobilizerStatus: 'ARMED',
    pinToDriveEnabled: true,
    pinCode: '7412',
    geofenceEnabled: true,
    geofenceZoneName: 'Delhi NCR Metro Zone (50 km)',
    geofenceRadiusKm: 50,
    centerCoordinates: { lat: 28.5562, lng: 77.1000 },
    currentCoordinates: { lat: 28.5612, lng: 77.0982, address: 'Aerocity, Near Terminal 3, New Delhi', speedKmh: 0 },
    canBusRelayProtection: true,
    towTamperAlarm: true,
    jammerDetection: true,
    sentryMode: true,
    valetSpeedLimitKmh: 85,
    theftRiskScore: 4, // Very Safe
    lastSecurityPing: new Date(Date.now() - 45000).toISOString(),
    engineRunning: false,
    policeIncidentActive: false,
  },
  {
    vehicleId: 'veh-2', // BMW 530i
    immobilizerStatus: 'DISARMED',
    pinToDriveEnabled: true,
    pinCode: '3920',
    geofenceEnabled: true,
    geofenceZoneName: 'Delhi-Jaipur Highway Corridor',
    geofenceRadiusKm: 65,
    centerCoordinates: { lat: 28.6139, lng: 77.2090 },
    currentCoordinates: { lat: 28.5355, lng: 77.3910, address: 'Noida Expressway, Sector 128', speedKmh: 42 },
    canBusRelayProtection: true,
    towTamperAlarm: true,
    jammerDetection: true,
    sentryMode: false,
    valetSpeedLimitKmh: 120,
    theftRiskScore: 12,
    lastSecurityPing: new Date(Date.now() - 12000).toISOString(),
    engineRunning: true,
    policeIncidentActive: false,
  },
  {
    vehicleId: 'veh-3', // Toyota RAV4 Hybrid
    immobilizerStatus: 'DISARMED',
    pinToDriveEnabled: false,
    pinCode: '1100',
    geofenceEnabled: true,
    geofenceZoneName: 'Bengaluru Tech Corridor (40 km)',
    geofenceRadiusKm: 40,
    centerCoordinates: { lat: 12.9716, lng: 77.5946 },
    currentCoordinates: { lat: 12.9279, lng: 77.6271, address: 'Koramangala 4th Block, Bengaluru', speedKmh: 0 },
    canBusRelayProtection: true,
    towTamperAlarm: true,
    jammerDetection: false,
    sentryMode: false,
    valetSpeedLimitKmh: 80,
    theftRiskScore: 18,
    lastSecurityPing: new Date(Date.now() - 95000).toISOString(),
    engineRunning: false,
    policeIncidentActive: false,
  },
  {
    vehicleId: 'veh-4', // Mercedes-Benz C300
    immobilizerStatus: 'ARMED',
    pinToDriveEnabled: true,
    pinCode: '8834',
    geofenceEnabled: true,
    geofenceZoneName: 'Mumbai Metropolitan Region (MMR)',
    geofenceRadiusKm: 45,
    centerCoordinates: { lat: 19.0760, lng: 72.8777 },
    currentCoordinates: { lat: 19.0886, lng: 72.8679, address: 'BKC Financial Center, Mumbai', speedKmh: 0 },
    canBusRelayProtection: true,
    towTamperAlarm: true,
    jammerDetection: true,
    sentryMode: true,
    valetSpeedLimitKmh: 90,
    theftRiskScore: 6,
    lastSecurityPing: new Date(Date.now() - 30000).toISOString(),
    engineRunning: false,
    policeIncidentActive: false,
  },
  {
    vehicleId: 'veh-5', // Hyundai Creta SX
    immobilizerStatus: 'DISARMED',
    pinToDriveEnabled: false,
    pinCode: '5521',
    geofenceEnabled: true,
    geofenceZoneName: 'Delhi-Gurugram Cyber City (35 km)',
    geofenceRadiusKm: 35,
    centerCoordinates: { lat: 28.4595, lng: 77.0266 },
    currentCoordinates: { lat: 28.4984, lng: 77.0926, address: 'Cyber Hub, DLF Phase 2, Gurugram', speedKmh: 28 },
    canBusRelayProtection: false,
    towTamperAlarm: true,
    jammerDetection: false,
    sentryMode: false,
    valetSpeedLimitKmh: null,
    theftRiskScore: 32,
    lastSecurityPing: new Date(Date.now() - 5000).toISOString(),
    engineRunning: true,
    policeIncidentActive: false,
  },
  {
    vehicleId: 'veh-6', // Ford Mustang GT
    immobilizerStatus: 'ARMED',
    pinToDriveEnabled: true,
    pinCode: '9021',
    geofenceEnabled: true,
    geofenceZoneName: 'South Delhi Luxury Circuit',
    geofenceRadiusKm: 30,
    centerCoordinates: { lat: 28.5355, lng: 77.2410 },
    currentCoordinates: { lat: 28.5244, lng: 77.2066, address: 'Saket District Centre, New Delhi', speedKmh: 0 },
    canBusRelayProtection: true,
    towTamperAlarm: true,
    jammerDetection: true,
    sentryMode: true,
    valetSpeedLimitKmh: 100,
    theftRiskScore: 8,
    lastSecurityPing: new Date(Date.now() - 15000).toISOString(),
    engineRunning: false,
    policeIncidentActive: false,
  }
];

export const INITIAL_SECURITY_ALERTS: TheftSecurityAlert[] = [
  {
    id: 'sec-alert-1',
    vehicleId: 'veh-2',
    vehicleName: 'BMW 530i xDrive M-Sport',
    licensePlate: 'DL-03-BM-5309',
    timestamp: new Date(Date.now() - 18 * 60000).toISOString(),
    severity: 'WARNING',
    type: 'RELAY_ATTACK_DETECTED',
    title: 'CAN-Bus Keyless Relay Attack Thwarted',
    description: 'High-gain RF relay attempt detected at keyless receiver. Cryptographic Time-of-Flight (ToF) check failed due to 48ms signal propagation delay. Starter solenoid blocked.',
    actionTaken: 'Ignition authorization denied; keyless entry temporarily switched to fallback PIN-to-Drive requirement.',
    location: 'Connaught Place Outer Circle, New Delhi',
    speedKmh: 0,
    resolved: true,
  },
  {
    id: 'sec-alert-2',
    vehicleId: 'veh-5',
    vehicleName: 'Hyundai Creta SX',
    licensePlate: 'HR-26-CR-9082',
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    severity: 'INFO',
    type: 'PIN_ATTEMPTS_EXCEEDED',
    title: 'PIN-to-Drive Authentication Challenge',
    description: 'User successfully authenticated secondary PIN-to-Drive after two incorrect dashboard entries.',
    actionTaken: 'Starter relay verified and disarmed for authenticated driver.',
    location: 'Cyber Hub Parking, Gurugram',
    speedKmh: 0,
    resolved: true,
  },
  {
    id: 'sec-alert-3',
    vehicleId: 'veh-1',
    vehicleName: 'Tesla Model 3 Long Range',
    licensePlate: 'MH-01-EV-8841',
    timestamp: new Date(Date.now() - 14 * 3600000).toISOString(),
    severity: 'INFO',
    type: 'GEOFENCE_BREACH',
    title: 'Geofence Advisory Notice',
    description: 'Vehicle operated within 5 km proximity of configured 50 km NCR perimeter. Driver notified via in-cabin notification.',
    actionTaken: 'Automated SMS sent to renter regarding state border permit terms.',
    location: 'Delhi-Haryana Border Kundli Toll',
    speedKmh: 68,
    resolved: true,
  }
];

class TheftPreventionService {
  private configs: Map<string, VehicleSecurityConfig> = new Map();
  private alerts: TheftSecurityAlert[] = [];

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const storedConfigs = localStorage.getItem(STORAGE_KEY_CONFIGS);
      if (storedConfigs) {
        const parsed: VehicleSecurityConfig[] = JSON.parse(storedConfigs);
        parsed.forEach(c => this.configs.set(c.vehicleId, c));
      } else {
        INITIAL_SECURITY_CONFIGS.forEach(c => this.configs.set(c.vehicleId, c));
        this.saveConfigs();
      }

      const storedAlerts = localStorage.getItem(STORAGE_KEY_ALERTS);
      if (storedAlerts) {
        this.alerts = JSON.parse(storedAlerts);
      } else {
        this.alerts = [...INITIAL_SECURITY_ALERTS];
        this.saveAlerts();
      }
    } catch (e) {
      console.error('Failed to load anti-theft storage state:', e);
      INITIAL_SECURITY_CONFIGS.forEach(c => this.configs.set(c.vehicleId, c));
      this.alerts = [...INITIAL_SECURITY_ALERTS];
    }
  }

  private saveConfigs() {
    try {
      const array = Array.from(this.configs.values());
      localStorage.setItem(STORAGE_KEY_CONFIGS, JSON.stringify(array));
    } catch (e) {
      console.warn('Failed saving anti-theft configs:', e);
    }
  }

  private saveAlerts() {
    try {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(this.alerts));
    } catch (e) {
      console.warn('Failed saving anti-theft alerts:', e);
    }
  }

  public getAllConfigs(): VehicleSecurityConfig[] {
    return Array.from(this.configs.values());
  }

  public getConfig(vehicleId: string): VehicleSecurityConfig {
    if (this.configs.has(vehicleId)) {
      return this.configs.get(vehicleId)!;
    }
    // Generate default secure config for vehicle
    const defaultConfig: VehicleSecurityConfig = {
      vehicleId,
      immobilizerStatus: 'ARMED',
      pinToDriveEnabled: true,
      pinCode: String(Math.floor(1000 + Math.random() * 9000)),
      geofenceEnabled: true,
      geofenceZoneName: 'Delhi-NCR Metropolitan Zone (45 km)',
      geofenceRadiusKm: 45,
      centerCoordinates: { lat: 28.6139, lng: 77.2090 },
      currentCoordinates: { lat: 28.5562, lng: 77.1000, address: 'Central Hub, New Delhi', speedKmh: 0 },
      canBusRelayProtection: true,
      towTamperAlarm: true,
      jammerDetection: true,
      sentryMode: true,
      valetSpeedLimitKmh: 80,
      theftRiskScore: 5,
      lastSecurityPing: new Date().toISOString(),
      engineRunning: false,
      policeIncidentActive: false,
    };
    this.configs.set(vehicleId, defaultConfig);
    this.saveConfigs();
    return defaultConfig;
  }

  public getAllAlerts(): TheftSecurityAlert[] {
    return [...this.alerts];
  }

  public addAlert(alert: Omit<TheftSecurityAlert, 'id' | 'timestamp'>): TheftSecurityAlert {
    const newAlert: TheftSecurityAlert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };
    this.alerts = [newAlert, ...this.alerts];
    this.saveAlerts();
    return newAlert;
  }

  public updateConfig(vehicleId: string, partial: Partial<VehicleSecurityConfig>): VehicleSecurityConfig {
    const existing = this.getConfig(vehicleId);
    const updated: VehicleSecurityConfig = {
      ...existing,
      ...partial,
      lastSecurityPing: new Date().toISOString(),
    };
    this.configs.set(vehicleId, updated);
    this.saveConfigs();
    return updated;
  }

  /**
   * Safe Remote Engine Kill Switch / Cryptographic Immobilizer
   * Evaluates vehicle telemetry:
   * - If vehicle is stationary (0 km/h): Immediately engages starter interlock & fuel cut
   * - If vehicle is in motion (> 0 km/h): Enters PENDING_SAFE_SHUTDOWN to prevent highway steering loss.
   *   Flashing hazards activate and engine cutoff automatically engages the instant speed reaches 0 km/h.
   */
  public triggerImmobilizer(
    vehicleId: string, 
    vehicleName: string, 
    licensePlate: string, 
    forceImmediate: boolean = false
  ): { status: ImmobilizerState; message: string; alert?: TheftSecurityAlert } {
    const current = this.getConfig(vehicleId);

    if (current.currentCoordinates.speedKmh > 0 && !forceImmediate) {
      // In motion: safe staging
      const updated = this.updateConfig(vehicleId, {
        immobilizerStatus: 'PENDING_SAFE_SHUTDOWN',
        theftRiskScore: Math.max(current.theftRiskScore, 75),
      });

      const alert = this.addAlert({
        vehicleId,
        vehicleName,
        licensePlate,
        severity: 'CRITICAL',
        type: 'SAFE_IMMOBILIZER_EXECUTED',
        title: 'Safe Remote Kill Switch Armed (Vehicle in Motion)',
        description: `Immobilization signal transmitted to ECU. Vehicle is moving at ${current.currentCoordinates.speedKmh} km/h. Deceleration safety protocol initiated; starter and throttle lockout will engage permanently once stopped.`,
        actionTaken: 'Hazard lights activated; throttle output capped at 25%; ECU waiting for 0 km/h standstill.',
        location: current.currentCoordinates.address,
        speedKmh: current.currentCoordinates.speedKmh,
        resolved: false,
      });

      return {
        status: updated.immobilizerStatus,
        message: `Safety Protocol Engaged: Vehicle is currently traveling at ${current.currentCoordinates.speedKmh} km/h. Ignition and starter lockout will permanently engage upon zero speed.`,
        alert,
      };
    } else {
      // Stationary: immediate lockout
      const updated = this.updateConfig(vehicleId, {
        immobilizerStatus: 'EMERGENCY_LOCKOUT',
        engineRunning: false,
        theftRiskScore: 88,
      });

      const alert = this.addAlert({
        vehicleId,
        vehicleName,
        licensePlate,
        severity: 'CRITICAL',
        type: 'SAFE_IMMOBILIZER_EXECUTED',
        title: 'Emergency Remote Engine Kill Switch Engaged',
        description: 'Starter relay disengaged, high-pressure fuel pump circuit opened, and OBD-II port secured via cryptographic ECU lock.',
        actionTaken: 'Complete powertrain lockout; horn/siren ready; high-frequency GPS pinging enabled.',
        location: current.currentCoordinates.address,
        speedKmh: 0,
        resolved: false,
      });

      return {
        status: updated.immobilizerStatus,
        message: 'Powertrain Lockout Active: Starter relay and fuel pump completely isolated by cryptographic ECU command.',
        alert,
      };
    }
  }

  /**
   * Disarm vehicle immobilizer
   */
  public disarmImmobilizer(vehicleId: string, vehicleName: string, licensePlate: string): VehicleSecurityConfig {
    const updated = this.updateConfig(vehicleId, {
      immobilizerStatus: 'DISARMED',
      theftRiskScore: Math.min(this.getConfig(vehicleId).theftRiskScore, 15),
      policeIncidentActive: false,
    });

    this.addAlert({
      vehicleId,
      vehicleName,
      licensePlate,
      severity: 'INFO',
      type: 'SAFE_IMMOBILIZER_EXECUTED',
      title: 'Vehicle Immobilizer Disarmed',
      description: 'Authorized administrator or verified customer digital key issued disarm command. Starter circuits restored.',
      actionTaken: 'Powertrain normal operation restored.',
      location: updated.currentCoordinates.address,
      speedKmh: updated.currentCoordinates.speedKmh,
      resolved: true,
    });

    return updated;
  }

  /**
   * Stolen Vehicle Recovery (SVR) Mode
   */
  public activateStolenVehicleRecovery(vehicleId: string, vehicleName: string, licensePlate: string) {
    const current = this.getConfig(vehicleId);
    const updated = this.updateConfig(vehicleId, {
      policeIncidentActive: true,
      immobilizerStatus: current.currentCoordinates.speedKmh === 0 ? 'EMERGENCY_LOCKOUT' : 'PENDING_SAFE_SHUTDOWN',
      sentryMode: true,
      theftRiskScore: 99,
    });

    const alert = this.addAlert({
      vehicleId,
      vehicleName,
      licensePlate,
      severity: 'CRITICAL',
      type: 'GEOFENCE_BREACH',
      title: 'STOLEN VEHICLE RECOVERY (SVR) PROTOCOL ACTIVATED',
      description: 'Vehicle flagged as stolen. Telematics tracking switched to 1-second interval; police telemetry feed generated; remote immobilizer queued for instant standstill execution.',
      actionTaken: 'Encrypted SVR beacon broadcast; local police API notified with live coordinates.',
      location: updated.currentCoordinates.address,
      speedKmh: updated.currentCoordinates.speedKmh,
      resolved: false,
    });

    return { updated, alert };
  }

  /**
   * Interactive Attack Simulator to demonstrate software defense mechanisms live
   */
  public simulateAttack(
    vehicleId: string, 
    vehicleName: string, 
    licensePlate: string, 
    attackType: 'RELAY_ATTACK' | 'GEOFENCE_ESCAPE' | 'FLATBED_TOW' | 'RF_JAMMER' | 'BRUTE_PIN'
  ): { title: string; mitigation: string; alert: TheftSecurityAlert } {
    const current = this.getConfig(vehicleId);

    switch (attackType) {
      case 'RELAY_ATTACK': {
        const alert = this.addAlert({
          vehicleId,
          vehicleName,
          licensePlate,
          severity: 'CRITICAL',
          type: 'RELAY_ATTACK_DETECTED',
          title: 'CAN-Bus Keyless Relay Attack Detected & Thwarted',
          description: 'Attacker used high-gain bidirectional transceivers to relay passive key fob signals from building. Software Time-of-Flight (ToF) algorithm computed round-trip delay exceeding 35 nanoseconds (physical distance > 10m).',
          actionTaken: 'Ignition request rejected. Software switched vehicle to Mandatory PIN-to-Drive mode.',
          location: current.currentCoordinates.address,
          speedKmh: 0,
          resolved: true,
        });
        this.updateConfig(vehicleId, { theftRiskScore: Math.min(100, current.theftRiskScore + 30) });
        return {
          title: 'Keyless Relay Attack Neutralized',
          mitigation: 'Software Time-of-Flight (ToF) detected relay distance discrepancy and blocked the starter relay.',
          alert,
        };
      }

      case 'GEOFENCE_ESCAPE': {
        const newCoords = {
          lat: current.currentCoordinates.lat + 0.45,
          lng: current.currentCoordinates.lng + 0.45,
          address: 'State Border Highway Km 142 (Outside Geofence Perimeter)',
          speedKmh: 74,
        };
        const updated = this.updateConfig(vehicleId, {
          currentCoordinates: newCoords,
          immobilizerStatus: 'PENDING_SAFE_SHUTDOWN',
          theftRiskScore: 92,
        });

        const alert = this.addAlert({
          vehicleId,
          vehicleName,
          licensePlate,
          severity: 'CRITICAL',
          type: 'GEOFENCE_BREACH',
          title: `Geofence Boundary Escape Detected: ${current.geofenceZoneName}`,
          description: `Vehicle exited authorized radius of ${current.geofenceRadiusKm} km at speed of 74 km/h. Boundary crossing rule breached.`,
          actionTaken: 'Safe Remote Kill Switch primed; siren warning sent to in-cabin cluster; dispatch alerted.',
          location: newCoords.address,
          speedKmh: 74,
          resolved: false,
        });
        return {
          title: 'Geofence Perimeter Breach Caught',
          mitigation: 'Virtual perimeter software triggered instant alert and primed the safe engine kill switch for vehicle stop.',
          alert,
        };
      }

      case 'FLATBED_TOW': {
        const newCoords = {
          ...current.currentCoordinates,
          address: 'Industrial Ring Road (In Transit via Tow/Flatbed)',
          speedKmh: 48,
        };
        const updated = this.updateConfig(vehicleId, {
          currentCoordinates: newCoords,
          theftRiskScore: 95,
          policeIncidentActive: true,
        });

        const alert = this.addAlert({
          vehicleId,
          vehicleName,
          licensePlate,
          severity: 'CRITICAL',
          type: 'UNSCHEDULED_TOW_MOTION',
          title: 'Unauthorized Tow / Flatbed Theft in Progress',
          description: 'Internal IMU tilt sensor measured 8.5° vehicle angle accompanied by 48 km/h kinetic movement while Engine Status is strictly OFF.',
          actionTaken: 'Silent theft beacon broadcast; SVR tracking engaged; GPS ping switched to 1-second cadence.',
          location: newCoords.address,
          speedKmh: 48,
          resolved: false,
        });
        return {
          title: 'Flatbed Tow / Physical Heist Detected',
          mitigation: 'IMU accelerometer identified vehicle motion without ignition, flagging an unscheduled flatbed tow.',
          alert,
        };
      }

      case 'RF_JAMMER': {
        const updated = this.updateConfig(vehicleId, {
          immobilizerStatus: 'EMERGENCY_LOCKOUT',
          theftRiskScore: 98,
        });

        const alert = this.addAlert({
          vehicleId,
          vehicleName,
          licensePlate,
          severity: 'CRITICAL',
          type: 'RF_JAMMING_ATTACK',
          title: 'Cellular/GPS Jammer Attack Detected (Deadman Switch Triggered)',
          description: 'On-board telematics unit detected wideband RF noise saturation on 1575.42 MHz (GPS L1) and cellular bands. Autonomous Deadman Failsafe activated.',
          actionTaken: 'Vehicle executed offline cryptographic starter lockout; local encrypted blackbox telemetry cached to flash memory.',
          location: current.currentCoordinates.address,
          speedKmh: 0,
          resolved: false,
        });
        return {
          title: 'RF Jammer Defense Tripped Deadman Lock',
          mitigation: 'Autonomous onboard software detected RF jamming and immediately locked out starter circuits offline.',
          alert,
        };
      }

      case 'BRUTE_PIN': {
        const alert = this.addAlert({
          vehicleId,
          vehicleName,
          licensePlate,
          severity: 'WARNING',
          type: 'PIN_ATTEMPTS_EXCEEDED',
          title: 'PIN-to-Drive Lockout: 3 Failed Attempts',
          description: 'Three consecutive invalid PIN attempts entered on dashboard touchscreen. Exponential backoff delay enforced.',
          actionTaken: 'Dashboard input locked for 15 minutes; secondary push-notification OTP sent to verified renter phone.',
          location: current.currentCoordinates.address,
          speedKmh: 0,
          resolved: true,
        });
        return {
          title: 'Brute-Force PIN Attack Prevented',
          mitigation: 'Rate-limiting & exponential backoff algorithms locked down infotainment input.',
          alert,
        };
      }
    }
  }

  public resolveAlert(alertId: string) {
    this.alerts = this.alerts.map(a => a.id === alertId ? { ...a, resolved: true } : a);
    this.saveAlerts();
  }

  public resetAllToDemo() {
    this.configs.clear();
    INITIAL_SECURITY_CONFIGS.forEach(c => this.configs.set(c.vehicleId, c));
    this.alerts = [...INITIAL_SECURITY_ALERTS];
    this.saveConfigs();
    this.saveAlerts();
  }
}

export const theftPreventionService = new TheftPreventionService();
