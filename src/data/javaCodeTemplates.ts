export interface JavaCodeFile {
  filename: string;
  category: 'Entity' | 'Service & Logic' | 'Design Patterns' | 'Security & JWT' | 'Controller & API' | 'Database Schema';
  language: string;
  description: string;
  code: string;
}

export const JAVA_PROJECT_FILES: JavaCodeFile[] = [
  {
    filename: 'Vehicle.java',
    category: 'Entity',
    language: 'java',
    description: 'Hibernate/JPA entity representing a vehicle in the fleet with validation and relationships.',
    code: `package com.crms.enterprise.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "vehicles", indexes = {
    @Index(name = "idx_vehicle_status", columnList = "status"),
    @Index(name = "idx_vehicle_category", columnList = "category"),
    @Index(name = "idx_vehicle_plate", columnList = "license_plate", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Vehicle extends BaseAuditEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "VIN is mandatory")
    @Column(name = "vin", unique = true, nullable = false, length = 17)
    private String vin;

    @NotBlank(message = "Make cannot be blank")
    @Column(nullable = false, length = 50)
    private String make;

    @NotBlank(message = "Model cannot be blank")
    @Column(nullable = false, length = 60)
    private String model;

    @NotNull(message = "Year is mandatory")
    @Min(2015)
    private Integer year;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VehicleCategory category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransmissionType transmission;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private FuelType fuelType;

    @NotNull
    @Min(2)
    @Max(9)
    private Integer seats;

    @NotNull
    @Positive(message = "Daily rate must be positive")
    @Column(name = "daily_rate", precision = 10, scale = 2, nullable = false)
    private BigDecimal dailyRate;

    @NotNull
    @Column(name = "security_deposit", precision = 10, scale = 2)
    private BigDecimal securityDeposit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private VehicleStatus status;

    @Column(name = "license_plate", unique = true, nullable = false, length = 15)
    private String licensePlate;

    private Integer mileage;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Booking> bookings = new ArrayList<>();

    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<MaintenanceRecord> maintenanceLogs = new ArrayList<>();

    // Business domain helper method
    public boolean isRentable() {
        return VehicleStatus.AVAILABLE.equals(this.status);
    }
}`
  },
  {
    filename: 'PricingStrategy.java',
    category: 'Design Patterns',
    language: 'java',
    description: 'Gang of Four (GoF) Strategy Pattern for dynamic rental pricing, duration discounts, and late return penalties.',
    code: `package com.crms.enterprise.pattern.strategy;

import com.crms.enterprise.dto.PricingBreakdownDTO;
import com.crms.enterprise.model.InsuranceType;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Strategy Interface defining the contract for car rental price calculation.
 * Demonstrates Polymorphism and Open/Closed Principle (OCP).
 */
public interface PricingStrategy {
    boolean isApplicable(long rentalDays);
    PricingBreakdownDTO calculate(BigDecimal dailyRate, long rentalDays, InsuranceType insurance);
}

/**
 * Standard Pricing Strategy for short rentals (1 to 2 days).
 */
@Component
public class StandardPricingStrategy implements PricingStrategy {
    @Override
    public boolean isApplicable(long rentalDays) {
        return rentalDays < 3;
    }

    @Override
    public PricingBreakdownDTO calculate(BigDecimal dailyRate, long rentalDays, InsuranceType insurance) {
        BigDecimal base = dailyRate.multiply(BigDecimal.valueOf(rentalDays));
        BigDecimal insuranceCost = insurance.getDailyCost().multiply(BigDecimal.valueOf(rentalDays));
        BigDecimal subtotal = base.add(insuranceCost);
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.085")).setScale(2, RoundingMode.HALF_UP);
        
        return PricingBreakdownDTO.builder()
                .strategyName("Standard Daily Rate")
                .discountPercent(BigDecimal.ZERO)
                .discountAmount(BigDecimal.ZERO)
                .basePrice(base)
                .insuranceTotal(insuranceCost)
                .taxes(tax)
                .totalAmount(subtotal.add(tax))
                .build();
    }
}

/**
 * Weekly Long-Term Strategy granting 15% discount for rentals of 7+ days.
 */
@Component
public class WeeklyDiscountPricingStrategy implements PricingStrategy {
    @Override
    public boolean isApplicable(long rentalDays) {
        return rentalDays >= 7 && rentalDays < 14;
    }

    @Override
    public PricingBreakdownDTO calculate(BigDecimal dailyRate, long rentalDays, InsuranceType insurance) {
        BigDecimal base = dailyRate.multiply(BigDecimal.valueOf(rentalDays));
        BigDecimal discount = base.multiply(new BigDecimal("0.15")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal discountedBase = base.subtract(discount);
        BigDecimal insuranceCost = insurance.getDailyCost().multiply(BigDecimal.valueOf(rentalDays));
        BigDecimal subtotal = discountedBase.add(insuranceCost);
        BigDecimal tax = subtotal.multiply(new BigDecimal("0.085")).setScale(2, RoundingMode.HALF_UP);

        return PricingBreakdownDTO.builder()
                .strategyName("Weekly Special (15% Off)")
                .discountPercent(new BigDecimal("15.0"))
                .discountAmount(discount)
                .basePrice(discountedBase)
                .insuranceTotal(insuranceCost)
                .taxes(tax)
                .totalAmount(subtotal.add(tax))
                .build();
    }
}

/**
 * Context class that dynamically resolves and applies the appropriate strategy.
 */
@Component
public class PricingContext {
    private final java.util.List<PricingStrategy> strategies;

    public PricingContext(java.util.List<PricingStrategy> strategies) {
        this.strategies = strategies;
    }

    public PricingBreakdownDTO executeStrategy(BigDecimal dailyRate, long rentalDays, InsuranceType insurance) {
        return strategies.stream()
                .filter(strategy -> strategy.isApplicable(rentalDays))
                .findFirst()
                .orElse(new StandardPricingStrategy())
                .calculate(dailyRate, rentalDays, insurance);
    }
}`
  },
  {
    filename: 'BookingService.java',
    category: 'Service & Logic',
    language: 'java',
    description: 'Enterprise Service implementing Java Streams, Concurrency, Late Return fee calculations, and Transactions.',
    code: `package com.crms.enterprise.service;

import com.crms.enterprise.exception.*;
import com.crms.enterprise.model.*;
import com.crms.enterprise.pattern.strategy.PricingContext;
import com.crms.enterprise.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final VehicleRepository vehicleRepository;
    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final PricingContext pricingContext;
    private final NotificationService notificationService;

    /**
     * Search available cars using Java 8+ Streams and functional predicates.
     */
    @Transactional(readOnly = true)
    public List<Vehicle> searchAvailableVehicles(VehicleCategory category, BigDecimal maxRate) {
        return vehicleRepository.findAll().stream()
                .filter(Vehicle::isRentable)
                .filter(v -> category == null || v.getCategory().equals(category))
                .filter(v -> maxRate == null || v.getDailyRate().compareTo(maxRate) <= 0)
                .sorted(Comparator.comparing(Vehicle::getDailyRate))
                .collect(Collectors.toList());
    }

    /**
     * Create booking with concurrency lock and validation.
     */
    @Transactional
    public Booking createBooking(BookingRequestDTO request, Long customerId) {
        Vehicle vehicle = vehicleRepository.findByIdWithLock(request.getVehicleId())
                .orElseThrow(() -> new ResourceNotFoundException("Vehicle not found"));

        if (!vehicle.isRentable()) {
            throw new VehicleUnavailableException("Vehicle is currently " + vehicle.getStatus());
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        long rentalDays = Duration.between(request.getPickupDate().atStartOfDay(), 
                                           request.getReturnDate().atStartOfDay()).toDays();
        if (rentalDays <= 0) {
            throw new InvalidBookingDatesException("Return date must be strictly after pickup date");
        }

        // Apply Strategy Pattern
        var pricing = pricingContext.executeStrategy(vehicle.getDailyRate(), rentalDays, request.getInsuranceType());

        // Mark vehicle as rented / reserved
        vehicle.setStatus(VehicleStatus.RENTED);
        vehicleRepository.save(vehicle);

        Booking booking = Booking.builder()
                .bookingNumber("CRMS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .vehicle(vehicle)
                .customer(customer)
                .pickupDate(request.getPickupDate())
                .returnDate(request.getReturnDate())
                .rentalDays((int) rentalDays)
                .basePrice(pricing.getBasePrice())
                .totalAmount(pricing.getTotalAmount().add(vehicle.getSecurityDeposit()))
                .status(BookingStatus.CONFIRMED)
                .build();

        Booking saved = bookingRepository.save(booking);

        // Multithreading: Async email confirmation
        CompletableFuture.runAsync(() -> 
            notificationService.sendBookingConfirmation(customer.getEmail(), saved.getBookingNumber())
        );

        return saved;
    }

    /**
     * Process vehicle return and calculate late return penalties.
     */
    @Transactional
    public ReturnSummaryDTO processVehicleReturn(Long bookingId, LocalDateTime returnTimestamp, int fuelPercentage) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));

        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw new IllegalStateException("Only active rentals can be returned");
        }

        LocalDateTime expectedReturn = booking.getReturnDate().atTime(12, 0);
        long hoursLate = Duration.between(expectedReturn, returnTimestamp).toHours();

        BigDecimal lateFee = BigDecimal.ZERO;
        String penaltyNote = "Returned on time";

        // Late fee calculation logic
        if (hoursLate > 1) { // 1-hour grace period
            if (hoursLate <= 5) {
                BigDecimal hourlyPenalty = booking.getVehicle().getDailyRate()
                        .divide(BigDecimal.valueOf(8), 2, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("1.50"));
                lateFee = hourlyPenalty.multiply(BigDecimal.valueOf(hoursLate));
                penaltyNote = hoursLate + " hours late @ 1.5x hourly rate";
            } else {
                long daysLate = (long) Math.ceil((double) hoursLate / 24.0);
                BigDecimal dailyPenalty = booking.getVehicle().getDailyRate().multiply(new BigDecimal("1.50"));
                lateFee = dailyPenalty.multiply(BigDecimal.valueOf(daysLate));
                penaltyNote = daysLate + " days late @ 1.5x daily surcharge";
            }
        }

        // Refueling fee
        BigDecimal fuelFee = fuelPercentage < 100 
                ? BigDecimal.valueOf((100 - fuelPercentage) * 0.65).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setLateFee(lateFee);
        booking.setFuelFee(fuelFee);
        booking.getVehicle().setStatus(VehicleStatus.AVAILABLE);

        return ReturnSummaryDTO.builder()
                .bookingNumber(booking.getBookingNumber())
                .hoursLate((int) Math.max(0, hoursLate))
                .lateFee(lateFee)
                .fuelFee(fuelFee)
                .penaltyNote(penaltyNote)
                .finalCharge(lateFee.add(fuelFee))
                .build();
    }

    /**
     * Multithreading / Cron Job: Run hourly check for overdue rentals.
     */
    @Scheduled(cron = "0 0 * * * ?")
    public void checkForOverdueRentals() {
        log.info("Cron worker: Checking for overdue car rentals...");
        List<Booking> overdue = bookingRepository.findOverdueActiveBookings(LocalDateTime.now());
        overdue.forEach(b -> {
            log.warn("Rental overdue alert: Booking #{} - Vehicle: {}", b.getBookingNumber(), b.getVehicle().getLicensePlate());
            notificationService.sendOverdueAlert(b.getCustomer().getEmail(), b.getBookingNumber());
        });
    }
}`
  },
  {
    filename: 'JwtTokenProvider.java',
    category: 'Security & JWT',
    language: 'java',
    description: 'Spring Security JWT token generator, parser, and signature verifier for stateless REST API security.',
    code: `package com.crms.enterprise.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.stream.Collectors;

@Component
@Slf4j
public class JwtTokenProvider {

    private final SecretKey key;
    private final long jwtExpirationMs;

    public JwtTokenProvider(
            @Value("\${crms.jwt.secret:crmsEnterpriseSuperSecretKeyThatIsAtLeast256BitsLongForHMACSHA256}") String secret,
            @Value("\${crms.jwt.expiration-ms:86400000}") long jwtExpirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.jwtExpirationMs = jwtExpirationMs;
    }

    public String generateToken(Authentication authentication) {
        String username = authentication.getName();
        String roles = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.joining(","));

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        return Jwts.builder()
                .subject(username)
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }
}`
  },
  {
    filename: 'GlobalExceptionHandler.java',
    category: 'Controller & API',
    language: 'java',
    description: 'Centralized REST API exception handler using @RestControllerAdvice and custom HTTP problem details.',
    code: `package com.crms.enterprise.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(VehicleUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleVehicleUnavailable(VehicleUnavailableException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("error", "Vehicle Unavailable");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(InvalidBookingDatesException.class)
    public ResponseEntity<Map<String, Object>> handleInvalidDates(InvalidBookingDatesException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "Bad Request");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(ResourceNotFoundException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("error", "Not Found");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.UNPROCESSABLE_ENTITY.value());
        body.put("error", "Validation Failed");
        body.put("fieldErrors", fieldErrors);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }
}`
  },
  {
    filename: 'schema.sql',
    category: 'Database Schema',
    language: 'sql',
    description: 'Relational MySQL DDL schema with foreign key constraints, indexes, and ENUM validations.',
    code: `-- ==========================================================
-- Car Rental Management System (CRMS) - MySQL Database Schema
-- ==========================================================

CREATE DATABASE IF NOT EXISTS crms_db;
USE crms_db;

-- 1. Customers Table
CREATE TABLE customers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    role ENUM('ROLE_CUSTOMER', 'ROLE_ADMIN') DEFAULT 'ROLE_CUSTOMER',
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_customer_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Vehicles Table
CREATE TABLE vehicles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vin VARCHAR(17) NOT NULL UNIQUE,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(60) NOT NULL,
    year INT NOT NULL,
    category ENUM('Sedan', 'SUV', 'Luxury', 'Electric', 'Sports', 'Van') NOT NULL,
    transmission ENUM('Automatic', 'Manual') NOT NULL,
    fuel_type ENUM('Petrol', 'Diesel', 'Electric', 'Hybrid') NOT NULL,
    seats INT NOT NULL,
    daily_rate DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2) NOT NULL,
    status ENUM('AVAILABLE', 'RENTED', 'MAINTENANCE', 'RESERVED') DEFAULT 'AVAILABLE',
    mileage INT DEFAULT 0,
    license_plate VARCHAR(20) NOT NULL UNIQUE,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_vehicle_status (status),
    INDEX idx_vehicle_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Bookings Table
CREATE TABLE bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_number VARCHAR(32) NOT NULL UNIQUE,
    vehicle_id BIGINT NOT NULL,
    customer_id BIGINT NOT NULL,
    pickup_date DATE NOT NULL,
    return_date DATE NOT NULL,
    actual_return_datetime DATETIME NULL,
    status ENUM('PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
    rental_days INT NOT NULL,
    daily_rate DECIMAL(10,2) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    insurance_cost DECIMAL(10,2) DEFAULT 0.00,
    taxes DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    late_fee DECIMAL(10,2) DEFAULT 0.00,
    fuel_fee DECIMAL(10,2) DEFAULT 0.00,
    payment_status ENUM('PAID', 'REFUNDED', 'PARTIALLY_REFUNDED', 'PENDING') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    INDEX idx_booking_status (status),
    INDEX idx_booking_dates (pickup_date, return_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Payments Table
CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL UNIQUE,
    booking_id BIGINT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'PAYPAL') NOT NULL,
    status ENUM('SUCCESS', 'REFUNDED', 'PENDING', 'FAILED') DEFAULT 'SUCCESS',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    card_last4 VARCHAR(4) NULL,
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Maintenance Records Table
CREATE TABLE maintenance_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_id BIGINT NOT NULL,
    service_type ENUM('OIL_CHANGE', 'BRAKE_INSPECTION', 'TIRE_ROTATION', 'ENGINE_DIAGNOSTIC', 'ANNUAL_SERVICE', 'CLEANING_DETAILING') NOT NULL,
    status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'SCHEDULED',
    priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    start_date DATE NOT NULL,
    completed_date DATE NULL,
    cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    description TEXT,
    technician VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
  }
];
