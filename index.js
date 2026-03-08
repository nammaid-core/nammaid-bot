const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

// Render environment variables
const token = process.env.TELEGRAM_TOKEN;
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN);

// Telegram bot
const bot = new TelegramBot(token);

// Firebase
admin.initializeApp({
 credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// send OTP endpoint
app.post("/sendOtp", async (req, res) => {

 const { phone, code } = req.body;

 try {

  const snap = await db.collection("sellers").doc(phone).get();

  if (!snap.exists) {
   return res.status(404).send("User not found");
  }

  const data = snap.data();

  const telegramId = data.telegramId;

  if (!telegramId) {
   return res.status(400).send("Telegram not linked");
  }

  await bot.sendMessage(
   telegramId,
   `NammaID Reset Code: ${code}`
  );

  res.send({ success: true });

 } catch (err) {

  console.log(err);
  res.status(500).send("Error");

 }

});

app.listen(3000, () => {
 console.log("Bot running...");
});