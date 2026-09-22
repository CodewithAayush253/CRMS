import React, { useState } from 'react';
import { 
  Car, 
  ShieldCheck, 
  Code2, 
  User, 
  CalendarCheck, 
  Sparkles,
  Lock,
  UserPlus,
  LogIn,
  LogOut,
  ShieldAlert,
  Award,
  Menu,
  X
} from 'lucide-react';
import { Customer } from '../types';

interface NavbarProps {
  activeTab: 'customer-catalog' | 'customer-bookings' | 'admin-dashboard' | 'admin-fleet' | 'admin-bookings' | 'admin-maintenance' | 'admin-reports' | 'admin-payments' | 'admin-reviews';
  onSelectTab: (tab: any) => void;
  currentUser: Customer | null;
  onOpenAuthModal: (mode: 'CUSTOMER_SIGNUP' | 'CUSTOMER_LOGIN' | 'ADMIN_LOGIN', task?: string) => void;
  onLogout: () => void;
  onOpenJavaModal: () => void;
  onResetData?: () => void;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';
  const isCustomer = currentUser?.role === 'ROLE_CUSTOMER';

  const handleAdminTabClick = (tabName: any) => {
    if (isAdmin) {
      onSelectTab(tabName);
    } else {
      onOpenAuthModal('CUSTOMER_LOGIN', 'access the Administrator Fleet Operations Panel');
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
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              id="crms-brand-btn"
              onClick={() => {
                onSelectTab(isAdmin ? 'admin-dashboard' : 'customer-catalog');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3.5 text-left group transition-transform active:scale-95"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-500/25 text-slate-950 font-black group-hover:scale-105 transition-all border border-amber-300/50">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">Velocity<span className="text-amber-400">CRMS</span></span>
                  <span className="hidden sm:inline-block text-[10px] uppercase font-extrabold tracking-wider bg-amber-500/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/20">Enterprise</span>
                </div>
                <p className="text-xs text-slate-400 font-medium hidden md:block">Car Rental Management & Fleet Control System</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Mode Tabs */}
          <nav className="hidden xl:flex items-center gap-1.5 bg-slate-950/80 p-2 rounded-2xl border border-slate-800/80 shadow-inner">
            {isAdmin ? (
              <>
                {[
                  { id: 'admin-dashboard', label: 'Overview' },
                  { id: 'admin-fleet', label: 'Fleet Manager' },
                  { id: 'admin-bookings', label: 'All Bookings' },
                  { id: 'admin-maintenance', label: 'Maintenance' },
                  { id: 'admin-reports', label: 'Reports' },
                  { id: 'admin-payments', label: 'Payments' },
                  { id: 'admin-reviews', label: 'Reviews', count: pendingReviewsCount },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    id={`nav-${tab.id}`}
                    onClick={() => onSelectTab(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {!!tab.count && tab.count > 0 && (
                      <span className="px-1.5 py-0.5 bg-slate-950 text-amber-400 text-[10px] font-black rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </>
            ) : (
              <>
                <button
                  id="nav-customer-catalog"
                  onClick={() => onSelectTab('customer-catalog')}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'customer-catalog'
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  Explore Fleet
                </button>
                <button
                  id="nav-customer-bookings"
                  onClick={handleCustomerBookingsClick}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all relative ${
                    activeTab === 'customer-bookings'
                      ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <CalendarCheck className="w-4 h-4" />
                  My Bookings
                  {currentUser && activeBookingsCount > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-amber-400 text-slate-950 text-[10px] font-black rounded-full shadow-xs animate-pulse">
                      {activeBookingsCount}
                    </span>
                  )}
                </button>
              </>
            )}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Java Spring Boot Explorer Trigger */}
            <button
              id="open-java-architecture-btn"
              onClick={onOpenJavaModal}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all hover:scale-105 shadow-xs"
              title="Inspect Java Spring Boot architecture & JPA specifications"
            >
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span>Spring Boot Spec</span>
            </button>

            {/* Authentication States */}
            {!currentUser ? (
              /* Case 1: Unauthenticated Visitor */
              <div className="flex items-center gap-2.5">
                <button
                  id="nav-customer-login-btn"
                  onClick={() => onOpenAuthModal('CUSTOMER_LOGIN')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4 text-slate-400" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>

                <button
                  id="nav-customer-signup-btn"
                  onClick={() => onOpenAuthModal('CUSTOMER_SIGNUP', 'create your verified account')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md transition-all hover:scale-105 flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </button>
              </div>
            ) : isCustomer ? (
              /* Case 2: Authenticated Customer */
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2.5 bg-slate-950/90 px-3.5 py-1.5 rounded-2xl border border-slate-800 shadow-inner">
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border-2 border-amber-400/60 shadow-xs"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
                    <p className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                      <Award className="w-3 h-3 text-amber-400" />
                      {currentUser.loyaltyPoints || 100} loyalty pts
                    </p>
                  </div>
                </div>

                {/* Admin Switch */}
                <button
                  id="nav-switch-to-admin-btn"
                  onClick={() => handleAdminTabClick('admin-dashboard')}
                  className="p-2.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-xl transition-all border border-slate-800 hover:border-slate-700 shadow-xs"
                  title="Open Admin Portal"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>

                <button
                  id="nav-logout-btn"
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all border border-slate-800 hover:border-slate-700 shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Case 3: Authenticated Admin */
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2.5 bg-red-950/60 px-3.5 py-1.5 rounded-2xl border border-red-500/40 shadow-inner">
                  <ShieldCheck className="w-4 h-4 text-red-400" />
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-extrabold text-white leading-tight">Admin: {currentUser.name}</p>
                    <p className="text-[10px] text-red-300 font-mono">ROLE_ADMIN</p>
                  </div>
                </div>

                <button
                  id="nav-customer-view-btn"
                  onClick={() => onSelectTab('customer-catalog')}
                  className="px-3 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all border border-slate-700 shadow-xs hidden sm:block"
                >
                  Customer View
                </button>

                <button
                  id="nav-admin-logout-btn"
                  onClick={onLogout}
                  title="Log out of Admin Session"
                  className="px-3 py-2 text-xs font-bold text-red-200 hover:text-white bg-red-950 hover:bg-red-900 border border-red-700/60 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Exit Admin</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Expandable Mobile & Tablet Interactive Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-slate-800 space-y-3 animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {isAdmin ? (
                <>
                  {[
                    { id: 'admin-dashboard', label: 'Overview' },
                    { id: 'admin-fleet', label: 'Fleet Manager' },
                    { id: 'admin-bookings', label: 'All Bookings' },
                    { id: 'admin-maintenance', label: 'Maintenance' },
                    { id: 'admin-reports', label: 'Reports' },
                    { id: 'admin-payments', label: 'Payments' },
                    { id: 'admin-reviews', label: 'Reviews', count: pendingReviewsCount },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        onSelectTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                        activeTab === tab.id
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      {tab.label} {!!tab.count && tab.count > 0 && `(${tab.count})`}
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onSelectTab('customer-catalog');
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3.5 py-3 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-all ${
                      activeTab === 'customer-catalog'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    Explore Fleet
                  </button>
                  <button
                    onClick={() => {
                      handleCustomerBookingsClick();
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3.5 py-3 rounded-xl text-xs font-bold text-left flex items-center gap-2 transition-all ${
                      activeTab === 'customer-bookings'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4" />
                    My Bookings {activeBookingsCount > 0 && `(${activeBookingsCount})`}
                  </button>
                </>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => {
                  onOpenJavaModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
              >
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>Spring Boot Architecture Spec</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
