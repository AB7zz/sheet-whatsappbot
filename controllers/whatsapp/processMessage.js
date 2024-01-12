import dotenv from 'dotenv'
import doc from '../../config/index.js';
import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'
import path from 'path'
import e from 'express';

let img_dir = path.join(process.cwd(), 'assets/');

if (!fs.existsSync(img_dir))
  fs.mkdirSync(img_dir);


dotenv.config()

let step = {}, upiID, schoolName, studentName, academicYear, admissionNo
let msg

async function insertToSheet(upiId, schoolName, studentName, academicYear, admissionNo){
  const sheet = doc.sheetsByTitle['Sheet2'];
  await sheet.addRow({ UPI_ID: upiId, School_Name: schoolName, Student_Name: studentName, Academic_Year: academicYear, Admission_No: admissionNo });
}

function replyMessage(msg, from, token, phone_number_id, content) {
  if ((step[from.replace(/\s/g, '')] == 0 || !step[from.replace(/\s/g, '')]) && content && content.length > 0){
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
          type: "list",
          header: {
            type: "text",
            text: msg
          },
          body: {
            text: "Please select your school"
          },
          action: {
            button: "SELECT",
            sections: content
          }
        }
      },
      headers: { "Content-Type": "application/json" },
    });
  }else if(step[from.replace(/\s/g, '')] != 0 && content && content.length > 0){
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
            buttons: content
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
    let sentence = textReq.data.map(item => item.text).join(' ')

    //there are 2 types of screenshots a user can take. Im using regex to extract the UPI ID for both cases.

    // Case 1
    let regex = /UPI transaction ID: (\d+)/;
    let match = regex.exec(sentence);
    let upiTransactionId = match ? match[1] : null;

    // Case 2
    if(upiTransactionId == null){
      regex = /UPI transaction ID (\d+)/;

      match = regex.exec(sentence);
      
      upiTransactionId = match ? match[1] : null;
    }
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
        // console.log(req.body.entry[0].changes[0].value.messages[0].interactive.list_reply || '')
        msg = req.body.entry[0].changes[0].value.messages[0]?.text?.body || req.body.entry[0].changes[0].value.messages[0]?.interactive?.button_reply?.title || req.body.entry[0].changes[0].value.messages[0]?.interactive?.list_reply.title
        
        // If the message is neither a message nor a button reply, then it is an image. So I'm doing the following
        /*
        1. Get the image id from the message
        2. Get the image url from the image id
        3. Download the image into assets/{mobile}/UPIID.png
        4. Extract the text from the image using a API
        */
        if(msg && (!step[from.replace(/\s/g, '')] || step[from.replace(/\s/g, '')] == 0) && msg.length != 12){
          replyMessage("Please enter a valid UPI Transaction ID", from, token, phone_number_id, [])
          return res.send('Invalid UPI Transaction ID entered')
        }
        if(!msg || msg.length == 0){
          msg = req.body.entry[0].changes[0].value.messages[0]?.image.id
          if(!msg || msg.length == 0){
            replyMessage("Please enter a message", from, token, phone_number_id, [])
            return res.send('No message found')
          }
          const imgURL = await getURL(msg)
          await downloadImg(from, imgURL)
          msg = await extractTextFromImage(from)
          if(!msg || msg.length == 0){
            replyMessage("Some error occurred. Please type in the UPI Transaction ID", from, token, phone_number_id, [])
            return res.send('Unable to extract Transaction ID from Screenshot')
          }
          const regex = /[a-zA-Z]/
          if(msg.length != 12 || regex.test(msg)){
            replyMessage("Please send a valid screenshot of UPI Transaction", from, token, phone_number_id, [])
            return res.send('Invalid UPI Transaction ID Screenshot')
          }
          step[from.replace(/\s/g, '')] = 0
        }

        // I'm doing -2 because of the way I coded the logic for this. It actually just goes to the previous step. I hope it's not confusing
        if(msg === "Go Back"){
          step[from.replace(/\s/g, '')] -= 2
        }


        if(!step[from.replace(/\s/g, '')] || step[from.replace(/\s/g, '')] == 0){
          if (msg !== "Go Back") upiID = msg
          const sections = [
            {
              title:"Title",
              rows: [
                {
                  id:"1",
                  title: "School A",        
                },
                {
                  id:"2",
                  title: "School B",        
                },
                {
                  id:"3",
                  title: "School C",        
                },
                {
                  id:"4",
                  title: "School D",        
                }
              ]
            }
          ]
          replyMessage("Please select your school", from, token, phone_number_id, sections)
          step[from.replace(/\s/g, '')] = 1
        }
        // If this is the 2nd message from the user, then its the school name
        else if (step[from.replace(/\s/g, '')] == 1){
          if (msg !== "Go Back") schoolName = msg
          const buttons = [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "Go Back",
              }
            }
          ]
          replyMessage("Please enter your name", from, token, phone_number_id, buttons)
          step[from.replace(/\s/g, '')] = 2
        }
        
        // If this is the 3rd message from the user, then its the student name
        else if(step[from.replace(/\s/g, '')] == 2){
          if (msg !== "Go Back") studentName = msg
          const buttons = [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "2024-25",
              }
            },
            {
              type: "reply",
              reply: {
                id: "2",
                title: "Go Back",
              }
            }
          ]
          replyMessage("Please choose your academic year", from, token, phone_number_id, buttons)
          step[from.replace(/\s/g, '')] = 3
        }
        // If this is the 4th message from the user, then its the academic year
        else if(step[from.replace(/\s/g, '')] == 3){
          if (msg !== "Go Back") academicYear = msg
          const buttons = [
            {
              type: "reply",
              reply: {
                id: "1",
                title: "Go Back",
              }
            }
          ]
          replyMessage("Please give your admission no.", from, token, phone_number_id, buttons)
          step[from.replace(/\s/g, '')] = 4
        }
        // If this is the 5th message from the user, then its the admission no.
        else if(step[from.replace(/\s/g, '')] == 4){
          if (msg !== "Go Back") admissionNo = msg
          const buttons = []
          replyMessage("Thank you, we are processing the order immediately...", from, token, phone_number_id, buttons)
          step[from.replace(/\s/g, '')] = 5
        }
        
        if(step[from.replace(/\s/g, '')] == 5){
          insertToSheet(upiID, schoolName, studentName, academicYear, admissionNo)
  
          // Resetting all step back to 0
          step[from.replace(/\s/g, '')] = 0
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