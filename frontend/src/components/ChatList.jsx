import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, MessageCircle } from 'lucide-react';
import { chatAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import Avatar from './Avatar';
import CreateChatModal from './CreateChatModal';
import LoadingSpinner from './LoadingSpinner';

const ChatList = ({ selectedChat, onSelectChat }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { socket, onlineUsers } = useSocket();

  useEffect(() => {
    loadChats();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('new_message', handleNewMessage);
      return () => socket.off('new_message');
    }
  }, [socket, chats]);

  const loadChats = async () => {
    try {
      const response = await chatAPI.getChats();
      setChats(response.data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    setChats(prevChats => {
      const updatedChats = prevChats.map(chat => {
        if (chat._id === message.chat) {
          return {
            ...chat,
            lastMessage: message,
            lastMessageTime: message.createdAt
          };
        }
        return chat;
      });
      
      return updatedChats.sort((a, b) => 
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );
    });
  };

  const handleChatCreated = (newChat) => {
    setChats(prev => [newChat, ...prev]);
    setShowCreateModal(false);
    onSelectChat(newChat);
  };

  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    
    if (chat.isGroupChat) {
      return chat.name?.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== chat.currentUserId);
      return otherParticipant?.username.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getChatName = (chat) => {
    if (chat.isGroupChat) {
      return chat.name || 'Group Chat';
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== chat.currentUserId);
      return otherParticipant?.username || 'Unknown User';
    }
  };

  const getChatAvatar = (chat) => {
    if (chat.isGroupChat) {
      return { username: chat.name || 'Group' };
    } else {
      return chat.participants.find(p => p._id !== chat.currentUserId) || { username: 'Unknown' };
    }
  };

  const isUserOnline = (chat) => {
    if (chat.isGroupChat) return false;
    const otherParticipant = chat.participants.find(p => p._id !== chat.currentUserId);
    return otherParticipant && onlineUsers.has(otherParticipant._id);
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <MessageCircle className="w-12 h-12 mb-2" />
            <p className="text-sm text-center">No conversations yet. Start a new chat!</p>
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => onSelectChat(chat)}
              className={`flex items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedChat?._id === chat._id ? 'bg-primary-50 border-r-2 border-primary-600' : ''
              }`}
            >
              <div className="relative mr-3">
                <Avatar 
                  user={getChatAvatar(chat)} 
                  size="md" 
                  showOnline={!chat.isGroupChat && isUserOnline(chat)}
                />
                {chat.isGroupChat && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary-600 rounded-full flex items-center justify-center">
                    <Users className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {getChatName(chat)}
                  </h3>
                  {chat.lastMessageTime && (
                    <span className="text-xs text-gray-500">
                      {formatTime(chat.lastMessageTime)}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <CreateChatModal
          onClose={() => setShowCreateModal(false)}
          onChatCreated={handleChatCreated}
        />
      )}
    </div>
  );
};

export default ChatList;