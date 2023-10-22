import doc from '../../config/index.js'
async function displayFromSheet(req, res) {
    try{
        const sheet = doc.sheetsByTitle['Sheet1'];
        const rows = await sheet.getRows();
        const data = []
        for(let i=0; i<rows.length; i++){
            const subData = {
                email: rows[i].get('email'),
                name: rows[i].get('name'),
            }
            data.push(subData)
        }
        res.send(data)
    } catch (err) {
      throw err;
    }
}

export default displayFromSheet