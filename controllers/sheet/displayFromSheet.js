import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv'
dotenv.config()
async function displayFromSheet(req, res) {
    try{
        const { privateKey } = JSON.parse(process.env.PRIVATE_KEY)
        const serviceAccountAuth = new JWT({
            email: process.env.CLIENT_EMAIL,
            key: privateKey,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
            ],
        });
        
        const doc = new GoogleSpreadsheet('1JmWEBocYEGNxCRgGlLyUKZ3l1FYoE6wVFtk0y1BJLr0', serviceAccountAuth);
        
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['Sheet1'];
        const rows = await sheet.getRows();
        console.log('Email', 'Name', 'Phone')
        console.log('------------------------------')
        const data = []
        for(let i=0; i<rows.length; i++){
            const subData = {
                email: rows[i].get('email'),
                name: rows[i].get('name'),
            }
            data.push(subData)
            console.log(rows[i].get('email'), rows[i].get('name'))
        }
        console.log(data)
        res.send(data)
    } catch (err) {
      throw err;
    }
}

export default displayFromSheet