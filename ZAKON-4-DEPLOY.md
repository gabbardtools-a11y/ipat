# 🚀 ЗАКОН №4 — ДЕПЛОЙ: эталонный паттерн

> **Версия:** 1.0
> **Принят:** 2026-09-02
> **Статус:** ⚖️ ОБЯЗАТЕЛЕН к исполнению всеми чатами семьи
> **Дополнение к:** ЗАКОН №1 (VPS), ЗАКОН №2 (знаки), ЗАКОН №3 (трёхъязычие)

---

## 📜 Преамбула

После серии инцидентов с зависанием bash-сессий (Аторос, Захар, другие чаты) и нескольких случаев потери данных на проде, Бро постановил: **унифицировать процедуру деплоя для всех сайтов семьи**. Этот закон описывает единственно правильный паттерн деплоя и анти-паттерны, которые запрещены.

**Применяется ко всем 10 сайтам семьи:**
- iznaki.ru, naytea.ru, мкту.рус, seismos.ru, aipat.ru, струнино.su, 3axap.su, delaved.su, ipvsem.ru, lintes.ru (и будущим)

---

## 🎯 Главная проблема

Bash-сессия в sandbox Z.ai зависает, когда:
1. Python+paramiko держит SSH-соединение **>30-60 секунд непрерывно**
2. Команда выводит **большой объём логов** в stdout/stderr
3. Долгая команда (`npm build`, `apt install`, `git push`) **блокирует SSH-канал**

Симптом: Bash-инструмент возвращает `403 Forbidden` и не отвечает до нажатия **Restart** в правом верхнем углу.

---

## ✅ ЭТАЛОННЫЙ ПАТТЕРН ДЕПЛОЯ

### Принципы (5 золотых правил)

| № | Принцип | Зачем |
|---|---------|-------|
| 1 | **Backup перед любым изменением** | Откат за 5 сек если что-то сломалось |
| 2 | **Background build через `nohup`** | SSH-сессия свободна, bash не виснет |
| 3 | **Polling каждые 15-20 сек** | Короткие неблокирующие команды |
| 4 | **SFTP для правок кода, не `sed`/`cat` на VPS** | Видишь что заливаешь, есть подсветка |
| 5 | **HTTP 200 проверка перед `git commit`** | Не пушим сломанный код на GitHub |

---

### Эталонный скрипт-шаблон

```python
#!/usr/bin/env python3
"""Эталонный деплой-скрипт. Копировать и адаптировать под свой сайт."""
import paramiko, time, os

HOST = '188.127.227.250'      # VPS IP
USER = 'root'
PASS = '[REDACTED:VPS_PASSWORD]'         # VPS пароль
SITE_PATH = '/var/www/iznaki' # путь к проекту на VPS
PM2_NAME = 'iznaki'           # имя процесса в PM2
PORT = 3001                   # локальный порт для проверки

LOCAL_FILES = [
    # (локальный путь, путь на VPS)
    ('/home/z/my-project/src/app/page.tsx',
     '/var/www/iznaki/src/app/page.tsx'),
    # ...список изменившихся файлов
]

print('[1/7] Connect')
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(HOST, username=USER, password=[REDACTED] timeout=15)

print('[2/7] SFTP upload')
sftp = client.open_sftp()
for local, remote in LOCAL_FILES:
    sftp.put(local, remote)
sftp.close()

print('[3/7] Backup .next/standalone')
client.exec_command(
    f'cp -r {SITE_PATH}/.next/standalone /tmp/{PM2_NAME}_bak && echo OK',
    timeout=60)

print('[4/7] Start build in background (nohup)')
transport = client.get_transport()
cmd = (f'cd {SITE_PATH} && rm -f /tmp/{PM2_NAME}_done /tmp/{PM2_NAME}_log && '
       f'nohup bash -c "NODE_ENV=production npm run build > /tmp/{PM2_NAME}_log 2>&1; '
       f'echo EXIT=$? > /tmp/{PM2_NAME}_done" > /dev/null 2>&1 < /dev/null &')
chan = transport.open_session()
chan.exec_command(cmd)
time.sleep(2)
chan.close()  # ← КРИТИЧНО: закрываем канал, SSH свободен

print('[5/7] Poll build status (НЕ держит SSH)')
max_wait = 600  # 10 минут максимум
start = time.time()
while time.time() - start < max_wait:
    elapsed = int(time.time() - start)
    i, o, e = client.exec_command(
        f'if [ -f /tmp/{PM2_NAME}_done ]; then echo "=== DONE ==="; '
        f'cat /tmp/{PM2_NAME}_done; tail -5 /tmp/{PM2_NAME}_log; '
        f'else echo "RUNNING"; tail -1 /tmp/{PM2_NAME}_log 2>/dev/null; fi',
        timeout=15)
    out = o.read().decode().rstrip()
    if elapsed % 30 < 15 or 'DONE' in out:
        print(f'  [{elapsed}s] {out[:160]}')
    if '=== DONE ===' in out:
        break
    time.sleep(20)

print('[6/7] Restart PM2 + verify HTTP')
client.exec_command(
    f'pm2 restart {PM2_NAME} --update-env && sleep 4 && echo OK',
    timeout=30)
i, o, e = client.exec_command(
    f'curl -s -o /dev/null -w "%{{http_code}}" http://localhost:{PORT}/',
    timeout=15)
http_code = o.read().decode().rstrip()
print(f'  HTTP: {http_code}')
assert http_code == '200', f'❌ HTTP не 200, откатывайся!'

print('[7/7] Cleanup + Git commit + push')
client.exec_command(f'rm -rf /tmp/{PM2_NAME}_bak')
client.exec_command(
    f'cd {SITE_PATH} && git add -A && '
    f'git commit -m "feat: изменения" 2>&1 | tail -3',
    timeout=30)
client.exec_command(
    f'cd {SITE_PATH} && git push origin main 2>&1 | tail -3',
    timeout=60)
client.close()
print('✅ Deploy complete')
```

---

## ❌ АНТИ-ПАТТЕРНЫ (ЗАПРЕЩЕНЫ)

### Анти-паттерн 1: «Всё в одну длинную `&&` команду»

```bash
# ❌ ТАК НЕЛЬЗЯ
ssh root@vps 'apt install -y p7zip-full && cd /var/www/site &&
tar -xzf /tmp/deploy.tar.gz && npm install &&
npx prisma db push --accept-data-loss &&
npm run build && pm2 restart site &&
git add -A && git commit -m "..." && git push'
```

**Почему плохо:** Если падает на шаге 4 из 7 — первые 3 уже выполнились, а rollback не сработал. Хаос на проде.

**Как надо:** Каждый шаг — отдельная `client.exec_command()` с проверкой результата перед следующим.

---

### Анти-паттерн 2: `prisma db push --accept-data-loss` без необходимости

```bash
# ❌ ТАК НЕЛЬЗЯ (если schema не менялась)
npx prisma db push --accept-data-loss
```

**Почему плохо:** Флаг `--accept-data-loss` Prisma требует **только когда schema дрейфовала от БД**. Запускать его на каждом деплое «на всякий случай» — рано или поздно **потеряете продакшн-данные**.

**Когда можно:** Только когда ты реально изменил `prisma/schema.prisma` и понимаешь последствия. В 95% деплоев Prisma вообще не трогают.

---

### Анти-паттерн 3: `sed` / `cat > file << EOF` для правки кода на VPS

```bash
# ❌ ТАК НЕЛЬЗЯ
ssh root@vps 'cat > /var/www/site/src/app/api/upload/route.ts << EOF
... 100 строк кода ...
EOF'
```

**Почему плохо:**
- Нет подсветки синтаксиса
- Одна ошибка в heredoc → битый файл → сборка падает → git push успел пройти → на GitHub битый код
- Откатить сложнее

**Как надо:** Делай правки **локально в sandbox** (Write/Edit tool с подсветкой), потом заливай через SFTP.

---

### Анти-паттерн 4: `npm install` и `npm run build` на VPS без `output: "standalone"`

**Почему плохо:** Каждый деплой нагружает VPS на 2-3 минуты, занимает RAM, рискует OOM-kill.

**Как надо:** В `next.config.ts` поставь `output: "standalone"` — это позволяет собрать локально и залить готовый `.next/standalone`. **Альтернатива:** собирай на VPS через background `nohup`, не блокируя SSH.

---

### Анти-паттерн 5: Долгий SSH без polling

```python
# ❌ ТАК НЕЛЬЗЯ — bash зависнет
stdin, stdout, stderr = client.exec_command(
    'cd /var/www/site && npm run build',  # 2-3 минуты блокирует SSH
    timeout=300)
print(stdout.read().decode())  # никогда не дойдёт сюда, bash упадёт
```

**Как надо:** Запускай в background через `nohup`, закрывай канал, потом polling короткими командами:

```python
# ✅ ПРАВИЛЬНО
chan = transport.open_session()
chan.exec_command('nohup bash -c "npm run build > /tmp/log 2>&1; echo DONE > /tmp/done" &')
time.sleep(2)
chan.close()  # ← SSH свободен

# Polling каждые 20 сек
while True:
    i, o, e = client.exec_command('cat /tmp/done 2>/dev/null || echo RUNNING', timeout=10)
    if 'DONE' in o.read().decode():
        break
    time.sleep(20)
```

---

### Анти-паттерн 6: Git push до проверки HTTP

```python
# ❌ ТАК НЕЛЬЗЯ
client.exec_command('git push origin main')
# Если сборка упала — мы уже запушили сломанный код
```

**Как надо:** Сначала `pm2 restart` → `curl HTTP 200` → **только потом** `git commit` и `git push`. Если HTTP не 200 — откат к `/tmp/bak` и НЕ пушим.

---

## 📋 ЧЕК-ЛИСТ ПЕРЕД КАЖДЫМ ДЕПЛОЕМ

- [ ] Список изменившихся файлов составлен
- [ ] Локально проверено: `curl http://localhost:3000/` → 200
- [ ] VPS доступен по SSH (проверка `client.connect()` прошла)
- [ ] Backup-команда добавлена в скрипт (`cp -r .next/standalone /tmp/bak`)
- [ ] Build запускается через `nohup` + polling, НЕ через блокирующий `exec_command`
- [ ] После restart проверяется `curl HTTP 200`
- [ ] Git commit только после HTTP 200
- [ ] Git push в `main` — последний шаг
- [ ] Backup удаляется (`rm -rf /tmp/bak`) только после успешного push

---

## 🆘 План отката (ROLLBACK)

Если после `pm2 restart` сайт упал (HTTP не 200):

```python
# 1. Восстановить standalone из бэкапа
client.exec_command(
    f'rm -rf {SITE_PATH}/.next/standalone && '
    f'mv /tmp/{PM2_NAME}_bak {SITE_PATH}/.next/standalone',
    timeout=30)

# 2. Restart PM2 с чистым env
client.exec_command(f'pm2 restart {PM2_NAME} --update-env', timeout=30)

# 3. Проверить HTTP
i, o, e = client.exec_command(
    f'curl -s -o /dev/null -w "%{{http_code}}" http://localhost:{PORT}/',
    timeout=15)
http_code = o.read().decode().rstrip()
assert http_code == '200', '❌ ROLLBACK НЕ ПОМОГ — звони Бро'

# 4. НЕ ДЕЛАЕМ git push (оставляем код на VPS, но GitHub не трогаем)
print('✅ Откатились. Код на GitHub не пострадал.')
```

---

## ⏱ ТАЙМ-АУТЫ И ЛИМИТЫ

| Операция | Тайм-аут | Комментарий |
|----------|----------|-------------|
| `client.connect()` | 15 сек | Если дольше — VPS недоступен |
| `sftp.put()` (1 файл) | 30 сек | Большие файлы — повышать |
| `exec_command` короткая | 15-30 сек | `ls`, `cat`, `curl` |
| `exec_command` PM2 restart | 30 сек | `--update-env` может тормозить |
| Background build | max 600 сек (10 мин) | Polling каждые 20 сек |
| Git push | 60 сек | Большие коммиты — повышать |

**Если bash упал `403 Forbidden`:**
1. НЕ повторять ту же команду
2. Попросить Бро нажать **Restart** в правом верхнем углу
3. После restart — проверить что на VPS (возможно, build уже идёт)
4. Проверить `/tmp/<pm2>_done` — может, билд уже завершён

---

## 🌐 VPS КООРДИНАЦИЯ (для нескольких чатов)

Если два чата одновременно деплоят на один VPS — использовать **vps-coordination protocol**:

1. Перед деплоем: `git pull origin main` в репо `vps-coordination`
2. Проверить `STATE.json` → `lock.held_by` и `lock.scope`
3. Если lock занят scope-пересекающимся чатом — **СТОП**
4. Взять lock: `lock.held_by = "<my-chat-id>"`, `expires_at = +15 мин`
5. Сделать дело
6. Освободить lock
7. Записать в `AUDIT_LOG.md`

См. подробности: `https://github.com/gabbardtools-a11y/vps-coordination/blob/main/PROTOCOL.md`

---

## 📚 ПРИМЕРЫ РАБОЧИХ ДЕПОЛОЙ-СКРИПТОВ

| Скрипт | Сайт | Что деплоит |
|--------|------|-------------|
| `deploy_zen_logo_prices.py` | iznaki.ru | Лого + шкала цен + hero |
| `deploy_franchises.py` | iznaki.ru | 18 франшиз + страницы |
| `deploy_partners_footer_i18n.py` | iznaki.ru | Partners + Footer i18n |
| `deploy_consciousness_v4.py` | iznaki.ru | Документ сознания v4 |

Все лежат в `/home/z/my-project/scripts/deploy_*.py` — бери любой как образец.

---

## 📖 ССЫЛКИ

- **Этот документ:** https://iznaki.ru/ZAKON-4-DEPLOY.md
- **GitHub (public):** https://github.com/gabbardtools-a11y/iznaki-team-public/blob/main/laws/ZAKON-4-DEPLOY.md
- **ЗАКОН №1 (VPS):** https://iznaki.ru/ZAKON-1-VPS.md
- **ЗАКОН №2 (знаки):** https://iznaki.ru/ZAKON-2-SIGNS.md
- **ЗАКОН №3 (трёхъязычие):** https://iznaki.ru/ZAKON-3-I18N.md
- **Сознание Мастера v4.1:** https://iznaki.ru/GUIDE-CONSCIOUSNESS-v4.md
- **Emergency Backup:** https://iznaki.ru/iznaki-emergency-backup.zip (пароль: [REDACTED]

---

## 🆕 ЧЕК-ЛИСТ ПРИНЯТИЯ НОВОГО ЧАТА СЕМЬИ

При онбординге нового чата (например, для нового сайта) — **обязательно**:

1. Дать прочитать этот ЗАКОН №4 + ЗАКОН №1/2/3
2. Показать эталонный `deploy_*.py` скрипт
3. Объяснить: «берёшь шаблон, меняешь `SITE_PATH`, `PM2_NAME`, `PORT`, `LOCAL_FILES` — запускаешь»
4. Первые 3 деплоя — под контролем Бро или Мастера Ибро
5. Дать доступ к `vps-coordination` репо

---

## ⚖️ САНКЦИИ ЗА НАРУШЕНИЕ

| Нарушение | Последствие |
|-----------|-------------|
| `prisma db push --accept-data-loss` без нужды | Бро откатывает и объясняет |
| `git push` сломанного кода (без HTTP 200 проверки) | Force-push откат на предыдущий коммит |
| Деплой без backup | Предупреждение, при повторе — disable деплоя |
| Параллельный деплой без coordination lock | Force-release lock + разговор с Бро |
| `sed` правки на VPS вместо SFTP | Предупреждение, при повторе — code review |

---

## ✍️ ПОДПИСИ

- **Автор:** Мастер Ибро (iznaki-chat)
- **Одобрено:** Бро (akureg@ya.ru)
- **Консультанты:** Аторос (atoros-chat), Захар (rastix-chat)
- **Дата вступления в силу:** 2026-09-02
- **Пересмотр:** при существенных изменениях в архитектуре VPS или sandbox

---

*⚖️ ЗАКОН №4 — ДЕПЛОЙ. Эталонный паттерн для всех чатов семьи.*
*Один файл — одна инструкция — ноль зависаний.*
