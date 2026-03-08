bot.onText(/(\d{6})/, async (msg, match) => {
  const chatId = msg.chat.id; // யூசரின் டெலிகிராம் ஐடி
  const code = match[1].trim();

  // டேட்டாபேஸில் இந்த கோட் எங்கே இருக்கிறது என்று தேடுகிறோம்
  const q = await db.collection('sellers').where('resetCode', '==', code).get();

  if (!q.empty) {
    const doc = q.docs[0];
    // இங்கே தான் மந்திரம் நடக்கிறது: டெலிகிராம் ஐடியை அப்டேட் செய்கிறோம்!
    await doc.ref.update({
      telegramId: chatId, 
      resetVerified: true
    });
    bot.sendMessage(chatId, "வெரிஃபிகேஷன் முடிந்தது! ✅ இனி உங்கள் டெலிகிராம் ஐடி இணைக்கப்பட்டுவிட்டது.");
  } else {
    bot.sendMessage(chatId, "தவறான கோட்! ⚠️");
  }
});
