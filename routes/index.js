import express from 'express'
import sheetRoutes from './sheet.js'

const router = express.Router()

router.get('/', (req, res) => {
    res.send('Hello World')
})


export default [sheetRoutes, router]