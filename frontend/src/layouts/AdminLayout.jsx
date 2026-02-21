import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Flag, Settings, LogOut, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui';
import { FundoraLogo } from '../components/FundoraLogo';
import { useAuth } from '../context/AuthContext';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const isActive = (path) => location.pathname === path;

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
        <nav className="p-4 space-y-1 flex-1 pt-6">
          <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/admin/campaigns" icon={ShieldAlert} label="Campaign Queue" />
          <NavItem to="/admin/users" icon={Users} label="User Management" />
          <NavItem to="/admin/moderation" icon={Flag} label="Moderation" />
          <NavItem to="/admin/milestone-review" icon={CheckCircle2} label="Milestone Review" />
          <NavItem to="/admin/financial-reports" icon={LayoutDashboard} label="Financial Reports" />
          <NavItem to="/admin/settings" icon={Settings} label="Platform Settings" />
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

