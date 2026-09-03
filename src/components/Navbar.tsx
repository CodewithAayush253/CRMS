import React from 'react';
import { 
  Car, 
  ShieldCheck, 
  Code2, 
  User, 
  CalendarCheck, 
  RotateCcw,
  Sparkles,
  Lock,
  UserPlus,
  LogIn,
  LogOut,
  ShieldAlert,
  Award
} from 'lucide-react';
import { Customer } from '../types';

interface NavbarProps {
  activeTab: 'customer-catalog' | 'customer-bookings' | 'admin-dashboard' | 'admin-fleet' | 'admin-bookings' | 'admin-maintenance' | 'admin-reports' | 'admin-payments' | 'admin-reviews';
  onSelectTab: (tab: any) => void;
  currentUser: Customer | null;
  onOpenAuthModal: (mode: 'CUSTOMER_SIGNUP' | 'CUSTOMER_LOGIN' | 'ADMIN_LOGIN', task?: string) => void;
  onLogout: () => void;
  onOpenJavaModal: () => void;
  onResetData: () => void;
  activeBookingsCount: number;
  pendingReviewsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAuthModal,
  onLogout,
  onOpenJavaModal,
  onResetData,
  activeBookingsCount,
  pendingReviewsCount = 0,
}) => {
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';
  const isCustomer = currentUser?.role === 'ROLE_CUSTOMER';

  const handleAdminTabClick = (tabName: any) => {
    if (isAdmin) {
      onSelectTab(tabName);
    } else {
      onOpenAuthModal('ADMIN_LOGIN', 'access the Administrator Fleet Operations Panel');
    }
  };

  const handleCustomerBookingsClick = () => {
    if (!currentUser) {
      onOpenAuthModal('CUSTOMER_SIGNUP', 'view and manage your rental reservations');
    } else {
      onSelectTab('customer-bookings');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/90 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              id="crms-brand-btn"
              onClick={() => onSelectTab(isAdmin ? 'admin-dashboard' : 'customer-catalog')}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-md shadow-orange-500/20 text-slate-950 font-bold group-hover:scale-105 transition-transform border border-amber-400/40">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-white">Velocity<span className="text-amber-400">CRMS</span></span>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-800/80 text-amber-300 px-2 py-0.5 rounded-full border border-slate-700">Enterprise</span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">Car Rental Management System • Spring Boot</p>
              </div>
            </button>
          </div>

          {/* Navigation Mode Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            {isAdmin ? (
              <>
                <button
                  id="nav-admin-dashboard"
                  onClick={() => onSelectTab('admin-dashboard')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'admin-dashboard'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Overview
                </button>
                <button
                  id="nav-admin-fleet"
                  onClick={() => onSelectTab('admin-fleet')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'admin-fleet'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Fleet Manager
                </button>
                <button
                  id="nav-admin-bookings"
                  onClick={() => onSelectTab('admin-bookings')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'admin-bookings'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  All Bookings
                </button>
                <button
                  id="nav-admin-maintenance"
                  onClick={() => onSelectTab('admin-maintenance')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'admin-maintenance'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Maintenance
                </button>
                <button
                  id="nav-admin-reports"
                  onClick={() => onSelectTab('admin-reports')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'admin-reports'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Reports
                </button>
                <button
                  id="nav-admin-payments"
                  onClick={() => onSelectTab('admin-payments')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'admin-payments'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Payments
                </button>
                <button
                  id="nav-admin-reviews"
                  onClick={() => onSelectTab('admin-reviews')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                    activeTab === 'admin-reviews'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  Reviews
                  {pendingReviewsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-bold rounded-full">
                      {pendingReviewsCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  id="nav-customer-catalog"
                  onClick={() => onSelectTab('customer-catalog')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === 'customer-catalog'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  Explore Fleet
                </button>
                <button
                  id="nav-customer-bookings"
                  onClick={handleCustomerBookingsClick}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
                    activeTab === 'customer-bookings'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  My Bookings
                  {currentUser && activeBookingsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-bold rounded-full">
                      {activeBookingsCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            
            {/* Java Spring Boot Explorer Trigger */}
            <button
              id="open-java-architecture-btn"
              onClick={onOpenJavaModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
              title="Inspect Java Spring Boot, JPA, MySQL, and JWT code implementation"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Spring Boot Spec</span>
            </button>

            {/* Authentication States */}
            {!currentUser ? (
              /* Case 1: Unauthenticated Visitor */
              <div className="flex items-center gap-1.5">
                <button
                  id="nav-customer-login-btn"
                  onClick={() => onOpenAuthModal('CUSTOMER_LOGIN')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>

                <button
                  id="nav-customer-signup-btn"
                  onClick={() => onOpenAuthModal('CUSTOMER_SIGNUP', 'create your verified customer account')}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>

                <button
                  id="nav-admin-login-btn"
                  onClick={() => onOpenAuthModal('ADMIN_LOGIN', 'access the Administrator Fleet Operations Panel')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-red-950/60 hover:text-red-300 hover:border-red-500/50 text-slate-300 border border-slate-700 font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5"
                  title="Restricted Admin Panel - Authorized Personnel Only"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden md:inline">Admin Portal</span>
                </button>
              </div>
            ) : isCustomer ? (
              /* Case 2: Authenticated Customer */
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1 rounded-2xl border border-slate-800">
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover border border-amber-400/40"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-white leading-tight">{currentUser.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-amber-400 flex items-center gap-0.5">
                      <Award className="w-2.5 h-2.5" />
                      {currentUser.loyaltyPoints || 100} pts
                    </p>
                  </div>
                </div>

                {/* Admin Access Prompt (Protected) */}
                <button
                  id="nav-switch-to-admin-btn"
                  onClick={() => handleAdminTabClick('admin-dashboard')}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-xl transition-colors border border-transparent hover:border-slate-700"
                  title="Open Admin Portal (Admin credentials required)"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>

                <button
                  id="nav-logout-btn"
                  onClick={onLogout}
                  title="Sign out of customer account"
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors border border-transparent hover:border-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Case 3: Authenticated Admin */
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-red-950/60 px-3 py-1 rounded-2xl border border-red-500/40">
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-white leading-tight">Admin: {currentUser.name.split(' ')[0]}</p>
                    <p className="text-[10px] text-red-300 font-mono">ROLE_ADMIN (PIN 9821)</p>
                  </div>
                </div>

                <button
                  id="nav-customer-view-btn"
                  onClick={() => onSelectTab('customer-catalog')}
                  className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors hidden sm:block"
                >
                  Customer View
                </button>

                <button
                  id="nav-admin-logout-btn"
                  onClick={onLogout}
                  title="Log out of Administrator Session"
                  className="px-2.5 py-1 text-xs text-red-300 hover:text-white bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 rounded-xl transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Exit Admin</span>
                </button>
              </div>
            )}

            {/* Reset Demo Data */}
            <button
              id="reset-demo-data-btn"
              onClick={onResetData}
              title="Reset fleet, bookings and payments to initial demo state"
              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-xl transition-colors border border-transparent hover:border-slate-700"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2.5 gap-1.5 border-t border-slate-800 text-xs scrollbar-none">
          {isAdmin ? (
            <>
              <button 
                onClick={() => onSelectTab('admin-dashboard')}
                className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'admin-dashboard' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => onSelectTab('admin-fleet')}
                className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'admin-fleet' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                Fleet
              </button>
              <button 
                onClick={() => onSelectTab('admin-bookings')}
                className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'admin-bookings' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                Bookings
              </button>
              <button 
                onClick={() => onSelectTab('admin-maintenance')}
                className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'admin-maintenance' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                Maintenance
              </button>
              <button 
                onClick={() => onSelectTab('admin-reports')}
                className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'admin-reports' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                Reports
              </button>
              <button 
                onClick={() => onSelectTab('admin-payments')}
                className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'admin-payments' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                Payments
              </button>
              <button 
                onClick={() => onSelectTab('admin-reviews')}
                className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'admin-reviews' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                Reviews {pendingReviewsCount > 0 && `(${pendingReviewsCount})`}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => onSelectTab('customer-catalog')}
                className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'customer-catalog' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                Explore Cars
              </button>
              <button 
                onClick={handleCustomerBookingsClick}
                className={`px-2.5 py-1 rounded whitespace-nowrap ${activeTab === 'customer-bookings' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300'}`}
              >
                My Bookings {currentUser && `(${activeBookingsCount})`}
              </button>
              <button
                onClick={() => onOpenAuthModal('ADMIN_LOGIN', 'access the Administrator Fleet Operations Panel')}
                className="px-2.5 py-1 rounded whitespace-nowrap text-red-300 bg-red-950/40 border border-red-800/40"
              >
                Admin Login
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
