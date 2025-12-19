import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Clock, MessageSquare, Heart, ExternalLink, Settings } from 'lucide-react';
import { Card, Button } from './ui';
import { cn } from '../utils/cn';

export function Sidebar({ className }) {
  const location = useLocation();
  const pathname = location.pathname;

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
    { name: 'Supported Projects', href: '/dashboard/supported', icon: Heart },
    { name: 'Transactions', href: '/dashboard/transactions', icon: Clock },
    { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  ];

  const isActive = (path, exact) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="p-4 border-slate-200">
        <nav className="space-y-2">
          {links.map((link) => (
            <Link key={link.href} to={link.href}>
              <Button 
                variant={isActive(link.href, link.exact) ? "secondary" : "ghost"} 
                className={cn(
                  "w-full justify-start",
                  isActive(link.href, link.exact) ? "bg-slate-100 text-slate-900 font-medium" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <link.icon className="w-4 h-4 mr-3" />
                {link.name}
              </Button>
            </Link>
          ))}
        </nav>
      </Card>

      <Card className="p-4 border-slate-200 bg-sky-50/50">
        <h3 className="font-bold text-sm text-sky-900 mb-3 px-2">Discover</h3>
        <Link to="/campaigns">
          <Button className="w-full justify-start bg-sky-600 hover:bg-sky-700 text-white">
            <ExternalLink className="w-4 h-4 mr-2" /> Browse Campaigns
          </Button>
        </Link>
      </Card>
    </div>
  );
}
