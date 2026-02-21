import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Clock, MessageSquare, DollarSign, ShieldAlert, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button, Card, Badge } from './ui';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '../services/notificationService';

// Map notification types to icons and colors
const NOTIF_TYPE_CONFIG = {
  'milestone_submitted': { icon: CheckCircle2, bg: 'bg-yellow-100', color: 'text-yellow-600' },
  'milestone_approved': { icon: CheckCircle2, bg: 'bg-green-100', color: 'text-green-600' },
  'milestone_rejected': { icon: XCircle, bg: 'bg-red-100', color: 'text-red-600' },
  'funds_released': { icon: DollarSign, bg: 'bg-green-100', color: 'text-green-600' },
  'project_completed': { icon: CheckCircle2, bg: 'bg-sky-100', color: 'text-sky-600' },
  'backer_milestone_update': { icon: CheckCircle2, bg: 'bg-sky-100', color: 'text-sky-600' },
  'resubmission_required': { icon: ShieldAlert, bg: 'bg-amber-100', color: 'text-amber-600' },
  'default': { icon: Bell, bg: 'bg-slate-100', color: 'text-slate-600' }
};

export function NotificationDropdown({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Poll for unread count every 30s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await getUnreadCount();
        setUnreadCount(data.count || 0);
      } catch (err) {
        // Silently fail
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications({ limit: 10 });
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId) => {
    try {
      await markAsRead(notifId);
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 animate-in fade-in zoom-in-95 duration-200">
      <Card className="shadow-xl border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-slate-900">
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-600 text-xs">{unreadCount}</Badge>
            )}
          </h3>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600 mx-auto" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {notifications.map((notif) => {
                const config = NOTIF_TYPE_CONFIG[notif.type] || NOTIF_TYPE_CONFIG['default'];
                const IconComp = config.icon;
                return (
                  <div 
                    key={notif._id} 
                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${notif.isRead ? 'opacity-70' : 'bg-sky-50/30'}`}
                    onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 p-2 rounded-full shrink-0 ${config.bg} ${config.color}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm ${notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                          {notif.title}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {getTimeAgo(notif.createdAt)}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-sky-500 mt-2 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-slate-500 w-full h-8"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Export unread count for use in Navbar bell icon
export { getUnreadCount };
