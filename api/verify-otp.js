const { findContactByPhone, getClientContract, getManager } = require('./_bitrix');
const { parseAddress } = require('./_bitrix');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { phone, code, expectedCode } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Телефон и код обязательны' });
    if (code !== expectedCode) return res.status(401).json({ error: 'Неверный код' });

    const clean = phone.replace(/\D/g, '');

    const contact = await findContactByPhone(clean);
    if (!contact) {
      return res.status(404).json({ error: 'Клиент не найден в системе. Обратитесь к менеджеру.' });
    }

    const contract = await getClientContract(contact.ID);
    const manager = contract ? await getManager(contract.assignedById || contact.ASSIGNED_BY_ID) : null;

    const contractEnd = contract?.ufCrm27_1741203323403;
    const contractStart = contract?.ufCrm27_1738072409978;
    const rentAmount = contract?.opportunity;

    let daysLeft = null;
    if (contractEnd) {
      const diff = new Date(contractEnd) - new Date();
      daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    const address = contract ? parseAddress(contract) : null;

    res.json({
      success: true,
      client: {
        id: contact.ID,
        name: [contact.NAME, contact.LAST_NAME].filter(Boolean).join(' '),
        phone: clean
      },
      contract: contract ? {
        id: contract.id,
        title: contract.title,
        address,
        startDate: contractStart ? new Date(contractStart).toLocaleDateString('ru-RU') : null,
        endDate: contractEnd ? new Date(contractEnd).toLocaleDateString('ru-RU') : null,
        daysLeft,
        amount: rentAmount ? Number(rentAmount).toLocaleString('ru-RU') : null
      } : null,
      manager: manager ? {
        name: [manager.NAME, manager.LAST_NAME].filter(Boolean).join(' '),
        phone: manager.PERSONAL_MOBILE || manager.WORK_PHONE || null
      } : null
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    res.status(500).json({ error: 'Ошибка сервера: ' + err.message });
  }
};
