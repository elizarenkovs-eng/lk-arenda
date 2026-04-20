const { generateOTP, sendSMS } = require('./_bitrix');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Телефон обязателен' });

    const clean = phone.replace(/\D/g, '');
    if (clean.length < 10) return res.status(400).json({ error: 'Неверный формат телефона' });

    const code = generateOTP(clean);
    await sendSMS(clean, code);

    res.json({ success: true, message: 'Код отправлен' });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ error: 'Ошибка отправки SMS' });
  }
};
