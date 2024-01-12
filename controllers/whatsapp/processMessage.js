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

let step1 = [], step2 = [], step3 = [], step4 = [], step5 = [], upiID, schoolName, studentName, academicYear, admissionNo
let msg

async function insertToSheet(upiId, schoolName, studentName, academicYear, admissionNo){
  const sheet = doc.sheetsByTitle['Sheet2'];
  await sheet.addRow({ UPI_ID: upiId, School_Name: schoolName, Student_Name: studentName, Academic_Year: academicYear, Admission_No: admissionNo });
}

function replyMessage(msg, from, token, phone_number_id, buttons) {
  if((!step1[from.replace(/\s/g, '')]) || (step1[from.replace(/\s/g, '')] && step2[from.replace(/\s/g, '')] && !step3[from.replace(/\s/g, '')])){
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

async function downloadImg(from, imgURL){
  try{
    console.log('------DOWNLAODING IMAGE------')
    const directory = `assets/${from.replace(/\s/g, '')}`;
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    const response = await axios.get(imgURL, {
      headers: {
        'Authorization': `Bearer ${process.env.GRAPH_API_TOKEN}`
      },
      responseType: 'stream'
    });
  
    await new Promise((resolve, reject) => {
      response.data.pipe(fs.createWriteStream(`${directory}/UPIID.png`))
        .on('finish', resolve)
        .on('error', reject);
    });
  }catch(err){
    console.log('Could not download image')
  }
}


async function extractTextFromImage(from){
  try {
    console.log('------EXTARCTING TEXT FROM IMAGE------')
    const form = new FormData()
    let img
    let filepath = path.join(process.cwd(),`assets/${from.replace(/\s/g, '')}/UPIID.png`);
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
    const regex = /UPI transaction ID: (\d+)/;
    const match = regex.exec(sentence);
    const upiTransactionId = match ? match[1] : null;
    return upiTransactionId
  } catch (error) {
    console.log(error)
    return 'Some error occurred!'
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
        
        // If the message is neither a message nor a button reply, then it is an image. So I'm doing the following
        /*
        1. Get the image id from the message
        2. Get the image url from the image id
        3. Download the image into assets/{mobile}/UPIID.png
        4. Extract the text from the image using a API
        */
        if(!msg || msg.length == 0){
          msg = req.body.entry[0].changes[0].value.messages[0]?.image.id
          if(!msg || msg.length == 0){
            replyMessage("Please enter a message", from, token, phone_number_id, [])
            res.send('No message found')
          }
          const imgURL = await getURL(msg)
          await downloadImg(from, imgURL)
          msg = await extractTextFromImage(from)
          if(!msg || msg.length == 0){
            replyMessage("Some error occurred. Please type in the UPI ID", from, token, phone_number_id, [])
            res.send('No message found')
          }
        }


        // If this is the first message of the user, then its the UPI ID
        if(!step1[from.replace(/\s/g, '')]){
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
          step1[from.replace(/\s/g, '')] = 1
        }
        // If this is the 2nd message from the user, then its the school name
        else if (step1[from.replace(/\s/g, '')] == 1 && !step2[from.replace(/\s/g, '')]){
          schoolName = msg
          replyMessage("Please enter your name", from, token, phone_number_id, [])
          step2[from.replace(/\s/g, '')] = 1
        }
        // If this is the 3rd message from the user, then its the student name
        else if(step2[from.replace(/\s/g, '')] == 1 && !step3[from.replace(/\s/g, '')]){
          studentName = msg
          const buttons = [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "2024-25",
              }
            }
          ]
          replyMessage("Please choose your academic year", from, token, phone_number_id, buttons)
          step3[from.replace(/\s/g, '')] = 1
        }
        // If this is the 4th message from the user, then its the academic year
        else if(step3[from.replace(/\s/g, '')] == 1 && !step4[from.replace(/\s/g, '')]){
          academicYear = msg
          replyMessage("Please give your admission no.", from, token, phone_number_id, [])
          step4[from.replace(/\s/g, '')] = 1
        }
        // If this is the 5th message from the user, then its the admission no.
        else if(step4[from.replace(/\s/g, '')] == 1 && !step5[from.replace(/\s/g, '')]){
          admissionNo = msg
          replyMessage("Thank you, we are processing the order immediately...", from, token, phone_number_id, [])
          step5[from.replace(/\s/g, '')] = 1
        }
        
        if(step1[from.replace(/\s/g, '')] == 1 && step2[from.replace(/\s/g, '')] == 1 && step3[from.replace(/\s/g, '')] == 1 && step4[from.replace(/\s/g, '')] == 1 && step5[from.replace(/\s/g, '')] == 1){
          insertToSheet(upiID, schoolName, studentName, academicYear, admissionNo)
  
          // Resetting all steps back to 0
          step1[from.replace(/\s/g, '')] = 0
          step2[from.replace(/\s/g, '')] = 0
          step3[from.replace(/\s/g, '')] = 0
          step4[from.replace(/\s/g, '')] = 0
          step5[from.replace(/\s/g, '')] = 0
        }
        
        res.send('Successfully added to sheet')
      }else{
        res.sendStatus(404)
      }
    } else {
      res.sendStatus(404);
    }
  } catch (err) {
    throw err;
  }
}

export default processMessage