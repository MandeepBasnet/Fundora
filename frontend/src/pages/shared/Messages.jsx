import React from 'react';
import { Search, MoreVertical, Send } from 'lucide-react';
import { Button, Card, Input, Avatar } from '../../components/ui';

export function Messages() {
  const conversations = [
    { id: 1, name: "TechFarm Nepal", lastMessage: "Thanks for your support!", time: "2m ago", unread: true },
    { id: 2, name: "Heritage Filmmakers", lastMessage: "We will ship the rewards soon.", time: "1h ago", unread: false },
    { id: 3, name: "GreenPack Nepal", lastMessage: "Can you confirm your address?", time: "1d ago", unread: false },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar */}
      <Card className="w-80 flex flex-col border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-bold text-lg mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Search messages..." className="pl-9 bg-slate-50" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div key={conv.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${conv.unread ? 'bg-blue-50/50' : ''}`}>
              <div className="flex justify-between items-start mb-1">
                <h3 className={`font-medium text-sm ${conv.unread ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>{conv.name}</h3>
                <span className="text-xs text-slate-400">{conv.time}</span>
              </div>
              <p className={`text-sm truncate ${conv.unread ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{conv.lastMessage}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div className="flex items-center gap-3">
            <Avatar fallback="TF" className="bg-blue-100 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-900">TechFarm Nepal</h3>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span> Online
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5 text-slate-500" /></Button>
        </div>

        {/* Messages */}
        <div className="flex-1 bg-slate-50/50 p-6 overflow-y-auto space-y-4">
          <div className="flex justify-end">
            <div className="bg-blue-600 text-white p-3 rounded-2xl rounded-tr-none max-w-md shadow-sm text-sm">
              Hi! I just backed your project. Really excited about the IoT sensors!
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-white text-slate-700 border border-slate-100 p-3 rounded-2xl rounded-tl-none max-w-md shadow-sm text-sm">
              Thanks for your support! We're working hard to get the first batch ready. Let us know if you have any questions.
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2">
            <Input placeholder="Type a message..." className="flex-1" />
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-4">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
