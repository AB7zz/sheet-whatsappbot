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
      type: "interactive",
      interactive:{
        type: "button",
        body: {
          text: msg,
        },
        action: {
          buttons: [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "Analyze message",
              }
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "Analyze image",
              }
            }
          ]
        }
      }
    },
    headers: { "Content-Type": "application/json" },
  });
}

function generateReply(msg){
  let reply = "Sorry! I didn't get that. Please try again."
  if(msg.toLowerCase().includes('hello') || msg.toLowerCase().includes('hi')){
    reply = "Hello! Choose any one of the following options to proceed further."
  }else if(msg == 'Analyze message'){
    reply = 'Okay! Please send the message you want to analyze.'
  }else if(msg == 'Analyze image'){
    reply = 'Okay! Please send the image you want to analyze.'
  }
  return reply
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
        let msg = req.body.entry[0].changes[0].value.messages[0]?.text?.body;
        console.log(req.body.entry[0].changes[0].value.messages[0])
        let reply = generateReply(msg)
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