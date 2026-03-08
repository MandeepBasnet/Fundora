import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Send, Download, MessageCircle, AlertTriangle, Ban } from 'lucide-react';
import { Button, Card, Input, Avatar } from '../../components/ui';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow, format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ReportUserModal } from './ReportUserModal';

export function Messages() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket, setUnreadCount, onlineUsersMap } = useSocket();

  const getMessagesBasePath = () => {
    if (user?.role === 'creator') return '/creator/messages';
    return '/dashboard/messages';
  };

  // Helper: safely find the OTHER participant (not the current user)
  const getOtherUser = (participants) => {
    if (!participants || participants.length === 0) return {};
    return participants.find(p => p._id?.toString() !== (user?._id || user?.id)?.toString()) || participants[0];
  };

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [inputMsg, setInputMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const optionsRef = useRef(null);
  
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load Conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const res = await api.get('/messages/conversations');
        setConversations(res.data.data);
      } catch (err) {
        console.error('Failed to load convos', err);
      }
    };
    loadConversations();
  }, [conversationId]); // reload list slightly when chat changes to update read status if needed

  useEffect(() => {
    function handleClickOutside(event) {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [optionsRef]);

  // Select Active Conversation
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conv = conversations.find(c => c._id === conversationId);
      if (conv) setActiveConv(conv);
    } else {
      setActiveConv(null);
    }
  }, [conversationId, conversations]);

  // Load Messages for active conversation
  const loadMessages = useCallback(async (convId, pageNum, append = false) => {
    try {
      setLoading(true);
      const res = await api.get(`/messages/${convId}?page=${pageNum}&limit=50`);
      const newMsgs = res.data.data;
      
      if (append) {
        setMessages(prev => [...newMsgs, ...prev]);
      } else {
        setMessages(newMsgs);
        setTimeout(() => scrollToBottom(), 100);
      }
      
      setHasMore(res.data.data.length === 50);
      
      // Reset unread counts logically (context is global, but just to be safe)
      setUnreadCount(0); 
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    if (conversationId) {
      setPage(1);
      loadMessages(conversationId, 1, false);
      
      if (socket) {
        socket.emit('join_conversation', conversationId);
      }
      
      return () => {
        if (socket) socket.emit('leave_conversation', conversationId);
      };
    }
  }, [conversationId, loadMessages, socket]);

  // Socket Events
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg) => {
      if (msg.conversationId === conversationId) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
      
      // Update convo list latest message
      setConversations(prev => prev.map(c => {
        if (c._id === msg.conversationId) {
          return { ...c, lastMessage: msg, updatedAt: new Date().toISOString() };
        }
        return c;
      }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
    };

    const handleTyping = ({ userId, isTyping: typingData }) => {
      if (userId !== (user?._id || user?.id)) {
        setRemoteTyping(typingData);
      }
    };

    socket.on('receive_message', handleNewMessage);
    socket.on('typing_status', handleTyping);

    return () => {
      socket.off('receive_message', handleNewMessage);
      socket.off('typing_status', handleTyping);
    };
  }, [socket, conversationId, user]);

  // Infinite Scroll Handler
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && !loading && hasMore) {
      const newPage = page + 1;
      setPage(newPage);
      loadMessages(conversationId, newPage, true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  const notifyTyping = (typing) => {
    if (!socket || !conversationId) return;
    socket.emit('typing', { conversationId, isTyping: typing });
  };

  const handleInputChange = (e) => {
    setInputMsg(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      notifyTyping(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      notifyTyping(false);
    }, 500); // 500ms debounce
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMsg.trim() || !socket || !conversationId) return;
    if (inputMsg.length > 2000) return;

    const content = inputMsg.trim();
    setInputMsg('');
    setIsTyping(false);
    notifyTyping(false);

    socket.emit('send_message', { conversationId, content });
  };

  const handleBlock = async () => {
    if (!activeConv) return;
    if (window.confirm("Are you sure you want to block this user?")) {
      try {
        await api.put(`/messages/${activeConv._id}/block`);
        alert("User blocked successfully.");
        navigate(getMessagesBasePath());
      } catch (e) {
        console.error(e);
      }
    }
  };

  // PDF Export
  const exportPDF = () => {
    if (!activeConv || messages.length === 0) return;
    const doc = new jsPDF();
    const otherParticipant = getOtherUser(activeConv.participants);
    
    doc.setFontSize(16);
    doc.text(`Conversation with ${otherParticipant.name}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Campaign: ${activeConv.campaign.title}`, 14, 26);
    doc.text(`Exported on: ${new Date().toLocaleString()}`, 14, 32);

    const tableData = messages.map(m => [
      format(new Date(m.createdAt), 'MMM d, yyyy HH:mm'),
      m.sender.name,
      m.content
    ]);

    doc.autoTable({
      startY: 40,
      head: [['Time', 'Sender', 'Message']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8, cellWidth: 'wrap' },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 30 },
        2: { cellWidth: 'auto' }
      }
    });

    doc.save(`conversation-${conversationId}.pdf`);
  };

  // Formatting helpers
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    if (now - date < 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
    return format(date, 'MMM d, h:mm a');
  };

  const filteredMessages = messages.filter(m => 
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
    <div className="h-[calc(100vh-8rem)] flex gap-6 px-4 py-4 max-w-7xl mx-auto">
      {/* Sidebar */}
      <Card className="w-80 flex flex-col border-slate-200 overflow-hidden shrink-0 shadow-sm bg-white">
        <div className="p-4 border-b border-slate-100 pb-4">
          <h2 className="font-bold text-xl text-slate-800 mb-4">Inbox</h2>
          {conversations.length > 0 ? (
            <p className="text-xs text-slate-500 mb-4">Select a conversation to start messaging</p>
          ) : null}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center">
              <span className="text-4xl mb-2">📬</span>
              <p className="text-sm">No conversations yet.</p>
              <p className="text-xs mt-2">Back a campaign to start messaging!</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUser = getOtherUser(conv.participants);
              const isUnread = conv.unreadCount > 0;
              const isOnline = onlineUsersMap && onlineUsersMap[otherUser._id];
              
              return (
                <div 
                  key={conv._id} 
                  onClick={() => navigate(`${getMessagesBasePath()}/${conv._id}`)}
                  className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors relative ${
                    conversationId === conv._id ? 'bg-sky-50/50 border-l-4 border-l-sky-500' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar src={otherUser?.profile?.avatar} fallback={otherUser?.name?.charAt(0)} className="w-6 h-6 text-[10px]" />
                        {isOnline && <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border border-white"></span>}
                      </div>
                      <h3 className={`font-medium text-sm truncate ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                        {otherUser?.name || 'Unknown User'}
                      </h3>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {conv.lastMessage && (
                        <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                          {formatDistanceToNow(new Date(conv.lastMessage.createdAt))}
                        </span>
                      )}
                      {isUnread && (
                        <span className="bg-sky-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs truncate text-slate-400 mb-1 ml-8">{conv.campaign?.title}</div>
                  <p className={`text-sm truncate ml-8 ${isUnread ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                    {conv.lastMessage ? conv.lastMessage.content : 'No messages yet'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* Chat Area */}
      {conversationId && activeConv ? (
        <Card className="flex-1 flex flex-col border-slate-200 overflow-hidden shadow-sm bg-white">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 relative">
            <div className="flex items-center gap-3">
              {(() => { const other = getOtherUser(activeConv.participants); return (
              <>
              <div className="relative">
                <Avatar src={other?.profile?.avatar} fallback={other?.name?.charAt(0)} className="bg-sky-100 text-sky-600" />
                {onlineUsersMap && onlineUsersMap[other?._id] && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{other?.name}</h3>
                <p className="text-xs text-slate-500 truncate max-w-md">
                  {onlineUsersMap && onlineUsersMap[other?._id] ? (
                    <span className="text-green-600 font-medium">Online</span>
                  ) : (
                    "Offline"
                  )} • Regarding: {activeConv.campaign?.title}
                </p>
              </div>
              </>
              ); })()}
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative hidden md:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search in chat..." 
                  className="pl-8 h-8 text-xs w-48 bg-slate-50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={exportPDF} title="Export as PDF" className="h-8 px-2 text-xs">
                <Download className="w-4 h-4 mr-1" /> Export
              </Button>
              <div className="relative" ref={optionsRef}>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setShowOptions(!showOptions)}>
                  <MoreVertical className="w-5 h-5" />
                </Button>
                {showOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-lg shadow-xl z-50 py-1">
                    <button onClick={() => { setShowOptions(false); handleBlock(); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                       <Ban className="w-4 h-4" /> Block User
                    </button>
                    <button onClick={() => { setShowOptions(false); setShowReportModal(true); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                       <AlertTriangle className="w-4 h-4" /> Report User
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 bg-slate-50/50 p-6 overflow-y-auto space-y-6"
          >
            {loading && messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm py-4">Loading messages...</div>
            )}
            
            {loading && messages.length > 0 && (
              <div className="text-center text-slate-400 text-xs py-2">Loading older...</div>
            )}

            {filteredMessages.map((msg, index) => {
              const currentUserId = user?._id || user?.id;
              const isMine = typeof msg.sender === 'string' ? msg.sender === currentUserId : msg.sender._id?.toString() === currentUserId;
              const showTime = index === 0 || new Date(msg.createdAt) - new Date(filteredMessages[index-1].createdAt) > 5 * 60000;
              
              return (
                <div key={msg._id || index} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  {showTime && (
                    <span className="text-[10px] text-slate-400 mb-2">{formatTime(msg.createdAt)}</span>
                  )}
                  <div className={`p-3 rounded-2xl max-w-md shadow-sm whitespace-pre-wrap ${
                    isMine 
                      ? 'bg-sky-600 text-white rounded-tr-sm' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            })}
            
            {remoteTyping && (
              <div className="flex items-start">
                 <div className="bg-white text-slate-400 border border-slate-100 p-3 rounded-2xl rounded-tl-sm shadow-sm text-sm">
                   Typing...
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-100 shrink-0">
            <form onSubmit={sendMessage} className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <textarea 
                  value={inputMsg}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message... (Press Enter to send)" 
                  className="w-full flex min-h-[44px] max-h-[120px] resize-none items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  rows={1}
                  maxLength={2000}
                />
                <div className="absolute right-2 bottom-2 text-[10px] text-slate-400">
                  {inputMsg.length}/2000
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={!inputMsg.trim()}
                className="bg-sky-600 hover:bg-sky-700 text-white h-[44px] px-6 rounded-lg"
              >
                <Send className="w-5 h-5" />
              </Button>
            </form>
          </div>
        </Card>
      ) : (
        <Card className="flex-1 flex flex-col items-center justify-center border-slate-200 bg-slate-50 shadow-sm text-slate-400">
          <MessageCircle className="w-16 h-16 mb-4 text-slate-300" />
          <h2 className="text-xl font-medium text-slate-600">Your Messages</h2>
          <p className="text-sm">Select a conversation from the sidebar to view details</p>
        </Card>
      )}
    </div>
      {showReportModal && (
        <ReportUserModal 
          isOpen={showReportModal} 
          onClose={() => setShowReportModal(false)}
          conversationId={activeConv?._id}
          reportedUserId={getOtherUser(activeConv?.participants)?._id}
          reportedUserName={getOtherUser(activeConv?.participants)?.name}
        />
      )}
    </>
  );
}
