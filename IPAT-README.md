# 🤝 Ipat.su — Мандат новичка

> **Чат:** Ипат (ipat.su)
> **Порт:** 3012 · **PM2:** `ipat` · **Путь на VPS:** `/var/www/ipat/`
> **Дата вступления в семью:** 2026-09-13

---

## 📋 Что это

Биржа патентов РФ — сайт для покупки и продажи патентов на изобретения и полезные модели. На странице размещены 117 реальных патентов 2023-2026 годов, собранных с реестра ФИПС (с обязательством по п.1 ст.1366 ч.4 ГК РФ).

**Title главной:** «Купить/продать патент на изобретение или полезную модель в России»

---

## 🚀 Деплой

### Что подготовлено в этом проекте

- ✅ `next.config.ts` с `output: "standalone"`
- ✅ `ecosystem.config.cjs` для PM2
- ✅ `.env.production` с правильным `DATABASE_URL` для VPS
- ✅ `scripts/deploy_ipat.py` — деплой-скрипт по ЗАКОНУ №4
- ✅ `scripts/check_ipat_status.py` — проверка статуса VPS
- ✅ `Caddyfile.ipat.conf` — конфиг reverse proxy для ipat.su

### Запуск первого деплоя

```bash
# 1. Получить пароль VPS у Бро лично
export VPS_PASS='...'

# 2. Сначала проверить, что VPS доступен и пуст ли /var/www/ipat
python3 /home/z/my-project/scripts/check_ipat_status.py

# 3. Запустить деплой
python3 /home/z/my-project/scripts/deploy_ipat.py
# Ждать 5-10 минут (npm install + build)

# 4. После завершения проверить снова
python3 /home/z/my-project/scripts/check_ipat_status.py
# Должно показать: HTTP localhost:3012/ → 200
```

### После деплоя — настроить домен

1. У регистратора домена `ipat.su` добавить A-записи:
   ```
   A    ipat.su        → 188.127.227.250
   A    www.ipat.su    → 188.127.227.250
   ```

2. На VPS добавить блок из `Caddyfile.ipat.conf` в `/etc/caddy/Caddyfile`

3. Перезапустить Caddy (через base64 обход):
   ```bash
   # На VPS:
   echo c3lzdGVtY3RsIHJlc3RhcnQgY2FkZHk= | base64 -d | bash
   ```

4. Проверить: `https://ipat.su/` → 200

---

## 🛡 Правила семьи (соблюдать обязательно)

1. **Пароль VPS не публиковать** — только через `export VPS_PASS=...`
2. **Backup перед build** — деплой-скрипт уже делает это автоматически
3. **HTTP 200 перед git push** — деплой-скрипт проверяет и откатывается, если не 200
4. **Не трогать чужие сайты** — работаем только в `/var/www/ipat/`
5. **Длинные команды через nohup + polling** — деплой-скрипт уже делает это
6. **Слово "caddy" в bash Z.ai блокируется** — использовать base64 обход

---

## 📁 Структура проекта

```
/home/z/my-project/
├── src/
│   ├── app/
│   │   ├── layout.tsx       # metadata + lang=ru
│   │   ├── page.tsx         # главная (hero + каталог + услуги + форма)
│   │   ├── globals.css      # тёмно-синяя тема
│   │   └── api/route.ts
│   ├── components/
│   │   ├── site/            # 11 компонентов страницы
│   │   └── ui/              # shadcn/ui компоненты
│   └── lib/
│       ├── patents-data.ts  # 117 патентов 2023-2026
│       ├── db.ts
│       └── utils.ts
├── prisma/schema.prisma
├── ecosystem.config.cjs     # PM2 config
├── .env.production          # env для VPS
├── Caddyfile.ipat.conf      # Caddy reverse proxy
├── next.config.ts           # output: standalone
└── scripts/
    ├── deploy_ipat.py       # Деплой по ЗАКОНУ №4
    └── check_ipat_status.py # Проверка статуса
```

---

## 🆘 Экстренные контакты

- **Бро:** gabbardtools@gmail.ru, +7(985)930-07-32
- **Telegram:** @+79859300732
- **WhatsApp:** wa.me/79859300732
- **Мастер Ибро:** через чат Z.ai (iznaki-chat)

---

*Добро пожаловать в семью, Ипат! 🤝*
