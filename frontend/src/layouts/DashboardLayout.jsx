import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, Heart, MessageSquare, Settings, LogOut, History, Compass } from 'lucide-react';
import { Button } from '../components/ui';
import { FundoraLogo } from '../components/FundoraLogo';

export function DashboardLayout() {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link to={to}>
      <Button 
        variant={isActive(to) ? "secondary" : "ghost"} 
        className={`w-full justify-start ${isActive(to) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600'}`}
      >
        <Icon className="mr-3 h-5 w-5" /> {label}
      </Button>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex lg:flex-col shrink-0">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center">
            <FundoraLogo />
          </Link>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/dashboard/supported" icon={Heart} label="Supported Projects" />
          <NavItem to="/campaigns" icon={Compass} label="Browse Campaigns" />
          <NavItem to="/dashboard/transactions" icon={History} label="Transactions" />
          <NavItem to="/dashboard/messages" icon={MessageSquare} label="Messages" />
          <NavItem to="/dashboard/profile" icon={Settings} label="Settings" />
        </nav>
        <div className="p-4 border-t border-slate-100">
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="mr-3 h-5 w-5" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
