const BITRIX_WEBHOOK = process.env.BITRIX_WEBHOOK;
const ENTITY_TYPE_ID = process.env.ENTITY_TYPE_ID || '1056';

async function bitrix(method, params = {}) {
  const url = new URL(`${BITRIX_WEBHOOK}${method}`);
  Object.entries(params).forEach(([key, val]) => {
    if (typeof val === 'object') {
      Object.entries(val).forEach(([k, v]) => url.searchParams.append(`${key}[${k}]`, v));
    } else {
      url.searchParams.append(key, val);
    }
  });
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(data.error_description || data.error);
  return data.result;
}

async function findContactByPhone(phone) {
  const clean = phone.replace(/\D/g, '');
  const result = await bitrix('crm.contact.list', {
    filter: { PHONE: clean },
    select: { 0: 'ID', 1: 'NAME', 2: 'LAST_NAME', 3: 'ASSIGNED_BY_ID', 4: 'PHONE' }
  });
  return result && result.length > 0 ? result[0] : null;
}

async function getClientContract(contactId) {
  const result = await bitrix('crm.item.list', {
    entityTypeId: ENTITY_TYPE_ID,
    filter: { contactId: contactId },
    select: {
      0: 'id',
      1: 'title',
      2: 'stageId',
      3: 'assignedById',
      4: 'opportunity',
      5: 'contactId',
      6: 'ufCrm27_1737565677',
      7: 'ufCrm27_1738072409978',
      8: 'ufCrm27_1741203323403',
      9: 'ufCrm27_1737566164',
      10: 'ufCrm27_1737566173',
      11: 'ufCrm27_1737566180'
    },
    limit: 1
  });
  return result && result.items && result.items.length > 0 ? result.items[0] : null;
}

function parseAddress(item) {
  const city = item.ufCrm27_1737566164 || '';
  const street = item.ufCrm27_1737566173 || '';
  const house = item.ufCrm27_1737566180 || '';
  if (city || street || house) {
    return [city, street, house].filter(Boolean).join(', ');
  }
  const raw = item.ufCrm27_1737565677 || item.title || '';
  return raw.split('|')[0].trim();
}

async function getManager(userId) {
  if (!userId) return null;
  const result = await bitrix('user.get', { ID: userId });
  return result && result.length > 0 ? result[0] : null;
}

async function createRepairDeal(data) {
  return await bitrix('crm.deal.add', {
    fields: {
      TITLE: `Ремонт: ${data.type} — ${data.address}`,
      CATEGORY_ID: process.env.REPAIR_CATEGORY_ID || '0',
      COMMENTS: `Тип: ${data.type}\nОписание: ${data.description}\nУдобное время: ${data.time}\nКлиент: ${data.clientName}\nТелефон: ${data.phone}`,
      CONTACT_ID: data.contactId,
      SOURCE_ID: 'WEB'
    }
  });
}

async function createExtendRequest(data) {
  return await bitrix('crm.deal.add', {
    fields: {
      TITLE: `Продление договора — ${data.clientName}`,
      CATEGORY_ID: process.env.EXTEND_CATEGORY_ID || '0',
      COMMENTS: `Запрос продления на ${data.months} мес.\nКомментарий: ${data.comment || 'нет'}`,
      CONTACT_ID: data.contactId,
      SOURCE_ID: 'WEB'
    }
  });
}

const otpStore = new Map();

function generateOTP(phone) {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  otpStore.set(phone, { code, expires: Date.now() + 5 * 60 * 1000 });
  return code;
}

function verifyOTP(phone, code) {
  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expires) { otpStore.delete(phone); return false; }
  if (entry.code !== code) return false;
  otpStore.delete(phone);
  return true;
}

async function sendSMS(phone, code) {
  const provider = process.env.SMS_PROVIDER;
  if (provider === 'exolve') {
    await fetch('https://api.exolve.ru/messaging/v1/SendSMS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SMS_API_KEY}`
      },
      body: JSON.stringify({
        number: process.env.SMS_FROM,
        destination: phone,
        text: `Ваш код входа: ${code}`
      })
    });
  } else {
    console.log(`[SMS TEST MODE] Телефон: ${phone} | Код: ${code}`);
  }
}

module.exports = {
  bitrix,
  findContactByPhone,
  getClientContract,
  getManager,
  parseAddress,
  createRepairDeal,
  createExtendRequest,
  generateOTP,
  verifyOTP,
  sendSMS
};
