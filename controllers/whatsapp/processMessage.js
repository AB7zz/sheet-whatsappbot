import dotenv from 'dotenv'
import doc from '../../config/index.js';
import axios from 'axios'

dotenv.config()

async function insertToSheet(msg){
  const sheet = doc.sheetsByTitle['Sheet1'];
  await sheet.addRow({ msg });
}

function replyMessage(msg, from, token, phone_number_id) {
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
      type: "location",
      location: {
        latitude: 12.009,
        longitude: 45.008,
        name: "India",
        address: "India",
      }
    },
    headers: { "Content-Type": "application/json" },
  });
}

async function processMessage(req, res) {
  try{
    const token = process.env.WHATSAPP_TOKEN
    if (req.body.object) {
      if (
        req.body.entry &&
        req.body.entry[0].changes &&
        req.body.entry[0].changes[0] &&
        req.body.entry[0].changes[0].value.messages &&
        req.body.entry[0].changes[0].value.messages[0]
      ) 
      {
        let phone_number_id =
          req.body.entry[0].changes[0].value.metadata.phone_number_id;
        let from = req.body.entry[0].changes[0].value.messages[0].from;
        let msg = req.body.entry[0].changes[0].value.messages[0].text.body;
        let reply = msg
        if(msg.toLower().includes('hello') || msg.toLower().includes('hi')){
          reply = 'Hello, how can I help you?'
        }
        replyMessage(reply, from, token, phone_number_id)
        insertToSheet(msg)
        res.send('Successfully added to sheet')
      }
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    throw err;
  }
}

export default processMessage