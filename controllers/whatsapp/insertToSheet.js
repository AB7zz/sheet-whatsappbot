import dotenv from 'dotenv'
dotenv.config()
import doc from '../../config/index.js';
import axios from 'axios'

async function insertToSheet(req, res) {
  try{
    let body = req.body;
    const token = process.env.WHATSAPP_TOKEN
    console.log(JSON.stringify(req.body, null, 2));
    if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let phone_number_id =
        req.body.entry[0].changes[0].value.metadata.phone_number_id;
      console.log(phone_number_id);
      let from = req.body.entry[0].changes[0].value.messages[0].from;
      let msg = req.body.entry[0].changes[0].value.messages[0].text.body;
      axios({
        method: "POST",
        url:
          "https://graph.facebook.com/v12.0/" +
          phone_number_id +
          "/messages?access_token=" +
          token,
        data: {
          messaging_product: "whatsapp",
          to: from,
          text: { body: "Inserted " + msg + " into google sheets successfully!" },
        },
        headers: { "Content-Type": "application/json" },
      });
      const sheet = doc.sheetsByTitle['Sheet1'];
      await sheet.addRow({ msg });
      res.send('Successfully added to sheet')
    }
    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
    } catch (err) {
      throw err;
    }
}

export default insertToSheet