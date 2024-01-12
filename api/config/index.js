import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv'
dotenv.config()
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

export default doc
