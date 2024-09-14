import express from 'express';
import { getAdmins, getUserPerformance } from '../controllers/management.js';

const router = express.Router();

router.get('/admins', getAdmins);
// pass an id from frontend to get performance
// for that particular user
router.get('/performance/:id', getUserPerformance);

export default router;
