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

bot.onText(/(\d{6})/, async (msg, match) => {
  const chatId = msg.chat.id;
  const receivedCode = match[1].trim();

  try {
    // Firestore-ல் அந்த கோட் இருக்கிறதா என்று தேடுகிறோம்
    const q = await db.collection('sellers').where('resetCode', '==', receivedCode).get();

    if (!q.empty) {
      const doc = q.docs[0];
      const data = doc.data();

      // கோட் இன்னும் காலாவதி ஆகவில்லையென்றால்
      if (Date.now() < data.resetExpires) {
        await doc.ref.update({
          resetVerified: true,
          telegramId: chatId
        });
        bot.sendMessage(chatId, "வெரிஃபிகேஷன் முடிந்தது! ✅ இப்போ வெப்சைட்டுக்குச் சென்று புது PIN செட் பண்ணுங்க.");
      } else {
        bot.sendMessage(chatId, "மன்னிக்கவும், இந்த கோட் எக்ஸ்பயர் ஆகிடுச்சு! ❌");
      }
    } else {
      bot.sendMessage(chatId, "தவறான கோட். சரியான கோடை அனுப்பவும்! ⚠️");
    }
  } catch (err) {
    console.error("Error:", err);
    bot.sendMessage(chatId, "சிறு பிழை ஏற்பட்டுள்ளது. மீண்டும் முயலவும்.");
  }
});

console.log("NammaID Bot is running successfully...");
