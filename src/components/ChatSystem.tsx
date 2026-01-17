import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, User } from '../types/lms';
import { Search, Send, MessageCircle, X } from 'lucide-react';

interface ChatSystemProps {
  currentUser: User;
  users: User[];
  messages: ChatMessage[];
  onSendMessage: (receiverId: string, message: string) => void;
  onMarkAsRead: (messageId: string) => void;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({
  currentUser,
  users,
  messages,
  onSendMessage,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to safely get a display name
  const getUserName = (u: any) => {
    if (u.firstname && u.surname) return `${u.firstname} ${u.surname}`;
    if (u.name) return u.name;
    if (u.firstname) return u.firstname;
    return u.email || 'Unknown User';
  };

  // ✅ FIX: Force timestamps to be treated as UTC
  // If the backend sends "2024-01-01T10:00", we make it "2024-01-01T10:00Z"
  // This tells the browser: "This is UTC time, please show it in the user's local time."
  const getUtcDate = (dateString?: string) => {
    if (!dateString) return new Date(0);
    // If it's a standard ISO string without timezone info, append Z
    if (dateString.includes('T') && !dateString.endsWith('Z') && !dateString.includes('+')) {
      return new Date(dateString + 'Z');
    }
    return new Date(dateString);
  };

  // Filter out the current user from the list
  const chatUsers = users.filter(u => String(u.id) !== String(currentUser.id));

  const filteredUsers = chatUsers.filter(u => {
    const name = getUserName(u).toLowerCase();
    const email = (u.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const conversation = selectedUser
    ? messages.filter(m => {
        const senderId = m.sender?.id || (m as any).senderId;
        const receiverId = m.receiver?.id || (m as any).receiverId;
        
        return (
          (String(senderId) === String(currentUser.id) && String(receiverId) === String(selectedUser.id)) ||
          (String(senderId) === String(selectedUser.id) && String(receiverId) === String(currentUser.id))
        );
      }).sort((a, b) => {
        // ✅ FIX: Use getUtcDate for sorting
        return getUtcDate(a.sentAt || a.timestamp).getTime() - getUtcDate(b.sentAt || b.timestamp).getTime();
      })
    : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedUser) {
      onSendMessage(selectedUser.id, newMessage.trim());
      setNewMessage('');
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      // ✅ FIX: Use getUtcDate for display
      return getUtcDate(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col md:flex-row border border-gray-200">
      {/* Users List */}
      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search people..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                    selectedUser?.id === user.id ? 'bg-red-50 border-l-4 border-red-600' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold">
                    {getUserName(user).charAt(0).toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="font-medium text-gray-900 truncate">{getUserName(user)}</h4>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedUser ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                  {getUserName(selectedUser).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{getUserName(selectedUser)}</h3>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="md:hidden text-gray-400">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {conversation.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">
                  <p>No messages yet. Say hello!</p>
                </div>
              ) : (
                conversation.map((msg, idx) => {
                  const senderId = msg.sender?.id || (msg as any).senderId;
                  const isMe = String(senderId) === String(currentUser.id);
                  
                  return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-lg text-sm shadow-sm ${
                        isMe ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                      }`}>
                        <p>{msg.content || msg.message}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                          {formatTime(msg.sentAt || msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
                <button type="submit" disabled={!newMessage.trim()} className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
            <MessageCircle size={48} className="mb-4 opacity-20" />
            <p>Select a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
};