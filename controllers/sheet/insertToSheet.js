import doc from '../../config/index.js';
async function insertToSheet(req, res) {
    try{
        const sheet = doc.sheetsByTitle['Sheet1'];
        const email = req.body.email
        const name = req.body.name
        await sheet.addRow({ name, email });
        res.send('Successfully added to sheet')
    } catch (err) {
      throw err;
    }
}

export default insertToSheet