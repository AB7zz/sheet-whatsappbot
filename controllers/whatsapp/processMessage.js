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

let step1 = 0, step2 = 0, step3 = 0, step4 = 0, step5 = 0, upiID, studentName, admissionNo
let msg

async function insertToSheet(upiId, schoolName, studentName, academicYear, admissionNo){
  const sheet = doc.sheetsByTitle['Sheet2'];
  await sheet.addRow({ UPI_ID: upiId, School_Name: schoolName, Student_Name: studentName, Academic_Year: academicYear, Admission_No: admissionNo });
}

function replyMessage(msg, from, token, phone_number_id, buttons) {
  if((!step1) || (step1 && step2 && !step3)){
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
            buttons: buttons
          }
        }
      },
      headers: { "Content-Type": "application/json" },
    });
  }
  else{
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


async function extractTextFromImage(){
  try {
    console.log('------EXTARCTING TEXT FROM IMAGE------')
    form.append('image', fs.readFileSync(imgpath));
    const form = new FormData()
    let img
    let filepath = path.join(process.cwd(),'assets/UPIID.png');
    fs.readFile('assets/UPIID.png', (data) => {
      img = data
    })
    form.append('image', fs.readFileSync(filepath));
    const textReq = await axios.post('https://api.api-ninjas.com/v1/imagetotext', form, {
      headers: {
        'X-Api-Key': process.env.IMAGE_TO_TEXT_API_KEY,
      }
    })
    const sentence = textReq.data.map(item => item.text).join(' ')
    return sentence
  } catch (error) {
    console.log(error)
    return 'Some error occurred!'
  }
}


async function getURL(msg){
  try {
    console.log('------FETCHING IMAGE URL------')
    const urlReq = await axios.get(`https://graph.facebook.com/v18.0/${msg}`, {
        headers:{
         'Authorization': `Bearer ${process.env.GRAPH_API_TOKEN}`
        }
      })
    return urlReq.data.url
  } catch (error) {
    console.log(error)
    return 'Some error occurred!'
  }
}

async function downloadImg(imgURL){
  try{
    console.log('------DOWNLAODING IMAGE------')
    const response = await axios.get(imgURL, {
      headers: {
        'Authorization': `Bearer ${process.env.GRAPH_API_TOKEN}`
      },
      responseType: 'stream'
    });
  
    await new Promise((resolve, reject) => {
      response.data.pipe(fs.createWriteStream('assets/UPIID.png'))
        .on('finish', resolve)
        .on('error', reject);
    });
  }catch(err){
    console.log('Could not download image')
  }
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
        msg = req.body.entry[0].changes[0].value.messages[0]?.text?.body || req.body.entry[0].changes[0].value.messages[0]?.interactive?.button_reply.title
        if(!msg){
          msg = req.body.entry[0].changes[0].value.messages[0]?.image.id
          const imgURL = await getURL(msg)
          await downloadImg(imgURL)
          msg = await extractTextFromImage()
        }
        if(!step1){
          upiID = msg
          const buttons = [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "School A",
              }
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "School B",
              }
            },
            {
              type: "reply",
              reply: {
                id: "3",
                title: "School C",
              }
            }
          ]
          replyMessage("Please select your school", from, token, phone_number_id, buttons)
          step1 = 1
        }else if (!step2){
          schoolName = msg
          replyMessage("Please enter your name", from, token, phone_number_id, [])
          step2 = 1
        }else if(!step3){
          studentName = msg
          const buttons = [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "2023-24",
              }
            }
          ]
          replyMessage("Please choose your academic year", from, token, phone_number_id, buttons)
          step3 = 1
        }else if(!step4){
          academicYear = msg
          replyMessage("Please give your admission no.", from, token, phone_number_id, [])
          step4 = 1
        }
        else if(!step5){
          admissionNo = msg
          replyMessage("Thank you, we are processing the order immediately...", from, token, phone_number_id, [])
          step5 = 1
        }
        
        insertToSheet(upiID, schoolName, studentName, academicYear, admissionNo)
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