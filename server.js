const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const admin = require("firebase-admin");

const app = express();
app.use(express.json());

const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Firebase இணைக்கிறோம்
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN))
});
const db = admin.firestore();

app.get("/", (req, res) => {
  res.send("NammaID Telegram Bot is Running Successfully! 🚀");
});

// 1. /START COMMAND - பயனர் வரும்போது பட்டனைக்காட்ட
bot.onText(/\/start/i, (msg) => {
  const opts = {
    reply_markup: {
      one_time_keyboard: true,
      resize_keyboard: true,
      keyboard: [[{
        text: "எனது மொபைல் எண்ணெய் உறுதி செய்கிறேன் (Share Contact)",
        request_contact: true
      }]]
    }
  };

  bot.sendMessage(
    msg.chat.id,
    "வணக்கம்! உங்கள் NammaID கணக்கை உறுதிப்படுத்த, கீழே உள்ள பட்டனை அழுத்தி உங்கள் மொபைல் எண்ணைப் பகிரவும்.",
    opts
  );
});

// 2. CONTACT RECEIVED - பயனர் பட்டனை அழுத்தியவுடன்
bot.on("contact", async (msg) => {
  const chatId = msg.chat.id;
  // மொபைல் எண்ணை சர்வதேச வடிவில் (+91...) மாற்றுகிறோம்
  let sharedPhone = msg.contact.phone_number;
  if (!sharedPhone.startsWith('+')) {
    sharedPhone = "+" + sharedPhone;
  }

  try {
    // Firestore-ல் இந்த போன் நம்பர் டாக்குமெண்ட் இருக்கிறதா எனப் பார்க்கிறோம்
    const sellerRef = db.collection("sellers").doc(sharedPhone);
    const snap = await sellerRef.get();

    if (!snap.exists) {
      return bot.sendMessage(
        chatId,
        `❌ மன்னிக்கவும், ${sharedPhone} என்ற எண் நமது சிஸ்டத்தில் ரிஜிஸ்டர் செய்யப்படவில்லை.`
      );
    }

    // வெரிஃபிகேஷன் வெற்றி! டேட்டாபேஸை அப்டேட் செய்கிறோம்
    await sellerRef.update({
      telegramId: chatId,
      resetVerified: true,
      verified: true // பிற்கால தேவைக்காக
    });

    bot.sendMessage(
      chatId,
      "✅ உங்கள் மொபைல் எண் வெற்றிகரமாக உறுதி செய்யப்பட்டது! இப்போது நீங்கள் வெப்சைட்டுக்குத் திரும்பிச் சென்று புது PIN செட் செய்யலாம்."
    );

  } catch (err) {
    console.error("Firestore Update Error:", err);
    bot.sendMessage(chatId, "⚠️ ஒரு சிறு பிழை ஏற்பட்டுள்ளது. மீண்டும் முயலவும்.");
  }
});

// Render-க்கான போர்ட் செட்டிங்
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`NammaID Bot is running on port ${PORT}`);
});
