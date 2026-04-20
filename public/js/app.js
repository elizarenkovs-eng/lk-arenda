const API = '';

let clientData = null;

async function post(endpoint, body) {
  const res = await fetch(`${API}/api/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = 'block';
}
function hideError(id) {
  document.getElementById(id).style.display = 'none';
}
function setLoading(btnTextId, btnId, loading, text, loadingText = 'Загрузка...') {
  const btn = document.getElementById(btnId) || document.querySelector(`#${btnTextId}`).closest('button');
  const span = document.getElementById(btnTextId);
  if (loading) {
    span.textContent = loadingText;
    btn.disabled = true;
  } else {
    span.textContent = text;
    btn.disabled = false;
  }
}

async function sendOTP() {
  hideError('login-error');
  const phone = document.getElementById('phone-input').value.trim();
  if (!phone) { showError('login-error', 'Введите номер телефона'); return; }

  setLoading('send-btn-text', null, true, 'Получить код', 'Отправляем...');
  document.querySelector('#step-phone .btn-primary').disabled = true;

  try {
    await post('send-otp', { phone });
    document.getElementById('phone-display').textContent = phone;
    document.getElementById('step-phone').style.display = 'none';
    document.getElementById('step-sms').style.display = 'block';
    setTimeout(() => document.getElementById('sms-input').focus(), 100);
  } catch (err) {
    showError('login-error', err.message);
  } finally {
    document.getElementById('send-btn-text').textContent = 'Получить код';
    document.querySelector('#step-phone .btn-primary').disabled = false;
  }
}

async function verifyOTP() {
  hideError('sms-error');
  const phone = document.getElementById('phone-input').value.trim();
  const code = document.getElementById('sms-input').value.trim();
  if (!code || code.length < 4) { showError('sms-error', 'Введите 4-значный код'); return; }

  document.getElementById('verify-btn-text').textContent = 'Входим...';
  document.querySelector('#step-sms .btn-primary').disabled = true;

  try {
    const data = await post('verify-otp', { phone, code });
    clientData = data;
    renderDashboard(data);
    document.getElementById('screen-login').classList.remove('active');
    document.getElementById('screen-dashboard').classList.add('active');
  } catch (err) {
    showError('sms-error', err.message);
  } finally {
    document.getElementById('verify-btn-text').textContent = 'Войти';
    document.querySelector('#step-sms .btn-primary').disabled = false;
  }
}

function resendCode() {
  document.getElementById('sms-input').value = '';
  hideError('sms-error');
  sendOTP();
}

function renderDashboard(data) {
  const { client, contract, manager } = data;

  document.getElementById('client-name').textContent =
    `Добрый день, ${client.name.split(' ')[0]}`;

  if (contract) {
    document.getElementById('client-address').textContent = contract.address || '';
    document.getElementById('contract-start').textContent = contract.startDate || '—';
    document.getElementById('contract-end').textContent = contract.endDate || '—';
    document.getElementById('days-left').textContent = contract.daysLeft ?? '—';
    document.getElementById('contract-amount').textContent =
      contract.amount ? `${contract.amount} ₽` : '—';

    document.getElementById('extend-end-date').textContent = contract.endDate || '—';
    document.getElementById('extend-amount').textContent =
      contract.amount ? `${contract.amount} ₽` : '—';

    const days = contract.daysLeft ?? 999;
    const badge = document.getElementById('contract-badge');
    if (days < 0) {
      badge.textContent = 'Истёк'; badge.className = 'badge badge-danger';
    } else if (days < 30) {
      badge.textContent = 'Скоро истекает'; badge.className = 'badge badge-warn';
    } else {
      badge.textContent = 'Активен'; badge.className = 'badge badge-ok';
    }

    const totalDays = contract.startDate && contract.endDate
      ? Math.ceil((new Date(contract.endDate) - new Date(contract.startDate)) / 86400000)
      : 365;
    const pct = totalDays > 0 ? Math.max(0, Math.min(100, Math.round((1 - days / totalDays) * 100))) : 50;
    document.getElementById('progress-fill').style.width = pct + '%';

    document.getElementById('contract-section').style.display = 'block';
    document.getElementById('no-contract-msg').style.display = 'none';
  } else {
    document.getElementById('contract-section').style.display = 'none';
    document.getElementById('no-contract-msg').style.display = 'block';
  }

  if (manager) {
    document.getElementById('manager-name').textContent = manager.name || 'Менеджер';
    const initials = (manager.name || 'МН').split(' ').map(w => w[0]).slice(0, 2).join('');
    document.getElementById('manager-avatar').textContent = initials;
    if (manager.phone) {
      document.getElementById('manager-phone').innerHTML =
        `<a href="tel:${manager.phone}">${manager.phone}</a>`;
    }
  } else {
    document.getElementById('manager-name').textContent = 'Не назначен';
  }
}

function logout() {
  clientData = null;
  document.getElementById('screen-dashboard').classList.remove('active');
  document.getElementById('screen-login').classList.add('active');
  document.getElementById('step-phone').style.display = 'block';
  document.getElementById('step-sms').style.display = 'none';
  document.getElementById('phone-input').value = '';
  document.getElementById('sms-input').value = '';
}

function openModal(id) {
  document.getElementById('modal-' + id).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById('modal-' + id).classList.remove('open');
  document.body.style.overflow = '';
}

async function submitRepair() {
  hideError('repair-error');
  const type = document.getElementById('repair-type').value;
  const desc = document.getElementById('repair-desc').value.trim();
  const time = document.getElementById('repair-time').value;

  if (!type) { showError('repair-error', 'Выберите категорию поломки'); return; }
  if (!desc) { showError('repair-error', 'Опишите проблему'); return; }

  const btn = document.querySelector('#modal-repair .btn-primary');
  document.getElementById('repair-btn-text').textContent = 'Отправляем...';
  btn.disabled = true;

  try {
    await post('repair', {
      contactId: clientData.client.id,
      clientName: clientData.client.name,
      phone: clientData.client.phone,
      address: clientData.contract?.address || '',
      type, description: desc, time
    });
    closeModal('repair');
    document.getElementById('repair-type').value = '';
    document.getElementById('repair-desc').value = '';
    document.getElementById('success-title').textContent = 'Заявка на ремонт отправлена';
    document.getElementById('success-sub').textContent = 'Мастер свяжется с вами для согласования времени';
    openModal('success');
  } catch (err) {
    showError('repair-error', err.message);
  } finally {
    document.getElementById('repair-btn-text').textContent = 'Отправить заявку';
    btn.disabled = false;
  }
}

async function submitExtend() {
  hideError('extend-error');
  const months = document.getElementById('extend-months').value;
  const comment = document.getElementById('extend-comment').value.trim();

  const btn = document.querySelector('#modal-extend .btn-primary');
  document.getElementById('extend-btn-text').textContent = 'Отправляем...';
  btn.disabled = true;

  try {
    await post('extend', {
      contactId: clientData.client.id,
      clientName: clientData.client.name,
      months, comment
    });
    closeModal('extend');
    document.getElementById('success-title').textContent = 'Запрос на продление отправлен';
    document.getElementById('success-sub').textContent = 'Менеджер свяжется с вами в течение 1 рабочего дня';
    openModal('success');
  } catch (err) {
    showError('extend-error', err.message);
  } finally {
    document.getElementById('extend-btn-text').textContent = 'Отправить запрос';
    btn.disabled = false;
  }
}

document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => {
    if (e.target === el) { closeModal(el.id.replace('modal-', '')); }
  });
});

document.getElementById('phone-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendOTP();
});
document.getElementById('sms-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') verifyOTP();
});
