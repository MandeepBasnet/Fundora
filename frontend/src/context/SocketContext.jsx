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
  const [onlineUsersMap, setOnlineUsersMap] = useState({});

  useEffect(() => {
    // Only connect if user is authenticated and we have a token
    const token = localStorage.getItem('token');
    
    if (user && token && !socket) {
      const newSocket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
      });

      newSocket.on('new_message_notification', (data) => {
        // Increment unread count, trigger browser notification if allowed
        setUnreadCount(prev => prev + 1);

        if (Notification.permission === 'granted') {
          new Notification('New Message on Fundora', {
            body: `${data.message.sender.name}: ${data.message.content.substring(0, 50)}...`,
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

      // Request notification permission on connect if not denied
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, unreadCount, setUnreadCount, onlineUsersMap }}>
      {children}
    </SocketContext.Provider>
  );
};
