import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Bell, User, LogOut, LayoutDashboard } from 'lucide-react';
import { Button, Input } from './ui';
import { FundoraLogo } from './FundoraLogo';
import { NotificationDropdown } from './NotificationDropdown';
import { useAuth } from '../context/AuthContext';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifRef, profileRef]);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <FundoraLogo />
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search campaigns..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-slate-50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            <Link to="/campaigns" className="hidden md:block text-sm font-medium text-gray-700 hover:text-sky-600 transition-colors">
              Explore
            </Link>
            <Link to="/dashboard" className="hidden md:block text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              Dashboard
            </Link>
            
            <div className="relative" ref={notifRef}>
              <button 
                className="p-2 text-gray-700 hover:text-blue-600 transition-colors relative"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
            </div>

            {/* Auth Dropdown */}
            {authUser ? (
              <div className="relative" ref={profileRef}>
                <button 
                  className="flex items-center gap-2 p-2 text-gray-700 hover:text-blue-600 transition-colors"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                >
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-semibold">
                    {authUser.name ? authUser.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                  </div>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900 truncate">{authUser.name}</p>
                      <p className="text-xs text-gray-500 truncate">{authUser.email}</p>
                    </div>
                    <div className="py-1">
                      <Link 
                        to="/dashboard" 
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-sky-600"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                      </Link>
                      <Link 
                        to="/profile" 
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-slate-50 hover:text-sky-600"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <button 
                        onClick={() => {
                          logout();
                          setIsProfileOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden sm:flex p-2 text-gray-700 hover:text-blue-600 transition-colors">
                <User className="w-5 h-5" />
              </Link>
            )}

            <Button className="bg-sky-600 hover:bg-sky-700 text-white" onClick={() => navigate('/start-campaign')}>
              Start a Campaign
            </Button>

            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-xl animate-in slide-in-from-top-2 z-40">
          <div className="p-4 space-y-4">
            <Link to="/" className="block text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-slate-50 p-3 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Explore</Link>
            <Link to="/dashboard" className="block text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-slate-50 p-3 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
            <Link to="/login" className="block text-base font-medium text-slate-700 hover:text-sky-600 hover:bg-slate-50 p-3 rounded-lg transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
            <div className="pt-2">
              <Input type="search" placeholder="Search campaigns..." className="w-full" />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
