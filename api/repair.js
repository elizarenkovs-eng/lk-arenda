const { createRepairDeal } = require('./_bitrix');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { contactId, clientName, phone, address, type, description, time } = req.body;
    if (!contactId || !type || !description) {
      return res.status(400).json({ error: 'Не все поля заполнены' });
    }

    const deal = await createRepairDeal({ contactId, clientName, phone, address, type, description, time });
    res.json({ success: true, dealId: deal });
  } catch (err) {
    console.error('repair error:', err);
    res.status(500).json({ error: 'Ошибка создания заявки: ' + err.message });
  }
};
