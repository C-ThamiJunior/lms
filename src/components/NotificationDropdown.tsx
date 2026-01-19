import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  isRead: boolean;
  link?: string;
}

interface NotificationDropdownProps {
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ 
  notifications, 
  onMarkAsRead, 
  onClearAll 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="relative p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-xl">
            <h3 className="font-bold text-gray-800">Notifications</h3>
            {notifications.length > 0 && (
                <button onClick={onClearAll} className="text-xs text-gray-500 hover:text-red-600 font-medium">
                    Clear All
                </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p>No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-red-50/30' : ''}`}
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-red-500' : 'bg-gray-300'}`} />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {notification.timestamp.toLocaleDateString()}
                        </p>
                      </div>
                      {!notification.isRead && (
                          <button onClick={(e) => { e.stopPropagation(); onMarkAsRead(notification.id); }} className="text-gray-400 hover:text-green-600 h-fit">
                             <Check className="w-4 h-4" />
                          </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};