import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv'
dotenv.config()
async function insertToSheet(req, res) {
    try{
        console.log(req.body)
        res.send('lol')
    } catch (err) {
      throw err;
    }
}

export default insertToSheet