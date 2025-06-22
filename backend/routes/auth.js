import express from 'express';
import { register, login, getProfile, searchUsers } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.get('/search', authenticate, searchUsers);

export default router;