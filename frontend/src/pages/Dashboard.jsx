import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatList from '../components/ChatList';
import ChatWindow from '../components/ChatWindow';
import Avatar from '../components/Avatar';

const Dashboard = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const { user, logout } = useAuth();

  const handleChatDeleted = () => {
    setSelectedChat(null);
  };

  const handleChatLeft = () => {
    setSelectedChat(null);
  };

  return (
    <div className="h-screen flex bg-gray-100">
      <div className="flex flex-col">
        <ChatList 
          selectedChat={selectedChat} 
          onSelectChat={setSelectedChat}
        />
        
        <div className="bg-white border-r border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar user={user} size="sm" />
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{user?.username}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="p-1 text-gray-500 hover:text-gray-700 rounded-full"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              {showProfile && (
                <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                  <button
                    onClick={() => setShowProfile(false)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <hr className="my-1" />
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ChatWindow 
        chat={selectedChat}
        onChatDeleted={handleChatDeleted}
        onChatLeft={handleChatLeft}
      />
    </div>
  );
};

export default Dashboard;