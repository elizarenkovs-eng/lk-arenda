# Личный кабинет арендатора — инструкция по запуску

## Шаг 1 — Загрузить на GitHub

1. Зайди на github.com → New repository → назови `lk-arenda` → Create
2. Загрузи все файлы этой папки (можно через drag & drop в интерфейсе GitHub)

## Шаг 2 — Подключить к Vercel

1. Зайди на vercel.com → Sign up (через GitHub)
2. New Project → выбери репозиторий `lk-arenda`
3. Framework Preset: Other
4. Нажми Deploy

## Шаг 3 — Настроить переменные окружения

В Vercel → твой проект → Settings → Environment Variables добавь:

| Переменная | Значение |
|---|---|
| BITRIX_WEBHOOK | https://pie24.bitrix24.ru/rest/1/05p5j3f6c7jrqtbt/ |
| ENTITY_TYPE_ID | 1056 |
| SMS_PROVIDER | test (потом заменишь на exolve) |

После добавления переменных — нажми Redeploy.

## Шаг 4 — Проверить подключение к Bitrix

Открой в браузере:
https://твой-проект.vercel.app/api/verify-otp

Должен прийти ответ: {"error":"Телефон и код обязательны"}
Это значит API работает.

## Шаг 5 — Найти правильные названия полей в Bitrix

Это важно! Поля договора (дата начала, конца, сумма) в каждом Bitrix называются по-своему.

Зайди в браузере:
https://pie24.bitrix24.ru/rest/1/05p5j3f6c7jrqtbt/crm.item.list?entityTypeId=1056&limit=1

Найди в ответе поля типа UF_CRM_XXXXXXXX — это и есть твои кастомные поля.
Открой файл api/_bitrix.js и в функции getClientContract замени:
- ufCrm_CONTRACT_START → реальное название поля даты начала
- ufCrm_CONTRACT_END → реальное название поля даты окончания  
- ufCrm_RENT_AMOUNT → реальное название поля суммы аренды
- ufCrm_ADDRESS → реальное название поля адреса

## Шаг 6 — Подключить SMS (когда будешь готов)

1. Зарегистрируйся на exolve.ru (МТС)
2. Получи API-ключ и номер отправителя
3. В Vercel добавь переменные:
   - SMS_PROVIDER = exolve
   - SMS_API_KEY = твой ключ
   - SMS_FROM = твой номер отправителя

## Структура проекта

```
lk-arenda/
├── api/
│   ├── _bitrix.js      # утилиты Bitrix + SMS
│   ├── send-otp.js     # отправка SMS-кода
│   ├── verify-otp.js   # проверка кода + данные клиента
│   ├── repair.js       # заявка на ремонт
│   └── extend.js       # продление договора
├── public/
│   ├── index.html      # главная страница
│   ├── css/style.css   # стили
│   └── js/app.js       # логика фронтенда
├── vercel.json         # конфиг Vercel
└── package.json
```

## Тестовый режим SMS

Пока SMS_PROVIDER=test, код авторизации выводится в логи Vercel.
Vercel → твой проект → Functions → send-otp → Logs
