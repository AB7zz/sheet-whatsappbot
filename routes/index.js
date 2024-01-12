import express from 'express'
import whatsappRoutes from './whatsapp.js'

const router = express.Router()

router.get('/', (req, res) => {
    res.send('Hello World')
})


export default [router, whatsappRoutes]