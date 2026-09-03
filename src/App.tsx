/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VehicleCatalog } from './components/customer/VehicleCatalog';
import { CarDetailsModal } from './components/customer/CarDetailsModal';
import { BookingModal } from './components/customer/BookingModal';
import { MyBookingsView } from './components/customer/MyBookingsView';
import { InvoiceModal } from './components/customer/InvoiceModal';
import { ReviewModal } from './components/customer/ReviewModal';
import { AuthModal, AuthMode } from './components/auth/AuthModal';

import { AdminDashboard } from './components/admin/AdminDashboard';
import { FleetManagement } from './components/admin/FleetManagement';
import { BookingsManagement } from './components/admin/BookingsManagement';
import { MaintenanceManagement } from './components/admin/MaintenanceManagement';
import { ReportsAnalytics } from './components/admin/ReportsAnalytics';
import { PaymentsLedger } from './components/admin/PaymentsLedger';
import { ReviewModeration } from './components/admin/ReviewModeration';

import { JavaArchitectureExplorer } from './components/java/JavaArchitectureExplorer';

import { 
  Vehicle, 
  Booking, 
  Customer, 
  PaymentTransaction, 
  MaintenanceRecord,
  BookingStatus,
  VehicleStatus,
  VehicleReview,
  ReviewModerationStatus
} from './types';
import { StorageService } from './services/storageService';
import { realtimeFleetService } from './services/realtimeFleetService';
import { INITIAL_CUSTOMERS } from './data/initialData';
import { formatINR } from './utils/currency';
import { CheckCircle2, Zap } from 'lucide-react';

export default function App() {
  // Global Data States
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => StorageService.getVehicles());
  const [customers, setCustomers] = useState<Customer[]>(() => StorageService.getCustomers());
  const [bookings, setBookings] = useState<Booking[]>(() => StorageService.getBookings());
  const [payments, setPayments] = useState<PaymentTransaction[]>(() => StorageService.getPayments());
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(() => StorageService.getMaintenance());
  const [reviews, setReviews] = useState<VehicleReview[]>(() => StorageService.getReviews());
  const [currentUser, setCurrentUser] = useState<Customer | null>(() => StorageService.getCurrentUser());

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'customer-catalog' | 
    'customer-bookings' | 
    'admin-dashboard' | 
    'admin-fleet' | 
    'admin-bookings' | 
    'admin-maintenance' | 
    'admin-reports' | 
    'admin-payments' |
    'admin-reviews'
  >('customer-catalog');

  // Customer booking dates & custom manual locations
  const [pickupDate, setPickupDate] = useState<string>('2026-09-05');
  const [returnDate, setReturnDate] = useState<string>('2026-09-09');
  const [pickupLocation, setPickupLocation] = useState<string>('Terminal 3, IGI Airport, New Delhi');
  const [returnLocation, setReturnLocation] = useState<string>('Terminal 3, IGI Airport, New Delhi');

  // Authentication Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>('CUSTOMER_SIGNUP');
  const [authTaskAttempted, setAuthTaskAttempted] = useState<string | null>(null);
  const [pendingBookingVehicle, setPendingBookingVehicle] = useState<Vehicle | null>(null);

  // Modals
  const [selectedVehicleForDetails, setSelectedVehicleForDetails] = useState<Vehicle | null>(null);
  const [selectedVehicleForBooking, setSelectedVehicleForBooking] = useState<Vehicle | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<{ booking: Booking; existingReview?: VehicleReview } | null>(null);
  const [isJavaModalOpen, setIsJavaModalOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Sync to storage on state changes
  useEffect(() => {
    StorageService.saveVehicles(vehicles);
  }, [vehicles]);

  useEffect(() => {
    StorageService.saveBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    StorageService.savePayments(payments);
  }, [payments]);

  useEffect(() => {
    StorageService.saveMaintenance(maintenance);
  }, [maintenance]);

  useEffect(() => {
    StorageService.saveReviews(reviews);
  }, [reviews]);

  useEffect(() => {
    StorageService.setCurrentUser(currentUser);
  }, [currentUser]);

  // Real-time Fleet & Availability event listener (Cross-tab and intra-system synchronization)
  useEffect(() => {
    const unsubscribe = realtimeFleetService.subscribe((event) => {
      if (event.type === 'VEHICLE_STATUS_CHANGED') {
        setVehicles(prev => prev.map(v => v.id === event.vehicleId ? { ...v, status: event.status } : v));
        showToast(`[Live Sync] ${event.vehicleName || 'Vehicle'} availability updated to ${event.status}`);
      } else if (event.type === 'NEW_BOOKING') {
        setBookings(prev => {
          if (prev.some(b => b.id === event.booking.id)) return prev;
          return [event.booking, ...prev];
        });
        setVehicles(prev => prev.map(v => v.id === event.booking.vehicleId ? { ...v, status: 'RENTED' } : v));
        showToast(`[Live Sync] New Reservation #${event.booking.bookingNumber} confirmed in real-time!`);
      } else if (event.type === 'BOOKING_RETURNED') {
        setBookings(prev => prev.map(b => b.id === event.bookingId ? { ...b, status: 'COMPLETED' as BookingStatus } : b));
        setVehicles(prev => prev.map(v => v.id === event.vehicleId ? { ...v, status: 'AVAILABLE' as VehicleStatus } : v));
        showToast(`[Live Sync] Vehicle returned & restored to AVAILABLE fleet.`);
      } else if (event.type === 'BOOKING_CANCELLED') {
        setBookings(prev => prev.map(b => b.id === event.bookingId ? { ...b, status: 'CANCELLED' as BookingStatus } : b));
        setVehicles(prev => prev.map(v => v.id === event.vehicleId ? { ...v, status: 'AVAILABLE' as VehicleStatus } : v));
        showToast(`[Live Sync] Reservation cancelled. Car released back to available listings.`);
      } else if (event.type === 'NEW_REVIEW') {
        setReviews(prev => {
          if (prev.some(r => r.id === event.review.id)) return prev;
          return [event.review, ...prev];
        });
        showToast(`[Live Sync] New customer rating published for ${event.review.vehicleName}`);
      } else if (event.type === 'REVIEW_STATUS_CHANGED') {
        setReviews(prev => prev.map(r => r.id === event.reviewId ? { ...r, status: event.status } : r));
      } else if (event.type === 'MAINTENANCE_SCHEDULED') {
        setMaintenance(prev => {
          if (prev.some(m => m.id === event.record.id)) return prev;
          return [event.record, ...prev];
        });
        setVehicles(prev => prev.map(v => v.id === event.record.vehicleId ? { ...v, status: 'MAINTENANCE' } : v));
      } else if (event.type === 'MAINTENANCE_COMPLETED') {
        setMaintenance(prev => prev.map(m => m.id === event.recordId ? { ...m, status: 'COMPLETED' } : m));
        setVehicles(prev => prev.map(v => v.id === event.vehicleId ? { ...v, status: 'AVAILABLE' } : v));
      }
    });

    return () => unsubscribe();
  }, []);

  // Navigation & Role Access Guard
  const handleSelectTab = (tab: any) => {
    // Only verified Admin can view Admin tabs
    if (tab.toString().startsWith('admin-')) {
      if (currentUser?.role !== 'ROLE_ADMIN') {
        handleOpenAuth('ADMIN_LOGIN', 'access the Administrator Fleet Operations Panel');
        return;
      }
    }
    // Customer must have an account to view bookings
    if (tab === 'customer-bookings') {
      if (!currentUser) {
        handleOpenAuth('CUSTOMER_SIGNUP', 'view your reservations and return management');
        return;
      }
    }
    setActiveTab(tab);
  };

  // Trigger Unified Auth Modal
  const handleOpenAuth = (mode: AuthMode, task?: string) => {
    setAuthModalMode(mode);
    setAuthTaskAttempted(task || null);
    setIsAuthModalOpen(true);
  };

  // Successful Login or Registration
  const handleLoginSuccess = (user: Customer) => {
    setCurrentUser(user);
    StorageService.setCurrentUser(user);

    if (user.role === 'ROLE_ADMIN') {
      setActiveTab('admin-dashboard');
      showToast(`Admin Console Unlocked: Welcome back, ${user.name}`);
    } else {
      showToast(`Welcome, ${user.name}! Customer account verified.`);
      // If customer was in the middle of booking a car, open the booking wizard
      if (pendingBookingVehicle) {
        setSelectedVehicleForBooking(pendingBookingVehicle);
        setPendingBookingVehicle(null);
      }
    }
  };

  // Sign out
  const handleLogout = () => {
    setCurrentUser(null);
    StorageService.setCurrentUser(null);
    setActiveTab('customer-catalog');
    showToast('Signed out successfully.');
  };

  // New Customer registered via Customer Panel
  const handleCustomerCreated = (newCustomer: Customer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    StorageService.saveCustomers([newCustomer, ...customers]);
  };

  // Book Vehicle guard
  const handleBookVehicle = (veh: Vehicle) => {
    if (!currentUser) {
      setPendingBookingVehicle(veh);
      handleOpenAuth('CUSTOMER_SIGNUP', `book the ${veh.year} ${veh.make} ${veh.model}`);
    } else {
      setSelectedVehicleForBooking(veh);
    }
  };

  // Customer booking confirmed
  const handleBookingSuccess = (newBooking: Booking, newPayment: PaymentTransaction) => {
    setBookings(prev => [newBooking, ...prev]);
    setPayments(prev => [newPayment, ...prev]);
    
    // Update car status to RENTED locally and broadcast
    setVehicles(prev => prev.map(v => 
      v.id === newBooking.vehicleId ? { ...v, status: 'RENTED' } : v
    ));

    // Broadcast instant availability update across all open tabs/users
    realtimeFleetService.broadcast({
      type: 'NEW_BOOKING',
      booking: newBooking,
    });

    showToast(`Reservation #${newBooking.bookingNumber} confirmed & payment authorized!`);
  };

  // Customer or Admin vehicle return with late charges in INR
  const handleProcessReturn = (
    bookingId: string, 
    hoursLate: number, 
    lateFee: number, 
    fuelFee: number, 
    penaltyNote: string
  ) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    const totalAdditional = lateFee + fuelFee;
    const finalAmount = booking.totalAmount + totalAdditional;

    // Update booking
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'COMPLETED' as BookingStatus,
          hoursLate,
          lateFee,
          fuelFee,
          finalPaidAmount: finalAmount,
          actualReturnDate: new Date().toISOString(),
        };
      }
      return b;
    });
    setBookings(updatedBookings);

    // Free vehicle back to AVAILABLE
    setVehicles(prev => prev.map(v => 
      v.id === booking.vehicleId ? { ...v, status: 'AVAILABLE' } : v
    ));

    // Broadcast instant availability update to all active catalog viewers
    realtimeFleetService.broadcast({
      type: 'BOOKING_RETURNED',
      bookingId,
      vehicleId: booking.vehicleId,
    });

    // Record late fee transaction if any
    if (totalAdditional > 0) {
      const lateTxn: PaymentTransaction = {
        id: `pay-${Date.now()}`,
        transactionId: `TXN-${Math.floor(10000000 + Math.random() * 90000000)}`,
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        amount: totalAdditional,
        method: 'CREDIT_CARD',
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        cardLast4: '9012',
        type: 'LATE_FEE',
      };
      setPayments(prev => [lateTxn, ...prev]);
      showToast(`Vehicle returned. Assessed penalty of ${formatINR(totalAdditional)} settled.`);
    } else {
      showToast('Vehicle returned on time with full tank! Full security deposit released.');
    }
  };

  // Cancel booking with refund
  const handleCancelBooking = (
    bookingId: string, 
    refundAmount: number, 
    feeAmount: number, 
    reason: string
  ) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          status: 'CANCELLED' as BookingStatus,
          paymentStatus: refundAmount > 0 ? 'REFUNDED' : 'PENDING',
          cancellationReason: reason,
        };
      }
      return b;
    }));

    // Release vehicle back to AVAILABLE
    setVehicles(prev => prev.map(v => 
      v.id === booking.vehicleId ? { ...v, status: 'AVAILABLE' } : v
    ));

    // Broadcast availability update
    realtimeFleetService.broadcast({
      type: 'BOOKING_CANCELLED',
      bookingId,
      vehicleId: booking.vehicleId,
    });

    // Record refund transaction
    if (refundAmount > 0) {
      const refundTxn: PaymentTransaction = {
        id: `pay-${Date.now()}`,
        transactionId: `TXN-REF-${Math.floor(10000000 + Math.random() * 90000000)}`,
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        customerName: booking.customerName,
        amount: refundAmount,
        method: 'CREDIT_CARD',
        status: 'REFUNDED',
        timestamp: new Date().toISOString(),
        type: 'REFUND',
      };
      setPayments(prev => [refundTxn, ...prev]);
    }

    showToast(`Reservation #${booking.bookingNumber} cancelled. Refund of ${formatINR(refundAmount)} processed.`);
  };

  // Admin fleet updates
  const handleAddVehicle = (newVehicle: Vehicle) => {
    setVehicles(prev => [newVehicle, ...prev]);
    realtimeFleetService.broadcast({
      type: 'VEHICLE_STATUS_CHANGED',
      vehicleId: newVehicle.id,
      vehicleName: `${newVehicle.year} ${newVehicle.make} ${newVehicle.model}`,
      status: newVehicle.status,
    });
    showToast(`Added ${newVehicle.year} ${newVehicle.make} ${newVehicle.model} to fleet.`);
  };

  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedVehicle.id ? updatedVehicle : v));
    realtimeFleetService.broadcast({
      type: 'VEHICLE_STATUS_CHANGED',
      vehicleId: updatedVehicle.id,
      vehicleName: `${updatedVehicle.make} ${updatedVehicle.model}`,
      status: updatedVehicle.status,
    });
    showToast(`Updated vehicle details for ${updatedVehicle.make} ${updatedVehicle.model}.`);
  };

  const handleDeleteVehicle = (vehicleId: string) => {
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    showToast('Vehicle removed from fleet inventory.');
  };

  // Maintenance Handlers
  const handleAddMaintenance = (newRecord: MaintenanceRecord) => {
    setMaintenance(prev => [newRecord, ...prev]);
    // Lock vehicle into MAINTENANCE status
    setVehicles(prev => prev.map(v => 
      v.id === newRecord.vehicleId ? { ...v, status: 'MAINTENANCE' } : v
    ));
    realtimeFleetService.broadcast({
      type: 'MAINTENANCE_SCHEDULED',
      record: newRecord,
    });
    showToast(`Service scheduled for ${newRecord.vehicleName}. Vehicle locked from customer rentals.`);
  };

  const handleCompleteMaintenance = (recordId: string, vehicleId: string, actualCost: number) => {
    setMaintenance(prev => prev.map(m => {
      if (m.id === recordId) {
        return {
          ...m,
          status: 'COMPLETED',
          completedDate: new Date().toISOString().split('T')[0],
          cost: actualCost,
        };
      }
      return m;
    }));

    // Unlock vehicle back to AVAILABLE
    setVehicles(prev => prev.map(v => 
      v.id === vehicleId ? { ...v, status: 'AVAILABLE' } : v
    ));

    realtimeFleetService.broadcast({
      type: 'MAINTENANCE_COMPLETED',
      recordId,
      vehicleId,
    });

    showToast('Maintenance certified complete! Vehicle restored to AVAILABLE status.');
  };

  // Admin booking status quick updater
  const handleUpdateBookingStatus = (bookingId: string, newStatus: BookingStatus) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));

    if (newStatus === 'ACTIVE') {
      setVehicles(prev => prev.map(v => v.id === booking.vehicleId ? { ...v, status: 'RENTED' } : v));
      realtimeFleetService.broadcast({
        type: 'VEHICLE_STATUS_CHANGED',
        vehicleId: booking.vehicleId,
        status: 'RENTED',
        vehicleName: booking.vehicleName,
      });
      showToast(`Vehicle handoff complete: Booking #${booking.bookingNumber} marked ACTIVE.`);
    } else if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
      setVehicles(prev => prev.map(v => v.id === booking.vehicleId ? { ...v, status: 'AVAILABLE' } : v));
      realtimeFleetService.broadcast({
        type: 'VEHICLE_STATUS_CHANGED',
        vehicleId: booking.vehicleId,
        status: 'AVAILABLE',
        vehicleName: booking.vehicleName,
      });
      showToast(`Booking #${booking.bookingNumber} marked ${newStatus}. Vehicle released.`);
    }
  };

  // Customer Review Submission Handler
  const handleSubmitReview = (reviewData: {
    rating: number;
    cleanlinessRating: number;
    comfortRating: number;
    serviceRating: number;
    title: string;
    comment: string;
  }) => {
    if (!reviewingBooking) return;
    const { booking, existingReview } = reviewingBooking;

    if (existingReview) {
      const updated: VehicleReview = {
        ...existingReview,
        ...reviewData,
        updatedAt: new Date().toISOString(),
        status: 'APPROVED',
      };
      setReviews(prev => prev.map(r => r.id === existingReview.id ? updated : r));
      realtimeFleetService.broadcast({
        type: 'REVIEW_STATUS_CHANGED',
        reviewId: updated.id,
        status: updated.status,
      });
      showToast(`Your review for ${booking.vehicleName} has been updated!`);
    } else {
      const newReview: VehicleReview = {
        id: `rev-${Date.now()}`,
        vehicleId: booking.vehicleId,
        vehicleName: booking.vehicleName,
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerAvatar: currentUser.avatarUrl,
        rating: reviewData.rating,
        cleanlinessRating: reviewData.cleanlinessRating,
        comfortRating: reviewData.comfortRating,
        serviceRating: reviewData.serviceRating,
        title: reviewData.title,
        comment: reviewData.comment,
        status: 'APPROVED', // Default approved for instant user feedback
        createdAt: new Date().toISOString(),
        verifiedRental: true,
      };
      setReviews(prev => [newReview, ...prev]);
      realtimeFleetService.broadcast({
        type: 'NEW_REVIEW',
        review: newReview,
      });
      showToast(`Thank you! Your ${newReview.rating}★ review for ${booking.vehicleName} has been published.`);
    }
    setReviewingBooking(null);
  };

  // Admin Review Moderation Handlers
  const handleUpdateReviewStatus = (reviewId: string, status: ReviewModerationStatus, adminNotes?: string) => {
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status, adminNotes } : r));
    realtimeFleetService.broadcast({
      type: 'REVIEW_STATUS_CHANGED',
      reviewId,
      status,
    });
    showToast(`Review #${reviewId} marked as ${status}.`);
  };

  const handleDeleteReview = (reviewId: string) => {
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    showToast('Customer review removed permanently.');
  };

  // Reset to initial demo data
  const handleResetData = () => {
    if (confirm('Reset fleet, bookings, payments, and reviews back to initial demo data?')) {
      StorageService.resetAll();
      setVehicles(StorageService.getVehicles());
      setCustomers(StorageService.getCustomers());
      setBookings(StorageService.getBookings());
      setPayments(StorageService.getPayments());
      setMaintenance(StorageService.getMaintenance());
      setReviews(StorageService.getReviews());
      setCurrentUser(StorageService.getCurrentUser());
      showToast('All system records successfully restored to demo baseline.');
    }
  };

  const activeCustomerBookingsCount = currentUser
    ? bookings.filter(b => b.customerId === currentUser.id && (b.status === 'ACTIVE' || b.status === 'CONFIRMED')).length
    : 0;

  const pendingReviewsCount = reviews.filter(r => r.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Primary Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        currentUser={currentUser}
        onOpenAuthModal={handleOpenAuth}
        onLogout={handleLogout}
        onOpenJavaModal={() => setIsJavaModalOpen(true)}
        onResetData={handleResetData}
        activeBookingsCount={activeCustomerBookingsCount}
        pendingReviewsCount={pendingReviewsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* CUSTOMER PORTAL VIEWS */}
        {activeTab === 'customer-catalog' && (
          <VehicleCatalog
            vehicles={vehicles}
            existingBookings={bookings}
            reviews={reviews}
            pickupDate={pickupDate}
            returnDate={returnDate}
            pickupLocation={pickupLocation}
            returnLocation={returnLocation}
            onPickupDateChange={setPickupDate}
            onReturnDateChange={setReturnDate}
            onPickupLocationChange={setPickupLocation}
            onReturnLocationChange={setReturnLocation}
            currentUser={currentUser}
            onRequestAuth={handleOpenAuth}
            onSelectVehicle={(veh) => setSelectedVehicleForDetails(veh)}
            onBookVehicle={handleBookVehicle}
          />
        )}

        {activeTab === 'customer-bookings' && (
          <MyBookingsView
            bookings={bookings}
            currentUser={currentUser}
            reviews={reviews}
            onOpenInvoice={(booking) => setViewingInvoice(booking)}
            onOpenReviewModal={(booking, existingReview) => setReviewingBooking({ booking, existingReview })}
            onProcessReturn={handleProcessReturn}
            onCancelBooking={handleCancelBooking}
            onOpenAuthModal={handleOpenAuth}
          />
        )}

        {/* ADMIN PORTAL VIEWS */}
        {activeTab === 'admin-dashboard' && (
          <AdminDashboard
            vehicles={vehicles}
            bookings={bookings}
            maintenance={maintenance}
            customers={customers}
            payments={payments}
            reviews={reviews}
            onNavigateTab={setActiveTab}
            onOpenJavaModal={() => setIsJavaModalOpen(true)}
            onSimulateRealtimeEvent={() => realtimeFleetService.simulateRandomBookingOrReturn(vehicles, bookings)}
          />
        )}

        {activeTab === 'admin-fleet' && (
          <FleetManagement
            vehicles={vehicles}
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onDeleteVehicle={handleDeleteVehicle}
          />
        )}

        {activeTab === 'admin-bookings' && (
          <BookingsManagement
            bookings={bookings}
            onUpdateBookingStatus={handleUpdateBookingStatus}
            onOpenInvoice={(booking) => setViewingInvoice(booking)}
            onTriggerReturn={(booking) => {
              handleProcessReturn(booking.id, 0, 0, 0, 'On-time return');
            }}
          />
        )}

        {activeTab === 'admin-maintenance' && (
          <MaintenanceManagement
            vehicles={vehicles}
            maintenanceLogs={maintenance}
            onAddMaintenance={handleAddMaintenance}
            onCompleteMaintenance={handleCompleteMaintenance}
          />
        )}

        {activeTab === 'admin-reports' && (
          <ReportsAnalytics
            vehicles={vehicles}
            bookings={bookings}
            payments={payments}
            maintenance={maintenance}
          />
        )}

        {activeTab === 'admin-payments' && (
          <PaymentsLedger
            payments={payments}
            bookings={bookings}
            onOpenInvoiceForBookingNumber={(bNum) => {
              const b = bookings.find(x => x.bookingNumber === bNum);
              if (b) setViewingInvoice(b);
            }}
          />
        )}

        {activeTab === 'admin-reviews' && (
          <ReviewModeration
            reviews={reviews}
            vehicles={vehicles}
            onUpdateReviewStatus={handleUpdateReviewStatus}
            onDeleteReview={handleDeleteReview}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Velocity CRMS</span>
            <span>•</span>
            <span>Enterprise Car Rental Management System</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-800/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Broadcast Sync
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-slate-400">Powered by Java Spring Boot, JPA/Hibernate, MySQL & React</span>
            <button
              onClick={() => setIsJavaModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-semibold underline"
            >
              Inspect Java Architecture & APIs
            </button>
          </div>
        </div>
      </footer>

      {/* POPUP MODALS */}
      {/* 1. Car Details Modal */}
      <CarDetailsModal
        vehicle={selectedVehicleForDetails}
        reviews={reviews}
        onClose={() => setSelectedVehicleForDetails(null)}
        onBookNow={(veh) => {
          setSelectedVehicleForDetails(null);
          handleBookVehicle(veh);
        }}
        pickupDate={pickupDate}
        returnDate={returnDate}
      />

      {/* 2. Step-by-Step Booking & Payment Wizard (Guarded by Customer Account) */}
      {selectedVehicleForBooking && currentUser && (
        <BookingModal
          vehicle={selectedVehicleForBooking}
          currentUser={currentUser}
          initialPickupDate={pickupDate}
          initialReturnDate={returnDate}
          initialPickupLocation={pickupLocation}
          initialReturnLocation={returnLocation}
          onClose={() => setSelectedVehicleForBooking(null)}
          onBookingSuccess={handleBookingSuccess}
          onOpenInvoice={(booking) => {
            setSelectedVehicleForBooking(null);
            setViewingInvoice(booking);
          }}
        />
      )}

      {/* 3. Printable Tax Invoice & Receipt Modal */}
      <InvoiceModal
        booking={viewingInvoice}
        onClose={() => setViewingInvoice(null)}
      />

      {/* 4. Customer Review & Rating Modal */}
      {reviewingBooking && (
        <ReviewModal
          booking={reviewingBooking.booking}
          existingReview={reviewingBooking.existingReview}
          onClose={() => setReviewingBooking(null)}
          onSubmitReview={handleSubmitReview}
        />
      )}

      {/* 5. Java Spring Boot Architecture & Code Explorer */}
      <JavaArchitectureExplorer
        isOpen={isJavaModalOpen}
        onClose={() => setIsJavaModalOpen(false)}
      />

      {/* 6. Role-Based Unified Authentication & Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        taskAttempted={authTaskAttempted}
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthTaskAttempted(null);
        }}
        onLoginSuccess={handleLoginSuccess}
        existingCustomers={customers}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* Floating Action Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 text-xs font-medium animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
