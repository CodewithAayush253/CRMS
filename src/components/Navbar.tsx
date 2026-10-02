import React, { useState } from 'react';
import { 
  Car, 
  CalendarCheck, 
  LogOut, 
  ShieldAlert, 
  Award, 
  Menu, 
  X, 
  Navigation,
  ShieldCheck,
  User,
  LogIn,
  UserPlus
} from 'lucide-react';
import { Customer } from '../types';

interface NavbarProps {
  activeTab: 'customer-catalog' | 'customer-bookings' | 'admin-dashboard' | 'admin-fleet' | 'admin-bookings' | 'admin-maintenance' | 'admin-reports' | 'admin-payments' | 'admin-reviews' | 'admin-antitheft' | 'admin-gps';
  onSelectTab: (tab: any) => void;
  currentUser: Customer | null;
  onOpenAuthModal: (mode: 'CUSTOMER_SIGNUP' | 'CUSTOMER_LOGIN' | 'ADMIN_LOGIN', task?: string) => void;
  onLogout: () => void;
  onOpenJavaModal?: () => void;
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

  const adminNavItems = [
    { id: 'admin-dashboard', label: 'Overview' },
    { id: 'admin-fleet', label: 'Fleet' },
    { id: 'admin-gps', label: 'GPS Radar' },
    { id: 'admin-bookings', label: 'Bookings' },
    { id: 'admin-antitheft', label: 'Security' },
    { id: 'admin-maintenance', label: 'Maintenance' },
    { id: 'admin-reports', label: 'Reports' },
    { id: 'admin-payments', label: 'Payments' },
    { id: 'admin-reviews', label: 'Reviews', count: pendingReviewsCount },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <button 
              id="crms-brand-btn"
              onClick={() => {
                onSelectTab(isAdmin ? 'admin-dashboard' : 'customer-catalog');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 text-left group transition-opacity hover:opacity-90"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-xs">
                <Car className="w-5 h-5 text-slate-950" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                Velocity<span className="text-amber-400">CRMS</span>
              </span>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {isAdmin ? (
              adminNavItems.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    id={`nav-${tab.id}`}
                    onClick={() => onSelectTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {!!tab.count && tab.count > 0 && (
                      <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-bold rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <>
                <button
                  id="nav-customer-catalog"
                  onClick={() => onSelectTab('customer-catalog')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'customer-catalog'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Fleet Catalog</span>
                </button>

                <button
                  id="nav-customer-bookings"
                  onClick={handleCustomerBookingsClick}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'customer-bookings'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>My Reservations</span>
                  {currentUser && activeBookingsCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-bold rounded-full">
                      {activeBookingsCount}
                    </span>
                  )}
                </button>

                <button
                  id="nav-customer-gps"
                  onClick={() => onSelectTab('admin-gps')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'admin-gps'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>GPS Map</span>
                </button>

                <button
                  id="nav-customer-antitheft"
                  onClick={() => onSelectTab('admin-antitheft')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'admin-antitheft'
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Security Shield</span>
                </button>
              </>
            )}
          </nav>

          {/* Right Action & User Profile Zone */}
          <div className="flex items-center gap-3 shrink-0">
            
            {!currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  id="nav-customer-login-btn"
                  onClick={() => onOpenAuthModal('CUSTOMER_LOGIN')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition-colors"
                >
                  Sign In
                </button>
                <button
                  id="nav-customer-signup-btn"
                  onClick={() => onOpenAuthModal('CUSTOMER_SIGNUP', 'create your verified account')}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                >
                  Create Account
                </button>
              </div>
            ) : isCustomer ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <img
                    src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-700"
                  />
                  <div className="text-left hidden md:block">
                    <p className="font-semibold text-white leading-tight">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {currentUser.loyaltyPoints || 100} pts
                    </p>
                  </div>
                </div>

                <button
                  id="nav-switch-to-admin-btn"
                  onClick={() => handleAdminTabClick('admin-dashboard')}
                  className="text-xs px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                  title="Switch to Administrator Dashboard"
                >
                  Admin
                </button>

                <button
                  id="nav-logout-btn"
                  onClick={onLogout}
                  title="Sign out"
                  className="text-xs px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs">
                    AD
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="font-semibold text-white leading-tight">{currentUser.name}</p>
                    <p className="text-[11px] text-amber-400">Administrator</p>
                  </div>
                </div>

                <button
                  id="nav-customer-view-btn"
                  onClick={() => onSelectTab('customer-catalog')}
                  className="text-xs px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors hidden sm:block font-medium"
                >
                  Customer View
                </button>

                <button
                  id="nav-admin-logout-btn"
                  onClick={onLogout}
                  title="Log out of Admin Session"
                  className="text-xs px-2.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-3 border-t border-slate-800 space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              {isAdmin ? (
                adminNavItems.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    {tab.label} {!!tab.count && tab.count > 0 && `(${tab.count})`}
                  </button>
                ))
              ) : (
                <>
                  <button
                    onClick={() => {
                      onSelectTab('customer-catalog');
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold text-left flex items-center gap-2 ${
                      activeTab === 'customer-catalog'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    Fleet Catalog
                  </button>
                  <button
                    onClick={() => {
                      handleCustomerBookingsClick();
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold text-left flex items-center gap-2 ${
                      activeTab === 'customer-bookings'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <CalendarCheck className="w-4 h-4" />
                    My Reservations {activeBookingsCount > 0 && `(${activeBookingsCount})`}
                  </button>
                  <button
                    onClick={() => {
                      onSelectTab('admin-gps');
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold text-left flex items-center gap-2 ${
                      activeTab === 'admin-gps'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    GPS Map
                  </button>
                  <button
                    onClick={() => {
                      onSelectTab('admin-antitheft');
                      setMobileMenuOpen(false);
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold text-left flex items-center gap-2 ${
                      activeTab === 'admin-antitheft'
                        ? 'bg-slate-800 text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Security Shield
                  </button>
                </>
              )}
            </div>

            {currentUser && (
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Signed in as {currentUser.name}</span>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
};
