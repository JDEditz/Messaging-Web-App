import React, { useState, useEffect, useRef } from 'react';
import { Send, MoreVertical, Edit2, Trash2, Users, Phone, Video } from 'lucide-react';
import { messageAPI, chatAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import LoadingSpinner from './LoadingSpinner';

const ChatWindow = ({ chat, onChatDeleted, onChatLeft }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const { socket, typingUsers } = useSocket();
  const { user } = useAuth();

  useEffect(() => {
    if (chat) {
      loadMessages();
      if (socket) {
        socket.emit('join_chat', chat._id);
      }
    }
  }, [chat]);

  useEffect(() => {
    if (socket) {
      socket.on('new_message', handleNewMessage);
      socket.on('message_edited', handleMessageEdited);
      socket.on('message_deleted', handleMessageDeleted);
      
      return () => {
        socket.off('new_message');
        socket.off('message_edited');
        socket.off('message_deleted');
      };
    }
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    if (!chat) return;
    
    setLoading(true);
    try {
      const response = await messageAPI.getMessages(chat._id);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    if (message.chat === chat._id) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleMessageEdited = (editedMessage) => {
    if (editedMessage.chat === chat._id) {
      setMessages(prev => prev.map(msg => 
        msg._id === editedMessage._id ? editedMessage : msg
      ));
    }
  };

  const handleMessageDeleted = ({ messageId }) => {
    setMessages(prev => prev.filter(msg => msg._id !== messageId));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    if (editingMessage) {
      handleEditMessage();
      return;
    }

    setSending(true);
    try {
      if (socket) {
        socket.emit('send_message', {
          chatId: chat._id,
          content: newMessage.trim()
        });
      }
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !newMessage.trim()) return;

    try {
      if (socket) {
        socket.emit('edit_message', {
          messageId: editingMessage._id,
          content: newMessage.trim()
        });
      }
      setEditingMessage(null);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      if (socket) {
        socket.emit('delete_message', { messageId });
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const startEditing = (message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
  };

  const cancelEditing = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const handleDeleteChat = async () => {
    try {
      await chatAPI.deleteChat(chat._id);
      onChatDeleted(chat._id);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleLeaveChat = async () => {
    try {
      await chatAPI.leaveChat(chat._id);
      onChatLeft(chat._id);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to leave chat:', error);
    }
  };

  const getChatName = () => {
    if (chat.isGroupChat) {
      return chat.name || 'Group Chat';
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user.id);
      return otherParticipant?.username || 'Unknown User';
    }
  };

  const getChatAvatar = () => {
    if (chat.isGroupChat) {
      return { username: chat.name || 'Group' };
    } else {
      return chat.participants.find(p => p._id !== user.id) || { username: 'Unknown' };
    }
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar user={getChatAvatar()} size="md" showOnline={!chat.isGroupChat} />
          <div>
            <h3 className="font-semibold text-gray-900">{getChatName()}</h3>
            {chat.isGroupChat && (
              <p className="text-sm text-gray-500">
                {chat.participants.length} members
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
            <Video className="w-5 h-5" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
                {chat.isGroupChat && (
                  <button
                    onClick={handleLeaveChat}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Leave Chat
                  </button>
                )}
                <button
                  onClick={handleDeleteChat}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <LoadingSpinner size="lg" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender._id === user.id;
              return (
                <div
                  key={message._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} message-animation`}
                >
                  <div className={`flex gap-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse' : ''}`}>
                    {!isOwn && <Avatar user={message.sender} size="sm" />}
                    
                    <div className="group relative">
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                          <span className={`text-xs ${isOwn ? 'text-primary-200' : 'text-gray-500'}`}>
                            {formatMessageTime(message.createdAt)}
                          </span>
                          {message.isEdited && (
                            <span className={`text-xs ${isOwn ? 'text-primary-200' : 'text-gray-500'}`}>
                              (edited)
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isOwn && (
                        <div className="absolute top-0 right-full mr-2 hidden group-hover:flex items-center gap-1">
                          <button
                            onClick={() => startEditing(message)}
                            className="p-1 text-gray-500 hover:text-primary-600 rounded"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            className="p-1 text-gray-500 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {Array.from(typingUsers.entries()).map(([userId, username]) => (
              <div key={userId} className="flex justify-start">
                <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500">{username} is typing...</span>
                  </div>
                </div>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        {editingMessage && (
          <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between">
            <span className="text-sm text-yellow-800">Editing message</span>
            <button
              onClick={cancelEditing}
              className="text-yellow-600 hover:text-yellow-800"
            >
              Cancel
            </button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? <LoadingSpinner size="sm" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;