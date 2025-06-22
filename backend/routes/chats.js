import express from 'express';
import {
  getChats,
  createChat,
  getChatById,
  deleteChat,
  leaveChat
} from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getChats);
router.post('/', createChat);
router.get('/:chatId', getChatById);
router.delete('/:chatId', deleteChat);
router.post('/:chatId/leave', leaveChat);

export default router;