const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

const token = process.env.TELEGRAM_TOKEN;

const bot = new TelegramBot(token, { polling: true });

admin.initializeApp({
 credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN))
});

const db = admin.firestore();

app.get("/", (req,res)=>{
 res.send("NammaID Telegram Bot Running");
});


// START COMMAND
bot.onText(/\/start/i, (msg)=>{

 const opts = {
  reply_markup:{
   one_time_keyboard:true,
   keyboard:[[
    {
     text:"Share Contact",
     request_contact:true
    }
   ]]
  }
 };

 bot.sendMessage(
  msg.chat.id,
  "Please share your mobile number to verify your NammaID account.",
  opts
 );

});


// CONTACT RECEIVED
bot.on("contact", async (msg)=>{

 const chatId = msg.chat.id;

 const sharedPhone =
 "+" + msg.contact.phone_number.replace(/\D/g,"");

 try{

  const sellerRef = db.collection("sellers").doc(sharedPhone);

  const snap = await sellerRef.get();

  if(!snap.exists){

   return bot.sendMessage(
    chatId,
    "❌ This number is not registered in NammaID."
   );

  }

  await sellerRef.update({

   telegramId: chatId,
   resetVerified: true

  });

  bot.sendMessage(
   chatId,
   "✅ Phone verified. Return to the website."
  );

 }catch(err){

  console.log(err);

 }

});

app.listen(3000, ()=>{
 console.log("Bot running...");
});