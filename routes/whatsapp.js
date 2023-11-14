import express from 'express';
import processMessage from '../controllers/whatsapp/processMessage.js'
import verifyWebhook from '../controllers/whatsapp/verifyWebhook.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

router.post('/webhook', processMessage)
router.get('/webhook', verifyWebhook)

export default router