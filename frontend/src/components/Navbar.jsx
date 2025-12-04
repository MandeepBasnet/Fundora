import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Bell, User } from 'lucide-react';
import { Button, Input } from './ui';
import { FundoraLogo } from './FundoraLogo';
import { NotificationDropdown } from './NotificationDropdown';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifRef]);

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
            <Link to="/" className="hidden md:block text-sm font-medium text-gray-700 hover:text-sky-600 transition-colors">
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

            <Link to="/login" className="hidden sm:flex p-2 text-gray-700 hover:text-blue-600 transition-colors">
              <User className="w-5 h-5" />
            </Link>

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
