import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

export const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
    .populate('participants', 'username email avatar isOnline')
    .populate('lastMessage')
    .sort({ lastMessageTime: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const createChat = async (req, res) => {
  try {
    const { participantIds, name, isGroupChat } = req.body;

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ message: 'At least one participant is required' });
    }

    const participants = [req.user._id, ...participantIds];

    if (!isGroupChat && participants.length !== 2) {
      return res.status(400).json({ message: 'Direct chat must have exactly 2 participants' });
    }

    if (!isGroupChat) {
      const existingChat = await Chat.findOne({
        isGroupChat: false,
        participants: { $all: participants, $size: 2 }
      });

      if (existingChat) {
        return res.status(400).json({ message: 'Chat already exists' });
      }
    }

    const chat = new Chat({
      name: isGroupChat ? name : undefined,
      isGroupChat,
      participants
    });

    await chat.save();
    
    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'username email avatar isOnline');

    res.status(201).json(populatedChat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    }).populate('participants', 'username email avatar isOnline');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    await Message.deleteMany({ chat: chatId });
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const leaveChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.isGroupChat) {
      return res.status(400).json({ message: 'Cannot leave a direct chat' });
    }

    chat.participants = chat.participants.filter(
      participant => !participant.equals(req.user._id)
    );

    if (chat.participants.length === 0) {
      await Message.deleteMany({ chat: chatId });
      await Chat.findByIdAndDelete(chatId);
    } else {
      await chat.save();
    }

    res.json({ message: 'Left chat successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};