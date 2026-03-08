const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// 1. ரகசியச் சாவிகளை எடுக்கிறோம்
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const token = process.env.TELEGRAM_TOKEN;

// 2. Firebase இணைக்கிறோம்
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// 3. பாட்-ஐ உருவாக்குகிறோம் (இது மிக முக்கியம்!)
const bot = new TelegramBot(token, {polling: true});

// 4. வெரிஃபிகேஷன் லாஜிக்
bot.onText(/(\d{6})/, async (msg, match) => {
  const chatId = msg.chat.id;
  const code = match[1].trim();

  try {
    const q = await db.collection('sellers').where('resetCode', '==', code).get();

    if (!q.empty) {
      const doc = q.docs[0];
      await doc.ref.update({
        telegramId: chatId, 
        resetVerified: true
      });
      bot.sendMessage(chatId, "வெரிஃபிகேஷன் முடிந்தது! ✅ இனி உங்கள் டெலிகிராம் ஐடி இணைக்கப்பட்டுவிட்டது.");
    } else {
      bot.sendMessage(chatId, "தவறான கோட்! ⚠️");
    }
  } catch (err) {
    console.error("Error:", err);
  }
});

// Render எர்ரர் வராமல் இருக்க ஒரு சின்ன சர்வர்
const http = require('http');
http.createServer((req, res) => {
  res.write("Bot is Alive!");
  res.end();
}).listen(process.env.PORT || 3000);

console.log("NammaID Bot is running successfully...");
