import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

const connectedUsers = new Map();

export const setupSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('Authentication error'));
      }
      
      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.username} connected`);
    
    connectedUsers.set(socket.userId, socket.id);
    
    await User.findByIdAndUpdate(socket.userId, { 
      isOnline: true, 
      lastSeen: new Date() 
    });

    const userChats = await Chat.find({
      participants: socket.userId
    });

    userChats.forEach(chat => {
      socket.join(chat._id.toString());
    });

    socket.broadcast.emit('user_online', {
      userId: socket.userId,
      username: socket.user.username
    });

    socket.on('join_chat', (chatId) => {
      socket.join(chatId);
    });

    socket.on('leave_chat', (chatId) => {
      socket.leave(chatId);
    });

    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, messageType = 'text' } = data;

        const chat = await Chat.findOne({
          _id: chatId,
          participants: socket.userId
        });

        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        const message = new Message({
          content,
          sender: socket.userId,
          chat: chatId,
          messageType
        });

        await message.save();

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          lastMessageTime: message.createdAt
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar');

        io.to(chatId).emit('new_message', populatedMessage);

      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('edit_message', async (data) => {
      try {
        const { messageId, content } = data;

        const message = await Message.findOne({
          _id: messageId,
          sender: socket.userId
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        
        await message.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('sender', 'username avatar');

        io.to(message.chat.toString()).emit('message_edited', populatedMessage);

      } catch (error) {
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    socket.on('delete_message', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findOne({
          _id: messageId,
          sender: socket.userId
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        const chatId = message.chat;
        await Message.findByIdAndDelete(messageId);

        const lastMessage = await Message.findOne({ chat: chatId })
          .sort({ createdAt: -1 });

        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: lastMessage ? lastMessage._id : null,
          lastMessageTime: lastMessage ? lastMessage.createdAt : new Date()
        });

        io.to(chatId.toString()).emit('message_deleted', { messageId });

      } catch (error) {
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    socket.on('typing', (data) => {
      socket.to(data.chatId).emit('user_typing', {
        userId: socket.userId,
        username: socket.user.username
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(data.chatId).emit('user_stop_typing', {
        userId: socket.userId
      });
    });

    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected`);
      
      connectedUsers.delete(socket.userId);
      
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false, 
        lastSeen: new Date() 
      });

      socket.broadcast.emit('user_offline', {
        userId: socket.userId,
        username: socket.user.username
      });
    });
  });
};