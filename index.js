const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// Render Environment Variables-ல் இருந்து ரகசியச் சாவிகளை எடுக்கிறோம்
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const token = process.env.TELEGRAM_TOKEN;

// Firebase-ஐ சர்வர் முறையில் இணைக்கிறோம்
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// பாட்-ஐ உருவாக்குகிறோம்
const bot = new TelegramBot(token, {polling: true});

bot.onText(/\/start|hi|otp/i, async (msg) => {
  const chatId = msg.chat.id;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Telegram ID-ஐ வைத்து யூசரைத் தேடுகிறோம்
  const q = await db.collection('sellers').where('telegramId', '==', chatId).get();

  if (!q.empty) {
    await q.docs[0].ref.update({
      resetCode: otp,
      resetExpires: Date.now() + (5 * 60 * 1000) // 5 நிமிடம்
    });
    bot.sendMessage(chatId, `உங்களுடைய OTP: ${otp}. இதை வெப்சைட்டில் உள்ளீடு செய்யவும்.`);
  } else {
    bot.sendMessage(chatId, "முதலில் உங்கள் அக்கவுண்ட்டை டெலிகிராம் உடன் இணையுங்கள்.");
  }
});

console.log("NammaID Bot is running successfully...");

// Render-ன் Port எர்ரரைச் சரி செய்ய ஒரு சின்ன சர்வர்
const http = require('http');
http.createServer((req, res) => {
  res.write("Bot is Alive!");
  res.end();
}).listen(process.env.PORT || 3000);

