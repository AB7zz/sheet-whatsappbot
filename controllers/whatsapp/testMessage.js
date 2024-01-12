import dotenv from 'dotenv'
import doc from '../../config/index.js';
import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'
import path from 'path'

let img_dir = path.join(process.cwd(), 'assets/');

if (!fs.existsSync(img_dir))
    fs.mkdirSync(img_dir);

dotenv.config()

let btnReply = 0

async function insertToSheet(msg){
  const sheet = doc.sheetsByTitle['Sheet1'];
  await sheet.addRow({ msg });
}

function replyMessage(msg, from, token, phone_number_id) {
  if(btnReply){
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
  }else{
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
        text:{
          body: msg
        }
      },
      headers: { "Content-Type": "application/json" },
    });

  }
}

function generateReply(msg){
  let reply = "Sorry! I didn't get that. Please try again."
  if(msg.toLowerCase().includes('hello') || msg.toLowerCase().includes('hi')){
    reply = "Hello! Choose any one of the following options to proceed further."
    btnReply = 1
  }else if(msg == 'Analyze message'){
    reply = 'Okay! Please send the message you want to analyze.'
    btnReply = 0
  }else if(msg == 'Analyze image'){
    reply = 'Okay! Please send the image you want to analyze.'
    btnReply = 0
  }
  return reply
}

async function testMessage(req, res) {
  try{
    console.log('triggered')
    const form = new FormData()
    let img
    let filepath = path.join(process.cwd(),'assets/test.png');
    fs.readFile('assets/test.png', (data) => {
      img = data
    })
    form.append('image', fs.readFileSync(filepath));
    const textReq = await axios.post('https://api.api-ninjas.com/v1/imagetotext', form, {
      headers: {
        'X-Api-Key': process.env.IMAGE_TO_TEXT_API_KEY,
      }
    })
    const sentence = textReq.data.map(item => item.text).join(' ')
    console.log(sentence)
    res.send('lol')
  } catch (err) {
    throw err;
  }
}

export default testMessage