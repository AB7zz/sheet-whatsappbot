import express from 'express'
import sheetRoutes from './sheet.js'
import whatsappRoutes from './whatsapp.js'

const router = express.Router()

router.get('/', (req, res) => {
    res.send('Hello World')
})


export default [sheetRoutes, router, whatsappRoutes]