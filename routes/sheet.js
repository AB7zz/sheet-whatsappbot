import express from 'express';
import insertToSheet from '../controllers/sheet/insertToSheet.js'
import displayFromSheet from '../controllers/sheet/displayFromSheet.js'


const router = express.Router()

router.post('/sheet', insertToSheet)
router.get('/sheet', displayFromSheet)

export default router