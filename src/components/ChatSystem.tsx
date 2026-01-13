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
  onMarkAsRead,
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('ChatSystem - Current users:', users);
    console.log('ChatSystem - Current messages:', messages);
    console.log('ChatSystem - Current user:', currentUser);
  }, [users, messages, currentUser]);

  // Filter students - make sure we're filtering correctly
  const students = users.filter(u => u.id !== currentUser.id && u.role === 'student');
  
  console.log('Filtered students:', students); // Debug log

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get conversation with selected user
  const conversation = selectedUser
    ? messages.filter(m => 
        (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
        (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
      ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  // Get unread message count for each user
  const getUnreadCount = (userId: string) => {
    return messages.filter(m => 
      m.senderId === userId && 
      m.receiverId === currentUser.id && 
      !m.isRead
    ).length;
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (selectedUser) {
      const unreadMessages = messages.filter(m => 
        m.senderId === selectedUser.id && 
        m.receiverId === currentUser.id && 
        !m.isRead
      );
      
      unreadMessages.forEach(message => {
        onMarkAsRead(message.id);
      });
    }
  }, [selectedUser, messages, currentUser.id, onMarkAsRead]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedUser) {
      onSendMessage(selectedUser.id, newMessage.trim());
      setNewMessage('');
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

      if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return 'Invalid date';
    }
  };

  // If no users are available, show a more informative message
  if (students.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md h-[600px] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students available</h3>
          <p className="text-gray-600">There are no other students to chat with at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col md:flex-row">
      {/* Users List - Mobile first, then desktop */}
      <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredStudents.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No students found</p>
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-red-600 text-xs mt-2 hover:text-red-700"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredStudents.map(student => {
                const unreadCount = getUnreadCount(student.id);
                const lastMessage = messages
                  .filter(m => 
                    (m.senderId === currentUser.id && m.receiverId === student.id) ||
                    (m.senderId === student.id && m.receiverId === currentUser.id)
                  )
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

                return (
                  <button
                    key={student.id}
                    onClick={() => setSelectedUser(student)}
                    className={`w-full p-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                      selectedUser?.id === student.id ? 'bg-red-50 border border-red-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-black truncate">{student.name}</h4>
                      {unreadCount > 0 && (
                        <span className="bg-red-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 truncate">{student.email}</p>
                    {lastMessage && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {lastMessage.senderId === currentUser.id ? 'You: ' : ''}
                        {lastMessage.message.length > 30 
                          ? lastMessage.message.substring(0, 30) + '...' 
                          : lastMessage.message}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-black">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 md:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {conversation.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 mb-2">No messages yet</p>
                  <p className="text-gray-600">Start a conversation with {selectedUser.name}</p>
                </div>
              ) : (
                conversation.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.senderId === currentUser.id
                          ? 'bg-red-600 text-white'
                          : 'bg-white text-black border border-gray-200'
                      }`}
                    >
                      <p className="text-sm break-words">{message.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.senderId === currentUser.id ? 'text-red-100' : 'text-gray-500'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${selectedUser.name}...`}
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
            <div className="text-center p-8">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a student to chat</h3>
              <p className="text-gray-600">Choose a student from the list to start messaging</p>
              <div className="mt-4 text-sm text-gray-500">
                <p>Available students: {students.length}</p>
                <p>Total messages: {messages.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};