const TelegramBot = require('node-telegram-bot-api');
const admin = require('firebase-admin');

// Firebase இணைப்பு
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, {polling: true});

bot.onText(/(\d{6})/, async (msg, match) => {
  const chatId = msg.chat.id;
  const receivedCode = match[1];

  const q = await db.collection('sellers').where('resetCode', '==', receivedCode).get();

  if (!q.empty) {
    const doc = q.docs[0];
    const data = doc.data();

    if (Date.now() < data.resetExpires) {
      await doc.ref.update({ resetVerified: true, telegramId: chatId });
      bot.sendMessage(chatId, "வெரிஃபிகேஷன் முடிந்தது! ✅ வெப்சைட்டுக்குச் சென்று PIN மாற்றவும்.");
    } else {
      bot.sendMessage(chatId, "கோட் காலாவதியாகிவிட்டது! ❌");
    }
  } else {
    bot.sendMessage(chatId, "தவறான கோட்! ⚠️");
  }
});

console.log("Bot is running...");

