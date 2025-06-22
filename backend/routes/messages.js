import express from 'express';
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage
} from '../controllers/messageController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/:chatId', getMessages);
router.post('/:chatId', sendMessage);
router.put('/:messageId', editMessage);
router.delete('/:messageId', deleteMessage);

export default router;