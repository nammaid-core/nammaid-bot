const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const admin = require("firebase-admin");
const app = express();
app.use(express.json());
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true, request: { family: 4 } });
// Firebase இணைக்கிறோம்
admin.initializeApp({
credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_ADMIN))
});
const db = admin.firestore();
app.get("/", (req, res) => {
res.send("NammaID Telegram Bot is Running Successfully! 🚀");
});
// 1. /START COMMAND - பயனர் வரும்போது பட்டனைக்காட்ட
bot.onText(//start/i, (msg) => {
const opts = {
reply_markup: {
one_time_keyboard: true,
resize_keyboard: true,
keyboard: [[{
text: "எனது மொபைல் எண்ணைப் பகிரவும் (Share Contact)",
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
if (msg.contact.user_id !== msg.from.id) {
return bot.sendMessage(chatId,"⚠️ தயவு செய்து உங்கள் சொந்த எண்ணை மட்டும் பகிரவும்.");
}
let sharedPhone = msg.contact.phone_number.replace(/\D/g,"");
if (sharedPhone.length === 10) {
sharedPhone = "+91" + sharedPhone;
} else if (sharedPhone.startsWith("91") && sharedPhone.length === 12) {
sharedPhone = "+" + sharedPhone;
} else {
sharedPhone = "+" + sharedPhone;
}
console.log("Raw phone:", msg.contact.phone_number);
console.log("Normalized phone:", sharedPhone);
try {
const sellerRef = db.collection("sellers").doc(sharedPhone);
const snap = await sellerRef.get();
if (!snap.exists) {
return bot.sendMessage(
chatId,
❌ ${sharedPhone} இந்த எண் நமது சிஸ்டத்தில் இல்லை.
);
}
await sellerRef.update({
telegramId: chatId,
resetVerified: true,
verified: true
});
bot.sendMessage(
chatId,
"✅ உங்கள் மொபைல் எண் உறுதி செய்யப்பட்டது! இப்போது வெப்சைட்டுக்கு திரும்புங்கள்."
);
} catch (err) {
console.error("Firestore Update Error:", err);
bot.sendMessage(chatId,"⚠️ ஒரு பிழை ஏற்பட்டுள்ளது. மீண்டும் முயற்சிக்கவும்.");
}
});
// Render-க்கான போர்ட் செட்டிங்
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
console.log(NammaID Bot is running on port ${PORT});
});
