import express from 'express';
import insertToSheet from '../controllers/whatsapp/insertToSheet.js'
import verifyWebhook from '../controllers/whatsapp/verifyWebhook.js'
import dotenv from 'dotenv'

dotenv.config()

const router = express.Router()

router.post('/webhook', insertToSheet)
router.get('/webhook', verifyWebhook)

export default router