import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationUnread, setNotificationUnread] = useState(0);
  const [onlineUsersMap, setOnlineUsersMap] = useState({});

  useEffect(() => {
    let newSocket = null;
    const token = localStorage.getItem('token');
    
    if (user && token) {
      newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('new_message_notification', (data) => {
        setUnreadCount(prev => prev + 1);
        if (Notification.permission === 'granted') {
          new Notification('New Message on Fundora', {
            body: `${data.message.sender.name}: ${data.message.content.substring(0, 50)}...`,
            icon: '/vite.svg'
          });
        }
      });

      newSocket.on('new_notification', (data) => {
        setNotificationUnread(prev => prev + 1);
        if (Notification.permission === 'granted') {
          new Notification(data.title || 'Fundora Notification', {
            body: data.message || 'You have a new notification',
            icon: '/vite.svg'
          });
        }
      });

      newSocket.on('user_status', ({ userId, status }) => {
        setOnlineUsersMap(prev => ({
          ...prev,
          [userId]: status === 'online'
        }));
      });

      setSocket(newSocket);

      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    } else {
      // If user logs out, clear the socket state
      setSocket(null);
    }

    // Cleanup always runs when dependencies change or on unmount
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount, notificationUnread, setNotificationUnread, onlineUsersMap }}>
      {children}
    </SocketContext.Provider>
  );
};
