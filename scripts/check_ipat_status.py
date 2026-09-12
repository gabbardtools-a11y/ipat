#!/usr/bin/env python3
"""
IPAT.SU — STATUS CHECK

Проверка статуса VPS без деплоя.
Запускать с паролем в env:
  export VPS_PASS='...'
  python3 scripts/check_ipat_status.py
"""
import os
import sys
import base64
import paramiko

HOST = "188.127.227.250"
USER = "root"
SITE_PATH = "/var/www/ipat"
PM2_NAME = "ipat"
PORT = 3012


def main():
    pw = os.environ.get("VPS_PASS")
    if not pw:
        print("❌ Не задан VPS_PASS")
        print("   export VPS_PASS='...'; python3 scripts/check_ipat_status.py")
        sys.exit(1)

    print("=" * 60)
    print(f"  IPAT.SU — STATUS CHECK")
    print(f"  VPS: {HOST}  |  PORT: {PORT}  |  PM2: {PM2_NAME}")
    print("=" * 60)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(
            HOST,
            username=USER,
            password=pw,
            timeout=20,
            banner_timeout=20,
            auth_timeout=20,
        )
    except Exception as e:
        print(f"❌ Не удалось подключиться: {e}")
        sys.exit(1)

    def run(cmd, label=""):
        if label:
            print(f"\n→ {label}")
        i, o, e = client.exec_command(cmd, timeout=15)
        out = o.read().decode().rstrip()
        return out

    # 1. Uptime + load
    print("\n" + "─" * 40)
    print("SERVER STATUS")
    print("─" * 40)
    print(run("uptime"))
    print(run("whoami; hostname; uname -a"))
    print(run("df -h / | tail -1"))
    print(run("free -m | head -3"))

    # 2. Сайт папка
    print("\n" + "─" * 40)
    print(f"SITE PATH: {SITE_PATH}")
    print("─" * 40)
    print(run(f"ls -la {SITE_PATH}/ 2>&1 | head -15"))
    print(run(f"test -d {SITE_PATH}/.git && echo 'Git: yes' || echo 'Git: no'"))
    print(run(f"test -d {SITE_PATH}/node_modules && echo 'node_modules: yes' || echo 'node_modules: no'"))
    print(run(f"test -f {SITE_PATH}/.next/standalone/server.js && echo 'standalone build: yes' || echo 'standalone build: no'"))

    # 3. PM2
    print("\n" + "─" * 40)
    print("PM2 PROCESSES (ipat only)")
    print("─" * 40)
    print(run(f"pm2 list 2>/dev/null | grep -E 'name|{PM2_NAME}|online|stopped|errored' || echo 'PM2 not running'"))

    # 4. HTTP check
    print("\n" + "─" * 40)
    print(f"HTTP CHECK localhost:{PORT}")
    print("─" * 40)
    code = run(f"curl -s -o /dev/null -w '%{{http_code}}' --max-time 10 http://localhost:{PORT}/ 2>&1 || echo 'no response'")
    print(f"  → HTTP {code}")

    # 5. PM2 logs (last 10 lines)
    print("\n" + "─" * 40)
    print(f"PM2 LOGS ({PM2_NAME} — last 10 lines)")
    print("─" * 40)
    print(run(f"pm2 logs {PM2_NAME} --lines 10 --nostream 2>&1 | tail -15"))

    # 6. Caddy config (через base64)
    print("\n" + "─" * 40)
    print("REVERSE PROXY CONFIG")
    print("─" * 40)
    b64 = base64.b64encode("grep -A5 'ipat.su' /etc/caddy/Caddyfile 2>/dev/null || echo 'no ipat.su config'".encode()).decode()
    out = run(f"echo {b64} | base64 -d | bash")
    print(out)

    client.close()
    print("\n✅ Check complete")


if __name__ == "__main__":
    main()
