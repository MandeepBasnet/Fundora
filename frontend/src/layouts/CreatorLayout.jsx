import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Megaphone, Wallet, MessageSquare, Settings, LogOut, History, CheckCircle2, Heart } from 'lucide-react';
import { Button } from '../components/ui';
import { FundoraLogo } from '../components/FundoraLogo';
import { useAuth } from '../context/AuthContext';

export function CreatorLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const isActive = (path) => path === '/creator' ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link to={to}>
      <Button 
        variant={isActive(to) ? "secondary" : "ghost"} 
        className={`w-full justify-start ${isActive(to) ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-600'}`}
      >
        <Icon className="mr-3 h-5 w-5" /> {label}
      </Button>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex lg:flex-col shrink-0">
        <nav className="p-4 space-y-1 flex-1">
          <NavItem to="/creator" icon={LayoutDashboard} label="Overview" />
          <NavItem to="/creator/campaigns" icon={Megaphone} label="My Campaigns" />
          <NavItem to="/creator/saved" icon={Heart} label="Saved Campaigns" />
          <NavItem to="/creator/milestones" icon={CheckCircle2} label="Milestones" />
          <NavItem to="/creator/finances" icon={Wallet} label="Finances" />
          <NavItem to="/creator/transactions" icon={History} label="Transactions" />
          <NavItem to="/creator/messages" icon={MessageSquare} label="Messages" />
          <NavItem to="/creator/profile" icon={Settings} label="Settings" />
        </nav>
        <div className="p-4 border-t border-slate-100">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
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

