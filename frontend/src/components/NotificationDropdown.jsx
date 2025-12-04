import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Clock, MessageSquare, DollarSign, ShieldAlert } from 'lucide-react';
import { Button, Card, Badge } from './ui';

export function NotificationDropdown({ isOpen, onClose }) {
  if (!isOpen) return null;

  const notifications = [
    { id: 1, type: 'funding', title: "Campaign Goal Reached!", message: "Eco-Friendly Water Purifier has reached 100% funding.", time: "2m ago", read: false },
    { id: 2, type: 'message', title: "New Message", message: "TechFarm Nepal sent you a message.", time: "1h ago", read: false },
    { id: 3, type: 'system', title: "Milestone Approved", message: "Your milestone 'Prototype Testing' has been approved.", time: "5h ago", read: true },
    { id: 4, type: 'alert', title: "Action Required", message: "Please update your payment details.", time: "1d ago", read: true },
  ];

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 animate-in fade-in zoom-in-95 duration-200">
      <Card className="shadow-xl border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-slate-900">Notifications</h3>
          <Link to="/notifications" onClick={onClose} className="text-xs text-sky-600 hover:text-blue-700 font-medium">
            View All
          </Link>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {notifications.map((notif) => (
                <div key={notif.id} className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer ${notif.read ? 'opacity-70' : 'bg-sky-50/30'}`}>
                  <div className="flex gap-3">
                    <div className={`mt-1 p-2 rounded-full shrink-0 ${
                      notif.type === 'funding' ? 'bg-green-100 text-green-600' :
                      notif.type === 'message' ? 'bg-sky-100 text-sky-600' :
                      notif.type === 'alert' ? 'bg-red-100 text-red-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {notif.type === 'funding' ? <DollarSign className="w-4 h-4" /> :
                       notif.type === 'message' ? <MessageSquare className="w-4 h-4" /> :
                       notif.type === 'alert' ? <ShieldAlert className="w-4 h-4" /> :
                       <Bell className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className={`text-sm ${notif.read ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{notif.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {notif.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No new notifications</p>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
          <Button variant="ghost" size="sm" className="text-xs text-slate-500 w-full h-8">
            Mark all as read
          </Button>
        </div>
      </Card>
    </div>
  );
}
